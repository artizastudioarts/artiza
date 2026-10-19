import { supabasePublic } from "@/lib/supabase";
import type { Product } from "@/lib/types";

// For products that offer options with different prices, the shop list
// shows "from X". Returns product id -> lowest option price, only for
// products whose options do not all cost the same.
export async function getVariationFromPrices(
  products: Product[]
): Promise<Record<string, number>> {
  const ids = products.filter((p) => p.variations_enabled).map((p) => p.id);
  if (ids.length === 0) return {};
  const { data } = await supabasePublic
    .from("product_variations")
    .select("product_id, price_cents")
    .in("product_id", ids);
  const byProduct = new Map<string, number[]>();
  for (const row of (data as { product_id: string; price_cents: number }[]) ?? []) {
    byProduct.set(row.product_id, [...(byProduct.get(row.product_id) ?? []), row.price_cents]);
  }
  const out: Record<string, number> = {};
  for (const [id, prices] of byProduct) {
    const min = Math.min(...prices);
    if (prices.some((p) => p !== min)) out[id] = min;
  }
  return out;
}
