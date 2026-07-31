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
  const { error } = await db.from("products").insert({
    title: body.title,
    artist_note: body.artist_note || null,
    medium: body.medium || null,
    dimensions: body.dimensions || null,
    price_cents: Math.round(Number(body.price) * 100),
    currency: body.currency || "eur",
    image_url: body.image_url || null,
    image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
    stock_quantity: Math.max(0, Math.round(Number(body.stock_quantity) || 0)),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
