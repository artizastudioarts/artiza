import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanSupply } from "@/lib/supplyValidation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clean = cleanSupply(await req.json());
  if ("error" in clean) return NextResponse.json({ error: clean.error }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("supply_items")
    .update(clean.value)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { error } = await db.from("supply_items").delete().eq("id", id);
  if (error) {
    // 23503 = foreign key violation: the batch is linked to a shipped package.
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "This batch is linked to shipped packages and can't be deleted, so your trace records stay complete.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
