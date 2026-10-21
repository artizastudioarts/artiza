import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { calcShippingCents, DEFAULT_PRODUCT_WEIGHT_G } from "@/lib/shipping";
import { getLocale } from "@/lib/getLocale";
import { countBillableChars, calcPerCharacterPriceCents, isValidCustomText } from "@/lib/customTextPricing";
import { resolveBoxArticles } from "@/lib/customBoxCatalog";
import {
  cleanColorIds,
  loadSpecialColors,
  extraCentsFor,
  colorNames,
  paletteExtraCents,
  DEFAULT_FREE_COLORS,
  DEFAULT_EXTRA_COLOR_CENTS,
} from "@/lib/specialColors";
import type { ShippingRate, ShippingSettings } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { items, customBoxes, accessToken, newsletterOptIn } = (await req.json()) as {
      items: { id: string; quantity: number; customText?: string; variationId?: string; specialColorIds?: string[]; paletteColorIds?: string[] }[];
      customBoxes?: {
        articles: { articleId: string; quantity: number }[];
        notes?: string;
        colorIds?: string[];
        quantity?: number;
      }[];
      accessToken?: string | null;
      newsletterOptIn?: boolean;
    };

    const boxes = customBoxes ?? [];
    // Special add-on colors: keep only clean, unique ids (verified against the database below).
    if (Array.isArray(items)) {
      for (const item of items) {
        item.specialColorIds = cleanColorIds(item.specialColorIds);
        item.paletteColorIds = cleanColorIds(item.paletteColorIds);
      }
    }
    for (const box of boxes) box.colorIds = cleanColorIds(box.colorIds);

    if ((!Array.isArray(items) || items.length === 0) && boxes.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const db = supabaseAdmin();

    // If the shopper is logged in, verify their token server-side (never
    // trust a user id sent directly from the browser) so the order can be
    // linked to their account and show up under "Your orders".
    let userId: string | null = null;
    let userEmail: string | undefined;
    if (accessToken) {
      const { data: userData } = await db.auth.getUser(accessToken);
      if (userData.user) {
        userId = userData.user.id;
        userEmail = userData.user.email;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- no generated types for a raw Supabase query
    let products: any[] = [];
    if (items.length > 0) {
      const { data, error } = await db
        .from("products")
        .select("*")
        .in(
          "id",
          items.map((i) => i.id)
        );
      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: "Could not load items" },
          { status: 400 }
        );
      }
      products = data;
    }

    // Variations belong to a product and always carry their own price —
    // fetched fresh here (never trust a price the client sends) alongside
    // the products themselves.
    const variationIds = items.map((i) => i.variationId).filter(Boolean) as string[];
    const { data: variationRows } =
      variationIds.length > 0
        ? await db.from("product_variations").select("*").in("id", variationIds)
        : { data: [] as { id: string; product_id: string; label: string; price_cents: number }[] };
    const variationsById = new Map(
      (variationRows ?? []).map((v) => [v.id as string, v])
    );

    // Special add-on colors: real prices fetched here (only colors that are
    // still switched on). Every chosen color must still exist.
    const colorsById = await loadSpecialColors(
      db,
      [...new Set(items.flatMap((i) => i.specialColorIds ?? []))],
      true
    );
    for (const item of items) {
      if ((item.specialColorIds ?? []).some((id) => !colorsById.has(id))) {
        return NextResponse.json(
          { error: "A special color you chose is no longer available. Please re-add the item." },
          { status: 400 }
        );
      }
    }

    // Palette colors ("pick your colors"): the real, still-active colors fetched here.
    const { data: paletteRows } = await db
      .from("special_colors")
      .select("*")
      .eq("kind", "palette")
      .eq("active", true);
    const paletteById = new Map(
      ((paletteRows as { id: string; name: string; name_en: string | null }[]) ?? []).map((c) => [c.id, c])
    );
    const paletteNames = (ids: string[]) =>
      ids
        .map((id) => paletteById.get(id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => (locale === "en" ? c.name_en || c.name : c.name));
    const locale = await getLocale();

    // Never trust the client alone — re-check required custom text, its
    // length limits, and (for per-character priced products) recompute
    // the actual price server-side from the product's real settings.
    // This same function is reused below wherever a price is needed, so
    // there's exactly one place that decides what something costs.
    function unitPriceCents(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products comes from a raw Supabase query with no generated types
      product: any,
      customText?: string,
      variationId?: string,
      specialColorIds?: string[],
      paletteColorIds?: string[]
    ) {
      const extraCents =
        extraCentsFor(specialColorIds ?? [], colorsById) +
        (product.color_pick_enabled
          ? paletteExtraCents(
              (paletteColorIds ?? []).length,
              product.color_pick_free_count ?? DEFAULT_FREE_COLORS,
              product.color_pick_extra_cents ?? DEFAULT_EXTRA_COLOR_CENTS
            )
          : 0);
      const baseCents = product.variations_enabled
        ? (variationsById.get(variationId ?? "")?.price_cents ?? 0)
        : product.price_cents;
      if (
        product.custom_text_pricing_mode === "per_character" &&
        product.custom_text_price_per_char_cents != null
      ) {
        return (
          calcPerCharacterPriceCents(
            customText?.trim() ?? "",
            product.custom_text_price_per_char_cents
          ) + extraCents
        );
      }
      return baseCents + extraCents;
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) continue;
      if (product.variations_enabled) {
        const variation = variationsById.get(item.variationId ?? "");
        if (!variation) {
          return NextResponse.json(
            { error: "Please choose an option for this item" },
            { status: 400 }
          );
        }
        if (variation.product_id !== product.id) {
          return NextResponse.json(
            { error: "Invalid selection for this item" },
            { status: 400 }
          );
        }
      }
      // Palette colors: all must still be offered; a product that offers the choice needs at least one.
      const pickedPalette = item.paletteColorIds ?? [];
      if (pickedPalette.some((id) => !paletteById.has(id))) {
        return NextResponse.json(
          { error: "A color you chose is no longer available. Please re-add the item." },
          { status: 400 }
        );
      }
      if (!product.color_pick_enabled && pickedPalette.length > 0) {
        return NextResponse.json({ error: "Invalid color choice for this item" }, { status: 400 });
      }
      if (product.color_pick_enabled && paletteById.size > 0 && pickedPalette.length === 0) {
        return NextResponse.json({ error: "Please choose at least one color" }, { status: 400 });
      }
      const text = item.customText?.trim() ?? "";
      if (product.custom_text_enabled) {
        if (!text) {
          return NextResponse.json(
            { error: "Missing required personalization text" },
            { status: 400 }
          );
        }
        if (!isValidCustomText(text)) {
          return NextResponse.json(
            { error: "Personalization text can only contain English letters, numbers, and spaces" },
            { status: 400 }
          );
        }
        const maxLength = product.custom_text_max_length ?? 30;
        if (text.length > maxLength) {
          return NextResponse.json(
            { error: "Personalization text is too long" },
            { status: 400 }
          );
        }
        const minLength = product.custom_text_min_length ?? 1;
        if (countBillableChars(text) < minLength) {
          return NextResponse.json(
            { error: "Personalization text is too short" },
            { status: 400 }
          );
        }
      }
    }

    const origin = req.headers.get("origin") ?? process.env.SITE_URL!;

    // Add up the total weight of everything in the cart to figure out
    // which shipping price tier applies.
    const totalWeightG = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id);
      const weight = product?.weight_grams ?? DEFAULT_PRODUCT_WEIGHT_G;
      return sum + weight * item.quantity;
    }, 0);

    const subtotalCents = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return sum;
      return sum + unitPriceCents(product, item.customText, item.variationId, item.specialColorIds, item.paletteColorIds) * item.quantity;
    }, 0);

    const [{ data: rates }, { data: shippingSettingsRow }] = await Promise.all([
      db.from("shipping_rates").select("*"),
      db.from("shipping_settings").select("*").eq("id", 1).single(),
    ]);
    const settings = shippingSettingsRow as ShippingSettings | null;

    // Custom box articles (shop products and their options) are looked up
    // fresh here too — never trust a client-sent price.
    const allArticleIds = [...new Set(boxes.flatMap((b) => b.articles.map((a) => a.articleId)))];
    const resolvedArticles = await resolveBoxArticles(db, allArticleIds);
    const minOrderCents = settings?.custom_box_min_order_cents ?? 0;
    const boxShippingCents = settings?.custom_box_shipping_cents ?? 0;

    type ResolvedBoxItem = { categoryLabel: string; articleLabel: string; priceCents: number; quantity: number };
    type ResolvedBox = {
      items: ResolvedBoxItem[];
      subtotalCents: number; // articles + any extra colors
      notes: string | null;
      quantity: number;
      colorNames: string[];
    };
    const boxFreeColors = settings?.custom_box_color_free_count ?? DEFAULT_FREE_COLORS;
    const boxExtraColorCents = settings?.custom_box_color_extra_cents ?? DEFAULT_EXTRA_COLOR_CENTS;

    const resolvedBoxes: ResolvedBox[] = [];
    for (const box of boxes) {
      const items: ResolvedBoxItem[] = [];
      for (const a of box.articles) {
        if (!a.quantity || a.quantity <= 0) continue;
        const article = resolvedArticles.get(a.articleId);
        if (!article) continue;
        items.push({ ...article, quantity: a.quantity });
      }
      const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
      if (items.length === 0 || subtotalCents < minOrderCents) {
        return NextResponse.json(
          { error: "Custom box does not meet the minimum order value" },
          { status: 400 }
        );
      }
      const boxColorIds = box.colorIds ?? [];
      if (boxColorIds.some((id) => !paletteById.has(id))) {
        return NextResponse.json(
          { error: "A color you chose is no longer available. Please re-add the box." },
          { status: 400 }
        );
      }
      if (paletteById.size > 0 && boxColorIds.length === 0) {
        return NextResponse.json({ error: "Please choose at least one color for the box" }, { status: 400 });
      }
      resolvedBoxes.push({
        items,
        colorNames: paletteNames(boxColorIds),
        subtotalCents:
          subtotalCents + paletteExtraCents(boxColorIds.length, boxFreeColors, boxExtraColorCents),
        notes: box.notes?.trim() || null,
        quantity: Math.max(1, box.quantity ?? 1),
      });
    }

    const freeThreshold = settings?.free_standard_threshold_cents ?? null;
    const productSubtotalCents = subtotalCents;

    let standardCents = calcShippingCents(
      totalWeightG,
      "standard",
      (rates as ShippingRate[]) ?? []
    );
    // The free-shipping threshold only ever applies to weight-based
    // product shipping — a custom box's flat fee is charged regardless,
    // added on afterward so it's never zeroed out by the threshold.
    if (freeThreshold != null && productSubtotalCents >= freeThreshold) {
      standardCents = 0;
    }
    const boxCount = resolvedBoxes.reduce((sum, b) => sum + b.quantity, 0);
    standardCents += boxCount * boxShippingCents;
    let expressCents = calcShippingCents(
      totalWeightG,
      "express",
      (rates as ShippingRate[]) ?? []
    );
    expressCents += boxCount * boxShippingCents;

    const standardLabel =
      locale === "de"
        ? standardCents === 0
          ? "Standardversand (kostenlos)"
          : "Standardversand"
        : standardCents === 0
          ? "Standard shipping (free)"
          : "Standard shipping";
    const expressLabel = locale === "de" ? "Expressversand" : "Express shipping";

    // Custom personalization text can't safely travel through Stripe's
    // metadata (500-character cap per value, easily exceeded once you
    // add customer-typed text across multiple items) — stage the real
    // cart contents here instead, and only pass a short reference id.
    const { data: pending, error: pendingError } = await db
      .from("pending_checkouts")
      .insert({
        cart_items: [
          ...items.map((item) => ({
            type: "product",
            productId: item.id,
            quantity: item.quantity,
            customText: item.customText?.trim() || null,
            variationId: item.variationId || null,
            specialColorIds: item.specialColorIds && item.specialColorIds.length > 0 ? item.specialColorIds : null,
            paletteColorIds: item.paletteColorIds && item.paletteColorIds.length > 0 ? item.paletteColorIds : null,
          })),
          ...boxes.map((box) => ({
            type: "custom_box",
            quantity: Math.max(1, box.quantity ?? 1),
            articles: box.articles.filter((a) => a.quantity > 0),
            notes: box.notes?.trim() || null,
            colorIds: box.colorIds && box.colorIds.length > 0 ? box.colorIds : null,
          })),
        ],
      })
      .select("id")
      .single();

    if (pendingError || !pending) {
      console.error("Failed to stage checkout", pendingError);
      return NextResponse.json(
        { error: "Checkout could not be started" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // "card" also covers Apple Pay and Google Pay automatically (when
      // enabled in the Stripe dashboard). PayPal must be activated in
      // Stripe -> Settings -> Payment methods first.
      payment_method_types: ["card", "paypal"],
      customer_email: userEmail,
      phone_number_collection: { enabled: true },
      line_items: [
        ...items.map((item) => {
          const product = products.find((p) => p.id === item.id)!;
          const text = item.customText?.trim();
          const variation = variationsById.get(item.variationId ?? "");
          const nameParts = [product.title, variation?.label].filter(Boolean);
          const pickedColorNames = colorNames(item.specialColorIds ?? [], colorsById, locale === "en" ? "en" : "de");
          const pickedPaletteNames = paletteNames(item.paletteColorIds ?? []);
          const descriptionParts = [
            pickedPaletteNames.length > 0
              ? `${locale === "de" ? "Farbwahl" : "Color choice"}: ${pickedPaletteNames.join(", ")}`
              : "",
            text ? `${locale === "de" ? "Personalisierung" : "Personalization"}: ${text}` : "",
            pickedColorNames.length > 0
              ? `${locale === "de" ? "Spezialfarben" : "Special colors"}: ${pickedColorNames.join(", ")}`
              : "",
          ].filter(Boolean);
          return {
            quantity: item.quantity,
            price_data: {
              currency: product.currency,
              unit_amount: unitPriceCents(product, item.customText, item.variationId, item.specialColorIds, item.paletteColorIds),
              product_data: {
                name: nameParts.join(" — "),
                description: descriptionParts.length > 0 ? descriptionParts.join(" · ") : undefined,
                images: product.image_url ? [product.image_url] : undefined,
              },
            },
          };
        }),
        ...resolvedBoxes.map((box) => {
          const colorsPart =
            box.colorNames.length > 0
              ? `${locale === "de" ? "Farbwahl" : "Color choice"}: ${box.colorNames.join(", ")} | `
              : "";
          const summary = (colorsPart + box.items.map((i) => `${i.articleLabel} ×${i.quantity}`).join(", ")).slice(0, 400);
          return {
            quantity: box.quantity,
            price_data: {
              currency: "eur",
              unit_amount: box.subtotalCents,
              product_data: {
                name: locale === "de" ? "Eigene Box" : "Custom Box",
                description: summary || undefined,
              },
            },
          };
        }),
      ],
      // Shows a native "Add promotion code" field on Stripe's own
      // checkout page — codes themselves are managed in Admin -> Discounts.
      allow_promotion_codes: true,
      shipping_address_collection: {
        // Germany only for now — expand this list once shipping rates
        // for other countries are set up.
        allowed_countries: ["DE"],
      },
      // A simple reminder shown right next to the address fields — no
      // separate mandatory field, just a nudge to include the house
      // number in the same line as the street.
      custom_text: {
        // Shown right above the pay button: makes the payment obligation
        // explicit (§ 312j BGB "Button-Lösung").
        submit: {
          message:
            locale === "de"
              ? "Mit Klick auf „Bezahlen“ gibst du eine zahlungspflichtige Bestellung ab. Preise ohne Ausweis der Umsatzsteuer gemäß § 19 UStG."
              : "By clicking “Pay” you place a binding order with an obligation to pay. Prices without VAT in accordance with § 19 UStG.",
        },
        shipping_address: {
          message:
            locale === "de"
              ? "Bitte gib Straße und Hausnummer gemeinsam an (z. B. Musterstraße 12a)."
              : "Please include the house number with the street (e.g. Musterstraße 12a).",
        },
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: standardCents, currency: "eur" },
            display_name: standardLabel,
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: expressCents, currency: "eur" },
            display_name: expressLabel,
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 1 },
            },
          },
        },
      ],
      metadata: {
        pendingCheckoutId: pending.id,
        // Empty string for guest checkouts — Stripe metadata values can't be null
        user_id: userId ?? "",
        // The customer ticked the newsletter box in the cart. This only starts the
        // double opt-in (a confirmation email); nobody is subscribed until they click it.
        newsletter_optin: newsletterOptIn === true ? "1" : "",
        newsletter_locale: locale === "en" ? "en" : "de",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      // Shorter than Stripe's 24h default so an abandoned-cart email (sent
      // when this session expires unpaid) goes out reasonably promptly.
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Checkout could not be started" },
      { status: 500 }
    );
  }
}
