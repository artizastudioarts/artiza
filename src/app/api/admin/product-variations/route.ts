import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/product-variations?product_id=...
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("product_variations")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variations: data });
}

// PUT — replaces the full list of variations for a product in one go.
// Simpler and safer than per-row create/update/delete endpoints: the
// admin form always submits its whole in-progress list, so a full
// replace (delete-then-insert) matches how the photo gallery is already
// handled in this app and avoids drift between client and server state.
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const productId: string | undefined = body.product_id;
  const variations: unknown = body.variations;

  if (!productId || !Array.isArray(variations)) {
    return NextResponse.json({ error: "Missing product_id or variations" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { error: deleteError } = await db
    .from("product_variations")
    .delete()
    .eq("product_id", productId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  type Row = {
    label: string;
    label_en?: string;
    price: number | string;
    box_contents?: string;
    box_contents_en?: string;
    colors_included?: string;
    colors_included_en?: string;
    image_index?: number | string | null;
    is_default?: boolean;
  };
  const cleaned = (variations as Row[]).filter((v) => v.label && v.label.trim());
  // Exactly one option can be preselected; if none is marked, the first is.
  const defaultIndex = Math.max(0, cleaned.findIndex((v) => v.is_default));
  const rows = cleaned.map((v, i) => {
    const idx =
      v.image_index === "" || v.image_index == null ? null : Math.floor(Number(v.image_index));
    return {
      product_id: productId,
      label: v.label.trim(),
      label_en: v.label_en?.trim() || null,
      price_cents: Math.round(Number(v.price) * 100),
      sort_order: i,
      box_contents: v.box_contents?.trim() || null,
      box_contents_en: v.box_contents_en?.trim() || null,
      colors_included: v.colors_included?.trim() || null,
      colors_included_en: v.colors_included_en?.trim() || null,
      image_index: idx != null && Number.isFinite(idx) && idx >= 0 ? idx : null,
      is_default: i === defaultIndex,
    };
  });

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, variations: [] });
  }

  const { data, error: insertError } = await db
    .from("product_variations")
    .insert(rows)
    .select();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, variations: data });
}
