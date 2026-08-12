import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { calcShippingCents, DEFAULT_PRODUCT_WEIGHT_G } from "@/lib/shipping";
import { getLocale } from "@/lib/getLocale";
import { countBillableChars, calcPerCharacterPriceCents, isValidCustomText } from "@/lib/customTextPricing";
import type { ShippingRate, ShippingSettings } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { items, accessToken } = (await req.json()) as {
      items: { id: string; quantity: number; customText?: string }[];
      accessToken?: string | null;
    };

    if (!Array.isArray(items) || items.length === 0) {
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
    const { data: products, error } = await db
      .from("products")
      .select("*")
      .in(
        "id",
        items.map((i) => i.id)
      );

    if (error || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Could not load items" },
        { status: 400 }
      );
    }

    // Never trust the client alone — re-check required custom text, its
    // length limits, and (for per-character priced products) recompute
    // the actual price server-side from the product's real settings.
    // This same function is reused below wherever a price is needed, so
    // there's exactly one place that decides what something costs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products comes from a raw Supabase query with no generated types
    function unitPriceCents(product: any, customText?: string) {
      if (
        product.custom_text_pricing_mode === "per_character" &&
        product.custom_text_price_per_char_cents != null
      ) {
        return calcPerCharacterPriceCents(
          customText?.trim() ?? "",
          product.custom_text_price_per_char_cents
        );
      }
      return product.price_cents;
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) continue;
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
      return sum + unitPriceCents(product, item.customText) * item.quantity;
    }, 0);

    const [{ data: rates }, { data: shippingSettings }] = await Promise.all([
      db.from("shipping_rates").select("*"),
      db.from("shipping_settings").select("*").eq("id", 1).single(),
    ]);

    const settings = shippingSettings as ShippingSettings | null;
    const freeThreshold = settings?.free_standard_threshold_cents ?? null;

    let standardCents = calcShippingCents(
      totalWeightG,
      "standard",
      (rates as ShippingRate[]) ?? []
    );
    if (freeThreshold != null && subtotalCents >= freeThreshold) {
      standardCents = 0;
    }
    const expressCents = calcShippingCents(
      totalWeightG,
      "express",
      (rates as ShippingRate[]) ?? []
    );

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
        cart_items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          customText: item.customText?.trim() || null,
        })),
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
      line_items: items.map((item) => {
        const product = products.find((p) => p.id === item.id)!;
        const text = item.customText?.trim();
        return {
          quantity: item.quantity,
          price_data: {
            currency: product.currency,
            unit_amount: unitPriceCents(product, item.customText),
            product_data: {
              name: product.title,
              description: text ? `${locale === "de" ? "Personalisierung" : "Personalization"}: ${text}` : undefined,
              images: product.image_url ? [product.image_url] : undefined,
            },
          },
        };
      }),
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
