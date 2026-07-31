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

    // metadata.cart looks like "productId:qty,productId:qty"
    const cartEntries = (session.metadata?.cart ?? "")
      .split(",")
      .filter(Boolean)
      .map((entry) => {
        const [productId, qty] = entry.split(":");
        return { productId, quantity: Number(qty) || 1 };
      });

    for (const { productId, quantity } of cartEntries) {
      const { data: product } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!product) continue;

      await db.from("orders").insert({
        stripe_session_id: `${session.id}:${productId}`,
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
        phone: session.customer_details?.phone,
        shipping_address: session.customer_details?.address ?? null,
        product_id: productId,
        product_title: product.title,
        quantity,
        amount_total_cents: product.price_cents * quantity,
        currency: session.currency,
        status: "paid",
        // Empty string means guest checkout — store as null, not "".
        user_id: session.metadata?.user_id || null,
      });

      // Automatically deduct stock — no manual step, never goes negative
      const newStock = Math.max(0, product.stock_quantity - quantity);
      await db
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", productId);
    }
  }

  return NextResponse.json({ received: true });
}
