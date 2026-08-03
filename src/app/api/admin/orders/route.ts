import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { formatPrice } from "@/lib/types";

const STATUS_LABELS_DE: Record<string, string> = {
  paid: "Bestellung eingegangen",
  shipped: "Versendet",
  cancelled: "Storniert",
};

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  const db = supabaseAdmin();
  const { data: order, error } = await db
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (order?.customer_email) {
    const template = await getEmailTemplate("order_status_changed");
    if (template) {
      const vars = {
        customer_name: order.customer_name ?? "",
        order_number: order.order_number,
        status: STATUS_LABELS_DE[status] ?? status,
        items: `<p>${order.product_title} × ${order.quantity} — ${formatPrice(order.amount_total_cents, order.currency ?? "eur")}</p>`,
      };
      await sendEmail({
        to: order.customer_email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.body, vars),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
