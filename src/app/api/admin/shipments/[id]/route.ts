import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanShipment } from "@/lib/supplyValidation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clean = cleanShipment(await req.json());
  if ("error" in clean) return NextResponse.json({ error: clean.error }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from("shipment_records").update(clean.value.record).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace the linked supply batches with the new selection.
  const { error: delError } = await db.from("shipment_supplies").delete().eq("shipment_id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  if (clean.value.supplyIds.length > 0) {
    const { error: linkError } = await db
      .from("shipment_supplies")
      .insert(clean.value.supplyIds.map((supply_id) => ({ shipment_id: id, supply_id })));
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { error } = await db.from("shipment_records").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
