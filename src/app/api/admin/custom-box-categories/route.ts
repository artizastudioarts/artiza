import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET returns every category together with its articles, sorted — the
// admin Custom Box tab renders the whole tree from one call.
export async function GET() {
  const db = supabaseAdmin();
  const [{ data: categories, error: catError }, { data: articles, error: artError }] =
    await Promise.all([
      db.from("custom_box_categories").select("*").order("sort_order", { ascending: true }),
      db.from("custom_box_articles").select("*").order("sort_order", { ascending: true }),
    ]);
  if (catError) return NextResponse.json({ error: catError.message }, { status: 500 });
  if (artError) return NextResponse.json({ error: artError.message }, { status: 500 });
  return NextResponse.json({ categories, articles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();

  const { data: maxRow } = await db
    .from("custom_box_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("custom_box_categories")
    .insert({
      name: body.name,
      name_en: body.name_en || null,
      image_url: body.image_url || null,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("custom_box_categories").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Deleting a category cascades to its articles (on delete cascade).
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("custom_box_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
