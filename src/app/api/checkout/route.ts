import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { productIds } = (await req.json()) as { productIds: string[] };

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: products, error } = await db
      .from("products")
      .select("*")
      .in("id", productIds);

    if (error || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Could not load items" },
        { status: 400 }
      );
    }

    const soldOut = products.filter((p) => p.is_sold);
    if (soldOut.length > 0) {
      return NextResponse.json(
        {
          error: `Sorry, "${soldOut[0].title}" just sold. Remove it and try again.`,
        },
        { status: 409 }
      );
    }

    const origin = req.headers.get("origin") ?? process.env.SITE_URL!;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "paypal"],
      line_items: products.map((p) => ({
        quantity: 1,
        price_data: {
          currency: p.currency,
          unit_amount: p.price_cents,
          product_data: {
            name: p.title,
            images: p.image_url ? [p.image_url] : undefined,
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ["DE", "AT", "CH", "US", "GB", "FR", "NL", "BE", "IT", "ES"] },
      metadata: {
        product_ids: products.map((p) => p.id).join(","),
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
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
