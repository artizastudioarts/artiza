import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderEventInput = {
  order_number: string;
  event_type: "status_change" | "withdrawal_received" | "withdrawal_processed" | "refund_email_sent";
  from_status?: string | null;
  to_status?: string | null;
  source?: "admin" | "withdrawal";
  note?: string | null;
};

// Writes one line of order history. Never throws — logging must not break
// the action it describes.
export async function logOrderEvent(db: SupabaseClient, e: OrderEventInput) {
  try {
    const { error } = await db.from("order_events").insert({
      order_number: e.order_number,
      event_type: e.event_type,
      from_status: e.from_status ?? null,
      to_status: e.to_status ?? null,
      source: e.source ?? "admin",
      note: e.note ?? null,
    });
    if (error) console.error("Could not log order event", error);
  } catch (err) {
    console.error("Could not log order event", err);
  }
}
