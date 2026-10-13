import { supabaseAdmin } from "@/lib/supabase";
import { csvResponse, deDate, toCsv } from "@/lib/csv";

type Linked = {
  supply_items: { kind: string; name: string; supplier: string; batch_number: string } | null;
};

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("shipment_records")
    .select("*, shipment_supplies(supply_id, supply_items(kind, name, supplier, batch_number))")
    .order("shipped_at", { ascending: true });
  if (error) return new Response(error.message, { status: 500 });

  const describe = (s: NonNullable<Linked["supply_items"]>) =>
    `${s.name} (Charge ${s.batch_number}, ${s.supplier})`;

  const rows = (data ?? []).map((r) => {
    const items = ((r.shipment_supplies ?? []) as Linked[])
      .map((l) => l.supply_items)
      .filter((x): x is NonNullable<Linked["supply_items"]> => x !== null);
    const powder = items.filter((i) => i.kind === "casting_powder").map(describe).join(" | ");
    const paints = items.filter((i) => i.kind === "paint").map(describe).join(" | ");
    const other = items.filter((i) => i.kind === "other").map(describe).join(" | ");
    return [deDate(r.shipped_at), r.order_number, r.kit_batch_number, powder, paints, other, r.notes];
  });

  return csvResponse(
    toCsv(
      ["Versanddatum", "Bestellnummer", "Chargennummer Set", "Gießpulver", "Farben", "Sonstiges Material", "Notizen"],
      rows
    ),
    "versandte-pakete.csv"
  );
}
