import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const order_number = String(body.order_number ?? "").trim();
  const customer_name = String(body.customer_name ?? "").trim();
  const review_text = String(body.review_text ?? "").trim();
  const rating = body.rating ? Math.max(1, Math.min(5, Math.round(Number(body.rating)))) : null;
  const image_url = body.image_url ? String(body.image_url) : null;

  if (!order_number || !customer_name || !review_text) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Order number is the proof of purchase — only real orders can be
  // reviewed. It's no longer unique per row (one order can have several
  // product rows), so just check that at least one match exists.
  const { data: matchingOrders } = await db
    .from("orders")
    .select("id")
    .eq("order_number", order_number)
    .limit(1);

  if (!matchingOrders || matchingOrders.length === 0) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  const { error } = await db.from("reviews").insert({
    order_number,
    customer_name,
    review_text,
    rating,
    image_url,
    status: "pending",
  });

  if (error) {
    // A unique-constraint violation means this order was already reviewed.
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
