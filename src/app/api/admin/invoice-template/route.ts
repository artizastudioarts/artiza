import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("invoice_template").select("html").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ html: data?.html ?? "" });
}

export async function PATCH(req: NextRequest) {
  const { html } = await req.json();
  if (typeof html !== "string" || !html.trim()) {
    return NextResponse.json({ error: "Missing html" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { error } = await db.from("invoice_template").update({ html }).eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
