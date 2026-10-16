import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logOrderEvent } from "@/lib/orderEvents";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (status !== "received" && status !== "processed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { data: request, error } = await db
    .from("withdrawal_requests")
    .update({
      status,
      processed_at: status === "processed" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !request) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 500 });
  }

  // Marking a withdrawal processed also cancels the order — but only when it
  // is safe to do so automatically: the order was matched, the whole order
  // was withdrawn (no single items named) and it isn't cancelled yet.
  // Partial or unmatched withdrawals are left for you to handle by hand.
  let orderUpdate: "cancelled" | "already_cancelled" | "manual" | null = null;
  if (status === "processed") {
    let note = "Widerruf bearbeitet";
    if (!request.order_matched || request.items_note) {
      orderUpdate = "manual";
      note += request.items_note
        ? " – Teilwiderruf, Bestellstatus bitte manuell prüfen"
        : " – keine passende Bestellung, Status nicht geändert";
    } else {
      const { data: rows } = await db
        .from("orders")
        .select("id, status")
        .eq("order_number", request.order_number);
      const open = (rows ?? []).filter((o) => o.status !== "cancelled");
      if (!rows || rows.length === 0) {
        orderUpdate = "manual";
        note += " – Bestellung nicht gefunden";
      } else if (open.length === 0) {
        orderUpdate = "already_cancelled";
        note += " – Bestellung war bereits storniert";
      } else {
        const fromStatus = open.every((o) => o.status === open[0].status) ? open[0].status : "mixed";
        const { error: upErr } = await db
          .from("orders")
          .update({ status: "cancelled" })
          .in("id", open.map((o) => o.id));
        if (upErr) {
          return NextResponse.json({ error: upErr.message }, { status: 500 });
        }
        await logOrderEvent(db, {
          order_number: request.order_number,
          event_type: "status_change",
          from_status: fromStatus,
          to_status: "cancelled",
          source: "withdrawal",
          note: "Automatisch: Widerruf als bearbeitet markiert",
        });
        orderUpdate = "cancelled";
        note += " – Bestellung automatisch storniert";
      }
    }
    if (request.order_matched) {
      await logOrderEvent(db, {
        order_number: request.order_number,
        event_type: "withdrawal_processed",
        source: "withdrawal",
        note,
      });
    }
  }

  return NextResponse.json({ ok: true, orderUpdate });
}
