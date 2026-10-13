import { supabaseAdmin } from "@/lib/supabase";
import { csvResponse, deDate, toCsv } from "@/lib/csv";

const KIND_LABELS: Record<string, string> = {
  paint: "Farbe",
  casting_powder: "Gießpulver",
  other: "Sonstiges",
};

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("supply_items")
    .select("*")
    .order("purchased_at", { ascending: true });
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []).map((s) => [
    deDate(s.purchased_at),
    KIND_LABELS[s.kind] ?? s.kind,
    s.name,
    s.supplier,
    s.batch_number,
    s.quantity,
    deDate(s.best_before),
    s.invoice_number,
    s.notes,
  ]);

  return csvResponse(
    toCsv(
      ["Kaufdatum", "Art", "Bezeichnung", "Lieferant", "Chargennummer", "Menge", "MHD", "Rechnungsnummer", "Notizen"],
      rows
    ),
    "materialien.csv"
  );
}
