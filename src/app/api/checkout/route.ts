import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { calcShippingCents, DEFAULT_PRODUCT_WEIGHT_G } from "@/lib/shipping";
import { getLocale } from "@/lib/getLocale";
import { countBillableChars, calcPerCharacterPriceCents, isValidCustomText } from "@/lib/customTextPricing";
import type { ShippingRate, ShippingSettings } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { items, customBoxes, accessToken } = (await req.json()) as {
      items: { id: string; quantity: number; customText?: string; variationId?: string }[];
      customBoxes?: {
        articles: { articleId: string; quantity: number }[];
        notes?: string;
        quantity?: number;
      }[];
      accessToken?: string | null;
    };

    const boxes = customBoxes ?? [];

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

    // Never trust the client alone — re-check required custom text, its
    // length limits, and (for per-character priced products) recompute
    // the actual price server-side from the product's real settings.
    // This same function is reused below wherever a price is needed, so
    // there's exactly one place that decides what something costs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products comes from a raw Supabase query with no generated types
    function unitPriceCents(product: any, customText?: string, variationId?: string) {
      const baseCents = product.variations_enabled
        ? (variationsById.get(variationId ?? "")?.price_cents ?? 0)
        : product.price_cents;
      if (
        product.custom_text_pricing_mode === "per_character" &&
        product.custom_text_price_per_char_cents != null
      ) {
        return calcPerCharacterPriceCents(
          customText?.trim() ?? "",
          product.custom_text_price_per_char_cents
        );
      }
      return baseCents;
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
    const locale = await getLocale();

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
      return sum + unitPriceCents(product, item.customText, item.variationId) * item.quantity;
    }, 0);

    const [{ data: rates }, { data: shippingSettingsRow }] = await Promise.all([
      db.from("shipping_rates").select("*"),
      db.from("shipping_settings").select("*").eq("id", 1).single(),
    ]);
    const settings = shippingSettingsRow as ShippingSettings | null;

    // Custom box articles are looked up fresh here too (never trust a
    // client-sent price) — one query covering every article referenced
    // across all boxes in the cart, plus their categories for labels.
    const allArticleIds = [...new Set(boxes.flatMap((b) => b.articles.map((a) => a.articleId)))];
    const [{ data: articleRows }, { data: categoryRows }] = await Promise.all([
      allArticleIds.length > 0
        ? db.from("custom_box_articles").select("*").in("id", allArticleIds)
        : Promise.resolve({ data: [] as { id: string; category_id: string; label: string; price_cents: number }[] }),
      db.from("custom_box_categories").select("*"),
    ]);
    const articlesById = new Map((articleRows ?? []).map((a) => [a.id as string, a]));
    const categoriesById = new Map((categoryRows ?? []).map((c) => [c.id as string, c]));
    const minOrderCents = settings?.custom_box_min_order_cents ?? 0;
    const boxShippingCents = settings?.custom_box_shipping_cents ?? 0;

    type ResolvedBoxItem = { categoryLabel: string; articleLabel: string; priceCents: number; quantity: number };
    type ResolvedBox = { items: ResolvedBoxItem[]; subtotalCents: number; notes: string | null; quantity: number };

    const resolvedBoxes: ResolvedBox[] = [];
    for (const box of boxes) {
      const items: ResolvedBoxItem[] = [];
      for (const a of box.articles) {
        if (!a.quantity || a.quantity <= 0) continue;
        const article = articlesById.get(a.articleId);
        if (!article) continue;
        const category = categoriesById.get(article.category_id);
        items.push({
          categoryLabel: category?.name ?? "",
          articleLabel: article.label,
          priceCents: article.price_cents,
          quantity: a.quantity,
        });
      }
      const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
      if (items.length === 0 || subtotalCents < minOrderCents) {
        return NextResponse.json(
          { error: "Custom box does not meet the minimum order value" },
          { status: 400 }
        );
      }
      resolvedBoxes.push({
        items,
        subtotalCents,
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
          })),
          ...boxes.map((box) => ({
            type: "custom_box",
            quantity: Math.max(1, box.quantity ?? 1),
            articles: box.articles.filter((a) => a.quantity > 0),
            notes: box.notes?.trim() || null,
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
      // PayPal removed for now — requires a verified PayPal Business
      // account linked in Stripe's live settings first. Add "paypal"
      // back to this array once that's set up.
      payment_method_types: ["card"],
      customer_email: userEmail,
      phone_number_collection: { enabled: true },
      line_items: [
        ...items.map((item) => {
          const product = products.find((p) => p.id === item.id)!;
          const text = item.customText?.trim();
          const variation = variationsById.get(item.variationId ?? "");
          const nameParts = [product.title, variation?.label].filter(Boolean);
          return {
            quantity: item.quantity,
            price_data: {
              currency: product.currency,
              unit_amount: unitPriceCents(product, item.customText, item.variationId),
              product_data: {
                name: nameParts.join(" — "),
                description: text ? `${locale === "de" ? "Personalisierung" : "Personalization"}: ${text}` : undefined,
                images: product.image_url ? [product.image_url] : undefined,
              },
            },
          };
        }),
        ...resolvedBoxes.map((box) => {
          const summary = box.items.map((i) => `${i.articleLabel} ×${i.quantity}`).join(", ").slice(0, 400);
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
