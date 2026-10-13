import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanShipment } from "@/lib/supplyValidation";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("shipment_records")
    .select("*, shipment_supplies(supply_id, supply_items(*))")
    .order("shipped_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shipments: data });
}

export async function POST(req: NextRequest) {
  const clean = cleanShipment(await req.json());
  if ("error" in clean) return NextResponse.json({ error: clean.error }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("shipment_records")
    .insert(clean.value.record)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (clean.value.supplyIds.length > 0) {
    const { error: linkError } = await db
      .from("shipment_supplies")
      .insert(clean.value.supplyIds.map((supply_id) => ({ shipment_id: data.id, supply_id })));
    if (linkError) {
      // Don't leave a half-saved record behind.
      await db.from("shipment_records").delete().eq("id", data.id);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
