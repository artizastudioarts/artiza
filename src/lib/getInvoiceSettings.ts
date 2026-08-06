import { supabaseAdmin } from "./supabase";
import type { InvoiceSettings } from "./types";

export async function getInvoiceSettings(): Promise<InvoiceSettings | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("invoice_settings").select("*").eq("id", 1).single();
  return data as InvoiceSettings | null;
}

export async function getInvoiceTemplateHtml(): Promise<string | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("invoice_template").select("html").eq("id", 1).single();
  return data?.html ?? null;
}
