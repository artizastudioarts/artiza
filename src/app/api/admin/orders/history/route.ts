import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order_number");
  if (!orderNumber) return NextResponse.json({ error: "Missing order_number" }, { status: 400 });
  const { data, error } = await supabaseAdmin()
    .from("order_events")
    .select("*")
    .eq("order_number", orderNumber)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}
