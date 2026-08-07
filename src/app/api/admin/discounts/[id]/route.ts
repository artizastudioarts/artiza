import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active } = await req.json();

  try {
    const promotionCode = await stripe.promotionCodes.update(id, { active: Boolean(active) });
    return NextResponse.json({ promotionCode });
  } catch (err) {
    console.error("Failed to update discount code", err);
    return NextResponse.json({ error: "Could not update discount code" }, { status: 500 });
  }
}
