import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { calcShippingCents, DEFAULT_PRODUCT_WEIGHT_G } from "@/lib/shipping";
import { getLocale } from "@/lib/getLocale";
import type { ShippingRate, ShippingSettings } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { items, accessToken } = (await req.json()) as {
      items: { id: string; quantity: number }[];
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
      return sum + (product?.price_cents ?? 0) * item.quantity;
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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "paypal"],
      customer_email: userEmail,
      phone_number_collection: { enabled: true },
      line_items: items.map((item) => {
        const product = products.find((p) => p.id === item.id)!;
        return {
          quantity: item.quantity,
          price_data: {
            currency: product.currency,
            unit_amount: product.price_cents,
            product_data: {
              name: product.title,
              images: product.image_url ? [product.image_url] : undefined,
            },
          },
        };
      }),
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
        // productId:quantity pairs, e.g. "abc123:2,def456:1"
        cart: items.map((i) => `${i.id}:${i.quantity}`).join(","),
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
