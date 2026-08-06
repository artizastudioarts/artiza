import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const pdfPath = req.nextUrl.searchParams.get("path");
  if (!pdfPath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { data, error } = await db.storage
    .from("invoices")
    .createSignedUrl(pdfPath, 60 * 5); // 5 minutes — plenty to open/download once

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
