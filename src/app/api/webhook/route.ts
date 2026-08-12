import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { generateInvoiceForOrder } from "@/lib/generateInvoice";
import { calcPerCharacterPriceCents } from "@/lib/customTextPricing";
import { formatPrice } from "@/lib/types";
import Stripe from "stripe";

// Stripe needs the raw request body to verify the webhook signature.
export const runtime = "nodejs";
// Generating an invoice PDF (headless Chromium) can take a few seconds,
// especially on a cold start — give it more room than the default.
export const maxDuration = 60;

type PendingCartItem = {
  productId: string;
  quantity: number;
  customText: string | null;
};

async function getCartFromPending(
  db: ReturnType<typeof supabaseAdmin>,
  pendingCheckoutId: string | undefined
): Promise<PendingCartItem[]> {
  if (!pendingCheckoutId) return [];
  const { data } = await db
    .from("pending_checkouts")
    .select("cart_items")
    .eq("id", pendingCheckoutId)
    .single();
  return (data?.cart_items as PendingCartItem[] | undefined) ?? [];
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
    const pendingCheckoutId = session.metadata?.pendingCheckoutId;
    const cartEntries = await getCartFromPending(db, pendingCheckoutId);

    // One order number for the whole checkout, even if it contains
    // several different products — not one per product.
    const { data: orderNumberData } = await db.rpc("generate_order_number");
    const orderNumber: string = orderNumberData ?? "";

    // The shipping cost the customer actually chose and paid at checkout.
    // Stored once, on the first product row, so grouped totals don't
    // double-count it across multiple product lines in the same order.
    const shippingCents = session.shipping_cost?.amount_total ?? 0;

    const itemLines: string[] = [];
    let totalCents = 0;
    let anyInserted = false;
    let isFirstRow = true;

    for (const { productId, quantity, customText } of cartEntries) {
      const { data: product } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!product) continue;

      const unitPrice =
        product.custom_text_pricing_mode === "per_character" &&
        product.custom_text_price_per_char_cents != null
          ? calcPerCharacterPriceCents(customText ?? "", product.custom_text_price_per_char_cents)
          : product.price_cents;
      const lineTotal = unitPrice * quantity;

      const { data: inserted } = await db
        .from("orders")
        .insert({
          stripe_session_id: `${session.id}:${productId}`,
          order_number: orderNumber,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          phone: session.customer_details?.phone,
          shipping_address: session.customer_details?.address ?? null,
          product_id: productId,
          product_title: product.title,
          quantity,
          custom_text: customText,
          amount_total_cents: lineTotal,
          shipping_cents: isFirstRow ? shippingCents : null,
          currency: session.currency,
          status: "paid",
          // Empty string means guest checkout — store as null, not "".
          user_id: session.metadata?.user_id || null,
        })
        .select()
        .single();

      if (inserted) {
        anyInserted = true;
        isFirstRow = false;
        totalCents += lineTotal;
        const personalization = customText
          ? ` — Personalisierung: ${customText}`
          : "";
        itemLines.push(
          `<li>${product.title} × ${quantity}${personalization} — ${formatPrice(lineTotal, session.currency ?? "eur")}</li>`
        );
      }
    }

    if (shippingCents > 0) {
      itemLines.push(
        `<li>Versand — ${formatPrice(shippingCents, session.currency ?? "eur")}</li>`
      );
    }
    totalCents += shippingCents;

    // Generate the invoice PDF — wrapped so a PDF failure never blocks
    // the order itself or the confirmation email going out. Admin can
    // manually regenerate a missing invoice later from the Orders tab.
    let invoiceAttachment: { filename: string; content: string } | undefined;
    if (anyInserted) {
      try {
        const invoice = await generateInvoiceForOrder(orderNumber);
        if (invoice) {
          invoiceAttachment = {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: invoice.pdfBuffer.toString("base64"),
          };
        }
      } catch (err) {
        console.error("Invoice generation failed for order", orderNumber, err);
      }
    }

    // One consolidated confirmation email per checkout, not one per item.
    const email = session.customer_details?.email;
    if (email && anyInserted) {
      const template = await getEmailTemplate("order_confirmation");
      if (template) {
        const vars = {
          customer_name: session.customer_details?.name ?? "",
          order_numbers: orderNumber,
          items: `<ul>${itemLines.join("")}</ul>`,
          total: formatPrice(totalCents, session.currency ?? "eur"),
        };
        await sendEmail({
          to: email,
          subject: renderTemplate(template.subject, vars),
          html: renderTemplate(template.body, vars),
          attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
        });
      }
    }

    // The staged cart has served its purpose — clean it up.
    if (pendingCheckoutId) {
      await db.from("pending_checkouts").delete().eq("id", pendingCheckoutId);
    }
  }

  // The customer reached Stripe's checkout page (so we know their email)
  // but never completed payment, and the session's time limit ran out.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;
    const db = supabaseAdmin();
    const pendingCheckoutId = session.metadata?.pendingCheckoutId;

    if (email) {
      const cartEntries = await getCartFromPending(db, pendingCheckoutId);
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

    // Genuinely abandoned — nothing more will ever reference this staged
    // cart, so clean it up.
    if (pendingCheckoutId) {
      await db.from("pending_checkouts").delete().eq("id", pendingCheckoutId);
    }
  }

  return NextResponse.json({ received: true });
}
