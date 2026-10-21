import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Admin: manage the optional paid add-on colors (glitter etc.) shown on every
// product page. Prices are in cents in the database, in euros in this API.

function parseHex(v: unknown): string | null {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : null;
}

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("special_colors")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ colors: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const price = Number(body.price);
  if (!name) return NextResponse.json({ error: "Please enter a name" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Please enter a valid price" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { data: maxRow } = await db
    .from("special_colors")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from("special_colors")
    .insert({
      name,
      name_en: String(body.name_en ?? "").trim() || null,
      hex: parseHex(body.hex),
      price_cents: Math.round(price * 100),
      active: body.active !== false,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ color: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Please enter a name" }, { status: 400 });
    updates.name = name;
  }
  if (body.name_en !== undefined) updates.name_en = String(body.name_en).trim() || null;
  if (body.hex !== undefined) updates.hex = parseHex(body.hex);
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Please enter a valid price" }, { status: 400 });
    }
    updates.price_cents = Math.round(price * 100);
  }
  if (body.active !== undefined) updates.active = !!body.active;
  const db = supabaseAdmin();
  const { error } = await db.from("special_colors").update(updates).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("special_colors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
