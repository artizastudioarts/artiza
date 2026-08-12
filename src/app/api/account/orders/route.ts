import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: orders, error } = await db
    .from("orders")
    .select(
      "id, order_number, product_title, quantity, custom_text, amount_total_cents, shipping_cents, currency, status, created_at"
    )
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load orders" },
      { status: 500 }
    );
  }

  return NextResponse.json({ orders });
}
