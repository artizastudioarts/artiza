import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { formatPrice } from "@/lib/types";
import Stripe from "stripe";

// Stripe needs the raw request body to verify the webhook signature.
export const runtime = "nodejs";

function parseCart(metadataCart: string | undefined) {
  // metadata.cart looks like "productId:qty,productId:qty"
  return (metadataCart ?? "")
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const [productId, qty] = entry.split(":");
      return { productId, quantity: Number(qty) || 1 };
    });
}

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
    const cartEntries = parseCart(session.metadata?.cart);

    const orderNumbers: string[] = [];
    const itemLines: string[] = [];
    let totalCents = 0;

    for (const { productId, quantity } of cartEntries) {
      const { data: product } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!product) continue;

      const lineTotal = product.price_cents * quantity;

      const { data: inserted } = await db
        .from("orders")
        .insert({
          stripe_session_id: `${session.id}:${productId}`,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          phone: session.customer_details?.phone,
          shipping_address: session.customer_details?.address ?? null,
          product_id: productId,
          product_title: product.title,
          quantity,
          amount_total_cents: lineTotal,
          currency: session.currency,
          status: "paid",
          // Empty string means guest checkout — store as null, not "".
          user_id: session.metadata?.user_id || null,
        })
        .select()
        .single();

      if (inserted) {
        orderNumbers.push(inserted.order_number);
        totalCents += lineTotal;
        itemLines.push(
          `<li>${product.title} × ${quantity} — ${formatPrice(lineTotal, session.currency ?? "eur")} (Bestellnr. ${inserted.order_number})</li>`
        );
      }
    }

    // One consolidated confirmation email per checkout, not one per item.
    const email = session.customer_details?.email;
    if (email && orderNumbers.length > 0) {
      const template = await getEmailTemplate("order_confirmation");
      if (template) {
        const vars = {
          customer_name: session.customer_details?.name ?? "",
          order_numbers: orderNumbers.join(", "),
          items: `<ul>${itemLines.join("")}</ul>`,
          total: formatPrice(totalCents, session.currency ?? "eur"),
        };
        await sendEmail({
          to: email,
          subject: renderTemplate(template.subject, vars),
          html: renderTemplate(template.body, vars),
        });
      }
    }
  }

  // The customer reached Stripe's checkout page (so we know their email)
  // but never completed payment, and the session's time limit ran out.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;

    if (email) {
      const db = supabaseAdmin();
      const cartEntries = parseCart(session.metadata?.cart);
      const siteUrl = process.env.SITE_URL || "";
      const itemLines: string[] = [];

      for (const { productId, quantity } of cartEntries) {
        const { data: product } = await db
          .from("products")
          .select("title")
          .eq("id", productId)
          .single();
        if (!product) continue;
        itemLines.push(
          `<li><a href="${siteUrl}/product/${productId}">${product.title}</a> × ${quantity}</li>`
        );
      }

      if (itemLines.length > 0) {
        const template = await getEmailTemplate("abandoned_cart");
        if (template) {
          const vars = { items: `<ul>${itemLines.join("")}</ul>` };
          await sendEmail({
            to: email,
            subject: renderTemplate(template.subject, vars),
            html: renderTemplate(template.body, vars),
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
