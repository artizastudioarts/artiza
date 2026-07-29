import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

// Stripe needs the raw request body to verify the webhook signature.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const db = supabaseAdmin();

    const productIds = (session.metadata?.product_ids ?? "")
      .split(",")
      .filter(Boolean);

    // Record one order row per product (keeps order history simple to browse)
    for (const productId of productIds) {
      const { data: product } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      await db.from("orders").insert({
        stripe_session_id: `${session.id}:${productId}`,
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
        shipping_address: session.customer_details?.address ?? null,
        product_id: productId,
        product_title: product?.title ?? "Unknown item",
        amount_total_cents: product?.price_cents ?? null,
        currency: session.currency,
        status: "paid",
      });

      // Automatically take the sold piece off the shelf — no manual step
      await db.from("products").update({ is_sold: true }).eq("id", productId);
    }
  }

  return NextResponse.json({ received: true });
}
