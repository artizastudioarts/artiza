import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { escapeHtml } from "@/lib/escapeHtml";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fallback if the editable template is missing from the database.
const FALLBACK_SUBJECT = "Eingangsbestätigung deines Widerrufs – Bestellung {{order_number}}";
const FALLBACK_BODY = `<p>Hallo {{name}},</p>
<p>wir bestätigen den Eingang deiner Widerrufserklärung zur Bestellung <strong>{{order_number}}</strong> am <strong>{{received_at}}</strong>.</p>
<p>Betroffene Artikel: {{items}}</p>
<p>Wir prüfen deine Angaben und melden uns in Kürze mit den nächsten Schritten zu Rücksendung und Erstattung.</p>`;

function berlinTime(iso: string, locale: "de" | "en") {
  return new Date(iso).toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "long",
    timeStyle: "short",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { name, email, order_number, items, locale, website } = body as Record<string, unknown>;
  const lang: "de" | "en" = locale === "en" ? "en" : "de";

  // Honeypot — real visitors never fill this hidden field. Pretend success.
  if (website) {
    return NextResponse.json({ ok: true, received_at: new Date().toISOString() });
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanOrder =
    typeof order_number === "string" ? order_number.replace(/\s+/g, "").toUpperCase() : "";
  const cleanItems = typeof items === "string" ? items.trim() : "";

  if (
    cleanName.length < 2 ||
    cleanName.length > 200 ||
    cleanEmail.length > 254 ||
    !EMAIL_RE.test(cleanEmail) ||
    cleanOrder.length < 3 ||
    cleanOrder.length > 50 ||
    cleanItems.length > 1000
  ) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Basic abuse protection: this form sends an email to whatever address is
  // typed in, so cap how often it can be used.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count: perEmail }, { count: overall }] = await Promise.all([
    db
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", cleanEmail)
      .gte("created_at", since),
    db
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);
  if ((perEmail ?? 0) >= 5 || (overall ?? 0) >= 60) {
    return NextResponse.json({ error: "too_many" }, { status: 429 });
  }

  // Does this order number + email belong to a real order? Either way the
  // declaration is recorded and acknowledged; this only helps you process it.
  const { data: orderRows } = await db
    .from("orders")
    .select("customer_email")
    .eq("order_number", cleanOrder);
  const matched = (orderRows ?? []).some(
    (o) => (o.customer_email ?? "").trim().toLowerCase() === cleanEmail
  );

  const { data: saved, error } = await db
    .from("withdrawal_requests")
    .insert({
      name: cleanName,
      email: cleanEmail,
      order_number: cleanOrder,
      order_matched: matched,
      items_note: cleanItems || null,
    })
    .select("created_at")
    .single();

  if (error || !saved) {
    console.error("Withdrawal could not be saved", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  const receivedAt = berlinTime(saved.created_at, "de");
  const itemsText = cleanItems ? escapeHtml(cleanItems) : "gesamte Bestellung";

  // Acknowledgment of receipt to the customer (editable in Admin -> Emails).
  const template = await getEmailTemplate("withdrawal_confirmation");
  const vars = {
    name: escapeHtml(cleanName),
    order_number: escapeHtml(cleanOrder),
    received_at: receivedAt,
    items: itemsText,
  };
  await sendEmail({
    to: cleanEmail,
    subject: renderTemplate(template?.subject ?? FALLBACK_SUBJECT, vars),
    html: renderTemplate(template?.body ?? FALLBACK_BODY, vars),
  });

  // Notification to you.
  const owner = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
  if (owner) {
    await sendEmail({
      to: owner,
      subject: `Widerruf eingegangen: Bestellung ${cleanOrder}`,
      html: `
        <p><strong>Neuer Widerruf über das Widerrufsformular.</strong></p>
        <p><strong>Eingang:</strong> ${receivedAt}</p>
        <p><strong>Bestellnummer:</strong> ${escapeHtml(cleanOrder)}
          (${matched ? "passt zu einer Bestellung mit dieser E-Mail-Adresse" : "<strong>keine passende Bestellung gefunden – bitte prüfen</strong>"})</p>
        <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
        <p><strong>E-Mail:</strong> ${escapeHtml(cleanEmail)}</p>
        <p><strong>Betroffene Artikel:</strong> ${itemsText}</p>
        <p>Bearbeiten und abhaken: Admin → Withdrawals.</p>
      `,
      replyTo: cleanEmail,
    });
  }

  return NextResponse.json({
    ok: true,
    received_at: berlinTime(saved.created_at, lang),
  });
}
