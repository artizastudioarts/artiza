import { supabaseAdmin } from "./supabase";
import type { ShippingSettings } from "./types";

export async function getShippingSettings(): Promise<ShippingSettings | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("shipping_settings").select("*").eq("id", 1).single();
  return data as ShippingSettings | null;
}
