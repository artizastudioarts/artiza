import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanSupply } from "@/lib/supplyValidation";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("supply_items")
    .select("*")
    .order("purchased_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  const clean = cleanSupply(b);
  if ("error" in clean) return NextResponse.json({ error: clean.error }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("supply_items").insert(clean.value).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
