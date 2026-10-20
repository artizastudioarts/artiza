import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("email, locale, subscribed_at, confirmed_at")
    .not("confirmed_at", "is", null)
    .order("subscribed_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ["Email,Sprache,Bestätigt am"];
  for (const s of data ?? []) {
    const date = new Date(s.confirmed_at).toLocaleDateString("de-DE");
    rows.push(`${s.email},${s.locale},${date}`);
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-abonnenten.csv"',
    },
  });
}
