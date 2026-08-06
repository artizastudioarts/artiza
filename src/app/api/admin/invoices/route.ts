import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInvoiceForOrder } from "@/lib/generateInvoice";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order_number");
  const db = supabaseAdmin();

  let query = db.from("invoices").select("*").order("created_at", { ascending: false });
  if (orderNumber) query = query.eq("order_number", orderNumber);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data });
}

// Manually (re-)generate an invoice for an order — used when the
// automatic one at checkout failed, or an order somehow has none yet.
export async function POST(req: NextRequest) {
  const { order_number } = await req.json();
  if (!order_number) {
    return NextResponse.json({ error: "Missing order_number" }, { status: 400 });
  }
  try {
    const invoice = await generateInvoiceForOrder(order_number);
    if (!invoice) {
      return NextResponse.json({ error: "Could not generate invoice" }, { status: 500 });
    }
    return NextResponse.json({ invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    console.error("Manual invoice generation failed", err);
    return NextResponse.json({ error: "Could not generate invoice" }, { status: 500 });
  }
}
