import type { ShippingMethod, ShippingRate } from "./types";

// Used when a product has no weight set yet, so checkout never breaks —
// a light default rather than blocking the sale.
export const DEFAULT_PRODUCT_WEIGHT_G = 300;

export function calcShippingCents(
  totalWeightG: number,
  method: ShippingMethod,
  rates: ShippingRate[]
): number {
  const matching = rates
    .filter(
      (r) =>
        r.method === method &&
        totalWeightG >= r.min_weight_g &&
        (r.max_weight_g == null || totalWeightG <= r.max_weight_g)
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  return matching[0]?.price_cents ?? 0;
}
