import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/getShippingSettings";

export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json({
    free_standard_threshold_cents: settings?.free_standard_threshold_cents ?? null,
  });
}
