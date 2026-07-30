"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/types";

export default function CartPage() {
  const { items, removeItem, setQuantity } = useCart();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);
  const currency = items[0]?.currency ?? "eur";

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          // Only sent when logged in — lets the order be linked to the
          // account so it shows up under "Your orders".
          accessToken: session?.access_token ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <h1 className="font-display text-3xl italic mb-8">Your cart</h1>

        {items.length === 0 ? (
          <p className="text-ink-soft">
            Your cart is empty.{" "}
            <Link href="/shop" className="underline">
              Browse the shop
            </Link>
            .
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line border-y border-line mb-8">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-display text-lg">{item.title}</p>
                    <p className="text-sm text-ink-soft">
                      {formatPrice(item.price_cents, item.currency)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.id, Number(e.target.value))
                      }
                      className="border border-line px-2 py-2 bg-paper placard-label text-ink-soft"
                    >
                      {Array.from(
                        { length: Math.min(item.stock_quantity, 20) },
                        (_, i) => i + 1
                      ).map((n) => (
                        <option key={n} value={n}>
                          Qty {n}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="placard-label text-ink-soft hover:text-oxblood"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mb-8">
              <span className="placard-label text-ink-soft">Total</span>
              <span className="font-display text-xl">
                {formatPrice(total, currency)}
              </span>
            </div>

            {error && <p className="text-oxblood text-sm mb-4">{error}</p>}

            {user ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-ink text-paper px-6 py-4 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
              >
                {loading ? "Redirecting to checkout…" : "Checkout"}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-ink text-paper px-6 py-4 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
                >
                  {loading ? "Redirecting to checkout…" : "Continue as guest"}
                </button>
                <Link
                  href="/account/login?redirect=/cart"
                  className="block w-full text-center border border-line px-6 py-4 placard-label hover:bg-paper-dim transition-colors"
                >
                  Log in / Sign up to track this order
                </Link>
              </div>
            )}
            <p className="placard-label text-ink-soft mt-3 text-center">
              Card &amp; PayPal accepted via Stripe
            </p>
          </>
        )}
      </main>
    </>
  );
}
