import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ["data.promotion.coupon"],
    });
    return NextResponse.json({ codes: promotionCodes.data });
  } catch (err) {
    console.error("Failed to list discount codes", err);
    return NextResponse.json({ error: "Could not load discount codes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { code, type, value, expiresAt, maxRedemptions, firstTimeOnly } = await req.json();

  if (!code || !type || !value) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const coupon = await stripe.coupons.create({
      duration: "once", // this shop only ever does one-time payments, not subscriptions
      percent_off: type === "percent" ? Number(value) : undefined,
      amount_off: type === "fixed" ? Math.round(Number(value) * 100) : undefined,
      currency: type === "fixed" ? "eur" : undefined,
    });

    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: String(code).toUpperCase().trim(),
      expires_at: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      // Blocks anyone who has ever completed a payment before — the
      // customer's very first order only, regardless of which
      // first-time-only code they try.
      restrictions: firstTimeOnly ? { first_time_transaction: true } : undefined,
    });

    return NextResponse.json({ promotionCode });
  } catch (err) {
    console.error("Failed to create discount code", err);
    const message = err instanceof Error ? err.message : "Could not create discount code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
