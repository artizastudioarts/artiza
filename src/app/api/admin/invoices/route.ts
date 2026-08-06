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
// Also handles issuing a credit note (type: "credit_note") for a
// cancelled order that already has an invoice.
export async function POST(req: NextRequest) {
  const { order_number, type } = await req.json();
  if (!order_number) {
    return NextResponse.json({ error: "Missing order_number" }, { status: 400 });
  }

  try {
    let relatedInvoiceNumber: string | undefined;

    if (type === "credit_note") {
      const db = supabaseAdmin();
      const { data: original } = await db
        .from("invoices")
        .select("invoice_number")
        .eq("order_number", order_number)
        .eq("type", "invoice")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!original) {
        return NextResponse.json(
          { error: "No original invoice found for this order yet" },
          { status: 400 }
        );
      }
      relatedInvoiceNumber = original.invoice_number;
    }

    const invoice = await generateInvoiceForOrder(order_number, {
      type: type === "credit_note" ? "credit_note" : "invoice",
      relatedInvoiceNumber,
    });
    if (!invoice) {
      return NextResponse.json({ error: "Could not generate invoice" }, { status: 500 });
    }
    return NextResponse.json({ invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    console.error("Manual invoice generation failed", err);
    return NextResponse.json({ error: "Could not generate invoice" }, { status: 500 });
  }
}
