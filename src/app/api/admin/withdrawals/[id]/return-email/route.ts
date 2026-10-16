import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { escapeHtml } from "@/lib/escapeHtml";
import { logOrderEvent } from "@/lib/orderEvents";

const FALLBACK_SUBJECT = "Rücksendung zu deinem Widerruf – Bestellung {{order_number}}";
const FALLBACK_BODY = `<p>Hallo {{name}},</p>
<p>vielen Dank, wir haben deinen Widerruf zur Bestellung <strong>{{order_number}}</strong> erhalten.</p>
<p>Bitte sende die Ware an:</p>
<p>Artiza Studio<br>Hinterbergstr. 17<br>65207 Wiesbaden<br>Deutschland</p>
<p>Bitte sende die Ware spätestens innerhalb von 14 Tagen zurück. Die Kosten der Rücksendung trägst du.</p>
<p>Sobald das Paket bei uns eingetroffen ist (oder du uns einen Versandnachweis schickst), erstatten wir dir den Betrag auf demselben Zahlungsweg, den du bei der Bestellung genutzt hast.</p>`;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { data: request } = await db.from("withdrawal_requests").select("*").eq("id", id).single();
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const template = await getEmailTemplate("return_instructions");
  const vars = {
    name: escapeHtml(request.name),
    order_number: escapeHtml(request.order_number),
  };
  const sent = await sendEmail({
    to: request.email,
    subject: renderTemplate(template?.subject ?? FALLBACK_SUBJECT, vars),
    html: renderTemplate(template?.body ?? FALLBACK_BODY, vars),
  });
  if (!sent) return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });

  await db
    .from("withdrawal_requests")
    .update({ return_email_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (request.order_matched) {
    await logOrderEvent(db, {
      order_number: request.order_number,
      event_type: "return_email_sent",
      note: "Rücksende-Anweisungen gesendet",
    });
  }
  return NextResponse.json({ ok: true });
}
