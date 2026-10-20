import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { generateInvoiceForOrder } from "@/lib/generateInvoice";
import { calcPerCharacterPriceCents } from "@/lib/customTextPricing";
import { resolveBoxArticles } from "@/lib/customBoxCatalog";
import { formatPrice } from "@/lib/types";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPageContent } from "@/lib/getPageContent";
import { getTermsEmailHtml } from "@/lib/termsEmailHtml";
import Stripe from "stripe";

// Stripe needs the raw request body to verify the webhook signature.
export const runtime = "nodejs";
// Generating an invoice PDF (headless Chromium) can take a few seconds,
// especially on a cold start — give it more room than the default.
export const maxDuration = 60;

type PendingProductItem = {
  type?: "product";
  productId: string;
  quantity: number;
  customText: string | null;
  variationId: string | null;
};

type PendingCustomBoxItem = {
  type: "custom_box";
  quantity: number;
  articles: { articleId: string; quantity: number }[];
  notes: string | null;
};

type PendingCartItem = PendingProductItem | PendingCustomBoxItem;

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

  // Safety net for delayed payment methods: if a checkout ever finishes
  // while the money is still "unpaid", the order is only created once
  // Stripe confirms the payment (checkout.session.async_payment_succeeded).
  // Not used with the current card/PayPal setup.
  const paidSession =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
      ? (event.data.object as Stripe.Checkout.Session)
      : null;
  if (paidSession && paidSession.payment_status !== "unpaid") {
    const session = paidSession;
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
    const ownerLines: string[] = []; // same items, escaped, for your own notification
    let totalCents = 0;
    let anyInserted = false;
    let isFirstRow = true;

    for (const entry of cartEntries) {
      if (entry.type === "custom_box") {
        const resolvedArticles = await resolveBoxArticles(
          db,
          entry.articles.map((a) => a.articleId)
        );
        const resolvedItems = entry.articles
          .filter((a) => a.quantity > 0 && resolvedArticles.has(a.articleId))
          .map((a) => ({ ...resolvedArticles.get(a.articleId)!, quantity: a.quantity }));
        if (resolvedItems.length === 0) continue;

        const boxSubtotal = resolvedItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
        const lineTotal = boxSubtotal * entry.quantity;

        const { data: inserted } = await db
          .from("orders")
          .insert({
            stripe_session_id: `${session.id}:custom_box:${crypto.randomUUID()}`,
            order_number: orderNumber,
            customer_email: session.customer_details?.email,
            customer_name: session.customer_details?.name,
            phone: session.customer_details?.phone,
            shipping_address: session.customer_details?.address ?? null,
            product_id: null,
            product_title: "Custom Box",
            quantity: entry.quantity,
            order_type: "custom_box",
            custom_box_items: resolvedItems,
            custom_box_notes: entry.notes,
            amount_total_cents: lineTotal,
            shipping_cents: isFirstRow ? shippingCents : null,
            currency: session.currency,
            status: "paid",
            user_id: session.metadata?.user_id || null,
          })
          .select()
          .single();

        if (inserted) {
          anyInserted = true;
          isFirstRow = false;
          totalCents += lineTotal;
          const notesPart = entry.notes ? ` — Hinweis: ${entry.notes}` : "";
          itemLines.push(
            `<li>Eigene Box × ${entry.quantity}${notesPart} — ${formatPrice(lineTotal, session.currency ?? "eur")}</li>`
          );
          ownerLines.push(
            `<li><strong>Eigene Box × ${entry.quantity}</strong>${entry.notes ? ` — Hinweis: ${escapeHtml(entry.notes)}` : ""} — ${formatPrice(lineTotal, session.currency ?? "eur")}<br>${resolvedItems
              .map((i) => `${escapeHtml(i.categoryLabel)}: ${escapeHtml(i.articleLabel)} × ${i.quantity}`)
              .join("<br>")}</li>`
          );
        }
        continue;
      }

      const { productId, quantity, customText, variationId } = entry;
      const { data: product } = await db
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!product) continue;

      let variationLabel: string | null = null;
      let baseCents = product.price_cents;
      if (product.variations_enabled && variationId) {
        const { data: variation } = await db
          .from("product_variations")
          .select("*")
          .eq("id", variationId)
          .single();
        if (variation) {
          variationLabel = variation.label;
          baseCents = variation.price_cents;
        }
      }

      const unitPrice =
        product.custom_text_pricing_mode === "per_character" &&
        product.custom_text_price_per_char_cents != null
          ? calcPerCharacterPriceCents(customText ?? "", product.custom_text_price_per_char_cents)
          : baseCents;
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
          variation_label: variationLabel,
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
        const variationPart = variationLabel ? ` (${variationLabel})` : "";
        itemLines.push(
          `<li>${product.title}${variationPart} × ${quantity}${personalization} — ${formatPrice(lineTotal, session.currency ?? "eur")}</li>`
        );
        ownerLines.push(
          `<li><strong>${escapeHtml(product.title)}</strong>${variationLabel ? ` (${escapeHtml(variationLabel)})` : ""} × ${quantity}${customText ? ` — <strong>Personalisierung: ${escapeHtml(customText)}</strong>` : ""} — ${formatPrice(lineTotal, session.currency ?? "eur")}</li>`
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
        const widerrufContent = await getPageContent("widerruf", "de");
        const widerrufHtml = [1, 2, 3, 4]
          .map((n) => ({ h: widerrufContent[`s${n}_heading`], b: widerrufContent[`s${n}_body`] }))
          .filter((s) => s.h && s.b)
          .map((s) => `<p><strong>${s.h}</strong></p><p>${s.b}</p>`)
          .join("");
        const agbHtml = await getTermsEmailHtml();
        const vars = {
          customer_name: session.customer_details?.name ?? "",
          order_numbers: orderNumber,
          items: `<ul>${itemLines.join("")}</ul>`,
          total: formatPrice(totalCents, session.currency ?? "eur"),
          // Links built from SITE_URL so staging emails point at staging
          // and live emails at the live site.
          withdrawal_url: `${process.env.SITE_URL ?? ""}/vertrag-widerrufen`,
          withdrawal_info_url: `${process.env.SITE_URL ?? ""}/widerruf`,
          // Full Widerrufsbelehrung incl. model form, from the editable page text.
          widerrufsbelehrung: widerrufHtml,
          // Full AGB text from the editable Terms page.
          agb: agbHtml,
        };
        await sendEmail({
          to: email,
          subject: renderTemplate(template.subject, vars),
          html: renderTemplate(template.body, vars),
          attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
        });
      }
    }

    // Notification to you: a new order has come in. Never blocks the order.
    if (anyInserted) {
      try {
        const owner = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
        if (owner) {
          const cur = session.currency ?? "eur";
          const a = session.customer_details?.address;
          const address = a
            ? [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country]
                .filter(Boolean)
                .map((x) => escapeHtml(String(x)))
                .join("<br>")
            : "—";
          if (shippingCents > 0) {
            ownerLines.push(`<li>Versand — ${formatPrice(shippingCents, cur)}</li>`);
          }
          await sendEmail({
            to: owner,
            subject: `Neue Bestellung ${orderNumber} – ${formatPrice(totalCents, cur)}`,
            html: `
              <p><strong>Neue Bestellung ${escapeHtml(orderNumber)}</strong></p>
              <ul>${ownerLines.join("")}</ul>
              <p><strong>Gesamt:</strong> ${formatPrice(totalCents, cur)}</p>
              <p><strong>Kunde:</strong> ${escapeHtml(session.customer_details?.name ?? "")}<br>
                 ${escapeHtml(email ?? "")}${session.customer_details?.phone ? `<br>${escapeHtml(session.customer_details.phone)}` : ""}</p>
              <p><strong>Lieferadresse:</strong><br>${address}</p>
              <p>Details: Admin → Orders.</p>
            `,
            replyTo: email ?? undefined,
          });
        }
      } catch (err) {
        console.error("Owner order notification failed", orderNumber, err);
      }
    }

    // The staged cart has served its purpose — clean it up.
    if (pendingCheckoutId) {
      await db.from("pending_checkouts").delete().eq("id", pendingCheckoutId);
    }
  }

  // A delayed payment (direct debit) was rejected by the bank. No order was
  // ever created, so just tell the owner and clean up the staged cart.
  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const db = supabaseAdmin();
    try {
      const owner = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
      if (owner) {
        await sendEmail({
          to: owner,
          subject: "Lastschrift fehlgeschlagen – keine Bestellung angelegt",
          html: `<p>Eine Lastschriftzahlung wurde von der Bank abgelehnt. Es wurde <strong>keine</strong> Bestellung angelegt und nichts muss versendet werden.</p>
            <p><strong>Kunde:</strong> ${escapeHtml(session.customer_details?.name ?? "")} ${escapeHtml(session.customer_details?.email ?? "")}</p>
            <p>Stripe-Zahlung: ${escapeHtml(session.id)}</p>`,
        });
      }
    } catch (err) {
      console.error("Failed-payment notification failed", err);
    }
    const pendingId = session.metadata?.pendingCheckoutId;
    if (pendingId) {
      await db.from("pending_checkouts").delete().eq("id", pendingId);
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

      for (const entry of cartEntries) {
        if (entry.type === "custom_box") {
          itemLines.push(`<li>Eigene Box × ${entry.quantity}</li>`);
          continue;
        }
        const { productId, quantity } = entry;
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
