import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const siteUrl = process.env.SITE_URL ?? req.nextUrl.origin;

  if (!id) {
    return NextResponse.redirect(`${siteUrl}/newsletter/unsubscribed`);
  }

  const db = supabaseAdmin();
  // Deleting outright (rather than just marking inactive) matches what
  // someone clicking "unsubscribe" actually expects — their data is gone,
  // not just hidden.
  await db.from("newsletter_subscribers").delete().eq("id", id);

  return NextResponse.redirect(`${siteUrl}/newsletter/unsubscribed`);
}
