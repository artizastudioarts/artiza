import type { supabaseAdmin } from "@/lib/supabase";
import type { SpecialColor } from "@/lib/types";

/** Most special colors one set can carry (keeps a request and an order reasonable). */
export const MAX_SPECIAL_COLORS = 12;

type Db = ReturnType<typeof supabaseAdmin>;

/** Clean a list of ids coming from the browser: only strings, no duplicates, capped. */
export function cleanColorIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((x): x is string => typeof x === "string"))].slice(0, MAX_SPECIAL_COLORS);
}

/** Server side: the real colors (and prices) for the given ids. Never trust a price from the client. */
export async function loadSpecialColors(db: Db, ids: string[], onlyActive: boolean): Promise<Map<string, SpecialColor>> {
  if (ids.length === 0) return new Map();
  let query = db.from("special_colors").select("*").in("id", ids);
  if (onlyActive) query = query.eq("active", true);
  const { data } = await query;
  return new Map(((data as SpecialColor[]) ?? []).map((c) => [c.id, c]));
}

export function extraCentsFor(ids: string[], colors: Map<string, SpecialColor>): number {
  return ids.reduce((sum, id) => sum + (colors.get(id)?.price_cents ?? 0), 0);
}

export function colorNames(ids: string[], colors: Map<string, SpecialColor>, locale: "de" | "en"): string[] {
  return ids
    .map((id) => colors.get(id))
    .filter((c): c is SpecialColor => !!c)
    .map((c) => (locale === "en" ? c.name_en || c.name : c.name));
}
