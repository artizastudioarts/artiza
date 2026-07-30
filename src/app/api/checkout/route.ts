import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json()) as {
      items: { id: string; quantity: number }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: products, error } = await db
      .from("products")
      .select("*")
      .in(
        "id",
        items.map((i) => i.id)
      );

    if (error || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Could not load items" },
        { status: 400 }
      );
    }

    // Re-check stock server-side — never trust the client's cart quantities
    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) continue;
      if (item.quantity > product.stock_quantity) {
        return NextResponse.json(
          {
            error: `Sorry, only ${product.stock_quantity} of "${product.title}" left. Update your cart and try again.`,
          },
          { status: 409 }
        );
      }
    }

    const origin = req.headers.get("origin") ?? process.env.SITE_URL!;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "paypal"],
      line_items: items.map((item) => {
        const product = products.find((p) => p.id === item.id)!;
        return {
          quantity: item.quantity,
          price_data: {
            currency: product.currency,
            unit_amount: product.price_cents,
            product_data: {
              name: product.title,
              images: product.image_url ? [product.image_url] : undefined,
            },
          },
        };
      }),
      shipping_address_collection: {
        allowed_countries: [
          "DE",
          "AT",
          "CH",
          "US",
          "GB",
          "FR",
          "NL",
          "BE",
          "IT",
          "ES",
        ],
      },
      metadata: {
        // productId:quantity pairs, e.g. "abc123:2,def456:1"
        cart: items.map((i) => `${i.id}:${i.quantity}`).join(","),
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Checkout could not be started" },
      { status: 500 }
    );
  }
}
