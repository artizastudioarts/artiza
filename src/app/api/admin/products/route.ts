import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("products")
    .insert({
      title: body.title,
      artist_note: body.artist_note || null,
      medium: body.medium || null,
      dimensions: body.dimensions || null,
      title_en: body.title_en || null,
      artist_note_en: body.artist_note_en || null,
      medium_en: body.medium_en || null,
      dimensions_en: body.dimensions_en || null,
      price_cents: Math.round(Number(body.price) * 100),
      currency: body.currency || "eur",
      image_url: body.image_url || null,
      image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
      badge: body.badge || null,
      weight_grams: body.weight_grams ?? null,
      custom_text_enabled: !!body.custom_text_enabled,
      custom_text_max_length: body.custom_text_max_length ?? 30,
      custom_text_label: body.custom_text_label || null,
      custom_text_label_en: body.custom_text_label_en || null,
      custom_text_pricing_mode: body.custom_text_pricing_mode === "per_character" ? "per_character" : "fixed",
      custom_text_price_per_char_cents: body.custom_text_price_per_char_cents ?? null,
      custom_text_min_length: body.custom_text_min_length ?? 1,
      variations_enabled: !!body.variations_enabled,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, product: data });
}

export async function PATCH(req: NextRequest) {
  const { id, price, ...fields } = await req.json();
  const db = supabaseAdmin();
  const updateFields: Record<string, unknown> = { ...fields };
  if (price !== undefined) {
    updateFields.price_cents = Math.round(Number(price) * 100);
  }
  const { error } = await db.from("products").update(updateFields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = supabaseAdmin();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
