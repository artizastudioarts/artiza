import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page");
  if (!page) {
    return NextResponse.json({ error: "Missing page" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("site_content")
    .select("field_key, label, field_type, value_de, value_en, sort_order")
    .eq("page_key", page)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fields: data });
}

export async function PATCH(req: NextRequest) {
  const { page_key, locale, values } = await req.json();

  if (
    !page_key ||
    (locale !== "de" && locale !== "en") ||
    typeof values !== "object" ||
    values === null
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const column = locale === "de" ? "value_de" : "value_en";

  const results = await Promise.all(
    Object.entries(values as Record<string, string>).map(([field_key, value]) =>
      db
        .from("site_content")
        .update({ [column]: value || null })
        .eq("page_key", page_key)
        .eq("field_key", field_key)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
