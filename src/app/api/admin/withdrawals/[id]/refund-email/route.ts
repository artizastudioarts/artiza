import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { escapeHtml } from "@/lib/escapeHtml";
import { formatPrice } from "@/lib/types";
import { logOrderEvent } from "@/lib/orderEvents";

const FALLBACK_SUBJECT = "Deine Erstattung zur Bestellung {{order_number}}";
const FALLBACK_BODY = `<p>Hallo {{name}},</p>
<p>wir haben deine Erstattung zur Bestellung <strong>{{order_number}}</strong> veranlasst.</p>
<p>Erstattungsbetrag: <strong>{{amount}}</strong></p>
<p>Das Geld geht auf demselben Zahlungsweg zurück, den du bei der Bestellung genutzt hast. Bis die Gutschrift auf deinem Konto erscheint, kann es je nach Bank etwa 5–10 Werktage dauern.</p>`;

// "12,50" or "12.50" -> 1250 (cents); null if not a sensible amount.
function parseEuroToCents(input: unknown): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  return cents > 0 ? cents : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const cents = parseEuroToCents(body?.amount);
  if (cents === null) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: request } = await db.from("withdrawal_requests").select("*").eq("id", id).single();
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const template = await getEmailTemplate("refund_confirmation");
  const amount = formatPrice(cents, "eur");
  const vars = {
    name: escapeHtml(request.name),
    order_number: escapeHtml(request.order_number),
    amount,
  };
  const result = await sendEmail({
    to: request.email,
    subject: renderTemplate(template?.subject ?? FALLBACK_SUBJECT, vars),
    html: renderTemplate(template?.body ?? FALLBACK_BODY, vars),
  });
  if (!result) {
    return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });
  }

  await db
    .from("withdrawal_requests")
    .update({ refund_email_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (request.order_matched) {
    await logOrderEvent(db, {
      order_number: request.order_number,
      event_type: "refund_email_sent",
      note: `Erstattungs-E-Mail gesendet (${amount})`,
    });
  }
  return NextResponse.json({ ok: true });
}
