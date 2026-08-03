import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("email_templates")
    .select("*")
    .order("key");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function PATCH(req: NextRequest) {
  const { key, subject, body } = await req.json();
  if (!key || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { error } = await db
    .from("email_templates")
    .update({ subject, body, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
