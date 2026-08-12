import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const db = supabaseAdmin();
  // A single checkout can produce more than one order row (one per distinct
  // product), each stored as "<stripe session id>:<product id>".
  const { data: orders, error } = await db
    .from("orders")
    .select("order_number, product_title, quantity, custom_text, shipping_cents, currency")
    .like("stripe_session_id", `${sessionId}:%`);

  if (error) {
    return NextResponse.json({ error: "Could not load order" }, { status: 500 });
  }

  return NextResponse.json({ orders });
}
