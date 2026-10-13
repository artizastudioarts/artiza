// Input checks shared by the Supplies and Shipments admin API routes.
// (Kept out of the route files: Next.js only allows HTTP handlers to be
// exported from a route.ts.)

const KINDS = ["paint", "casting_powder", "other"];

export function cleanSupply(b: Record<string, unknown>) {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const optional = (v: unknown) => text(v) || null;

  const kind = text(b.kind);
  const name = text(b.name);
  const supplier = text(b.supplier);
  const batch = text(b.batch_number);
  const purchased = text(b.purchased_at);

  if (!KINDS.includes(kind)) return { error: "Invalid type" };
  if (!name || !supplier || !batch || !purchased) {
    return { error: "Name, supplier, batch number and purchase date are required" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchased)) return { error: "Invalid purchase date" };
  const bestBefore = text(b.best_before);
  if (bestBefore && !/^\d{4}-\d{2}-\d{2}$/.test(bestBefore)) {
    return { error: "Invalid best-before date" };
  }

  return {
    value: {
      kind,
      name,
      supplier,
      batch_number: batch,
      purchased_at: purchased,
      quantity: optional(b.quantity),
      best_before: bestBefore || null,
      invoice_number: optional(b.invoice_number),
      notes: optional(b.notes),
    },
  };
}

export function cleanShipment(b: Record<string, unknown>) {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const orderNumber = text(b.order_number);
  const kitBatch = text(b.kit_batch_number);
  const shippedAt = text(b.shipped_at);
  const supplyIds = Array.isArray(b.supply_ids)
    ? Array.from(new Set(b.supply_ids.filter((x): x is string => typeof x === "string")))
    : [];

  if (!orderNumber || !kitBatch || !shippedAt) {
    return { error: "Order number, kit batch number and shipping date are required" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(shippedAt)) return { error: "Invalid shipping date" };

  return {
    value: {
      record: {
        order_number: orderNumber,
        kit_batch_number: kitBatch,
        shipped_at: shippedAt,
        notes: text(b.notes) || null,
      },
      supplyIds,
    },
  };
}
