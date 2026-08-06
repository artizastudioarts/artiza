import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const orderNumber = req.nextUrl.searchParams.get("order_number");

  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order_number" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Confirm this order actually belongs to the logged-in user before
  // handing out a link to anything.
  const { data: owned } = await db
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .eq("user_id", userData.user.id)
    .limit(1);

  if (!owned || owned.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: invoice } = await db
    .from("invoices")
    .select("pdf_path")
    .eq("order_number", orderNumber)
    .single();

  if (!invoice?.pdf_path) {
    return NextResponse.json({ error: "No invoice yet" }, { status: 404 });
  }

  const { data: signed, error: signError } = await db.storage
    .from("invoices")
    .createSignedUrl(invoice.pdf_path, 60 * 5);

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not create link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
