import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.category_id) {
    return NextResponse.json({ error: "Missing category_id" }, { status: 400 });
  }
  const db = supabaseAdmin();

  const { data: maxRow } = await db
    .from("custom_box_articles")
    .select("sort_order")
    .eq("category_id", body.category_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("custom_box_articles")
    .insert({
      category_id: body.category_id,
      label: body.label,
      label_en: body.label_en || null,
      price_cents: Math.round(Number(body.price) * 100),
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ article: data });
}

export async function PATCH(req: NextRequest) {
  const { id, price, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();
  const updates = { ...fields, ...(price != null ? { price_cents: Math.round(Number(price) * 100) } : {}) };
  const { error } = await db.from("custom_box_articles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("custom_box_articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
