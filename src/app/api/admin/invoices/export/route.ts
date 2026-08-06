import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year");
  const month = req.nextUrl.searchParams.get("month"); // 1-12
  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  const start = new Date(Number(year), Number(month) - 1, 1).toISOString();
  const end = new Date(Number(year), Number(month), 1).toISOString();

  const db = supabaseAdmin();
  const { data: invoices, error } = await db
    .from("invoices")
    .select("invoice_number, order_number, created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: string[] = [
    "Rechnungsnummer,Bestellnummer,Datum,Kunde,Betrag,Währung",
  ];

  for (const inv of invoices ?? []) {
    const { data: orderRows } = await db
      .from("orders")
      .select("customer_name, amount_total_cents, shipping_cents, currency")
      .eq("order_number", inv.order_number);

    const customerName = orderRows?.[0]?.customer_name ?? "";
    const currency = (orderRows?.[0]?.currency ?? "eur").toUpperCase();
    const shipping = orderRows?.find((o) => o.shipping_cents != null)?.shipping_cents ?? 0;
    const productsTotal = (orderRows ?? []).reduce(
      (sum, o) => sum + (o.amount_total_cents ?? 0),
      0
    );
    const totalEuros = ((productsTotal + shipping) / 100).toFixed(2);
    const date = new Date(inv.created_at).toLocaleDateString("de-DE");

    rows.push(
      [
        inv.invoice_number,
        inv.order_number,
        date,
        csvEscape(customerName),
        totalEuros,
        currency,
      ].join(",")
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rechnungen-${year}-${String(month).padStart(2, "0")}.csv"`,
    },
  });
}
