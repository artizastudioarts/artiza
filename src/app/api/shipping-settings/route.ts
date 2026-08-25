import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/getShippingSettings";

export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json({
    free_standard_threshold_cents: settings?.free_standard_threshold_cents ?? null,
    custom_box_shipping_cents: settings?.custom_box_shipping_cents ?? 0,
    custom_box_min_order_cents: settings?.custom_box_min_order_cents ?? 0,
  });
}
