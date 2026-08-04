import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const [{ data: rates, error: ratesError }, { data: settings, error: settingsError }] =
    await Promise.all([
      db.from("shipping_rates").select("*").order("method").order("sort_order"),
      db.from("shipping_settings").select("*").eq("id", 1).single(),
    ]);

  if (ratesError) return NextResponse.json({ error: ratesError.message }, { status: 500 });
  if (settingsError)
    return NextResponse.json({ error: settingsError.message }, { status: 500 });

  return NextResponse.json({ rates, settings });
}

export async function POST(req: NextRequest) {
  const { method, min_weight_g, max_weight_g, price_cents } = await req.json();
  const db = supabaseAdmin();

  const { data: maxRow } = await db
    .from("shipping_rates")
    .select("sort_order")
    .eq("method", method)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("shipping_rates")
    .insert({
      method,
      min_weight_g,
      max_weight_g: max_weight_g === "" || max_weight_g == null ? null : max_weight_g,
      price_cents,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rate: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // Updating the free-shipping threshold setting
  if (body.setting === "free_standard_threshold_cents") {
    const db = supabaseAdmin();
    const { error } = await db
      .from("shipping_settings")
      .update({ free_standard_threshold_cents: body.value })
      .eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Updating a single rate tier
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("shipping_rates").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = supabaseAdmin();
  const { error } = await db.from("shipping_rates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
