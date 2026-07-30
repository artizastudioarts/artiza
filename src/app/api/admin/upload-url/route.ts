import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { filename } = await req.json();
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const ext = filename.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { data, error } = await db.storage
    .from("artwork")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrlData } = db.storage.from("artwork").getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: publicUrlData.publicUrl,
  });
}
