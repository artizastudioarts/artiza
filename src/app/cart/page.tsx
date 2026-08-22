"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { interpolate } from "@/lib/i18n";
import { formatPrice, MAX_CART_QTY } from "@/lib/types";
import FormMessage from "@/components/FormMessage";

export default function CartPage() {
  const { items, removeItem, setQuantity } = useCart();
  const { user, session } = useAuth();
  const { dict } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeThreshold, setFreeThreshold] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/shipping-settings")
      .then((r) => r.json())
      .then((d) => setFreeThreshold(d.free_standard_threshold_cents));
  }, []);

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
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            customText: i.customText,
            variationId: i.variationId,
          })),
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
        <h1 className="font-display text-3xl italic mb-8">{dict.cart.title}</h1>

        {items.length === 0 ? (
          <p className="text-ink-soft">
            {dict.cart.empty}{" "}
            <Link href="/shop" className="underline">
              {dict.cart.browseShop}
            </Link>
            .
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line border-y border-line mb-8">
              {items.map((item) => (
                <li
                  key={item.cartItemId}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-display text-lg">{item.title}</p>
                    {item.variationLabel && (
                      <p className="text-sm text-ink-soft italic">
                        {item.variationLabel}
                      </p>
                    )}
                    {item.customText && (
                      <p className="text-sm text-ink-soft italic">
                        {dict.cart.customTextLabel}: {item.customText}
                      </p>
                    )}
                    <p className="text-sm text-ink-soft">
                      {formatPrice(item.price_cents, item.currency)} {dict.cart.each}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.cartItemId, Number(e.target.value))
                      }
                      className="border border-line px-2 py-2 bg-paper placard-label text-ink-soft"
                    >
                      {Array.from(
                        { length: MAX_CART_QTY },
                        (_, i) => i + 1
                      ).map((n) => (
                        <option key={n} value={n}>
                          {interpolate(dict.cart.qty, { n })}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeItem(item.cartItemId)}
                      className="placard-label text-ink-soft hover:text-oxblood"
                    >
                      {dict.cart.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {freeThreshold != null && (
              <div className="mb-8">
                <p className="placard-label text-ink-soft mb-2">
                  {total >= freeThreshold
                    ? dict.shipping.cartUnlocked
                    : interpolate(dict.shipping.cartProgress, {
                        amount: formatPrice(freeThreshold - total, currency),
                      })}
                </p>
                <div className="h-px bg-line relative">
                  <div
                    className="absolute top-0 left-0 h-px bg-brass transition-[width] duration-300 ease-out"
                    style={{
                      width: `${Math.min(100, (total / freeThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <span className="placard-label text-ink-soft">{dict.cart.total}</span>
              <span className="font-display text-xl">
                {formatPrice(total, currency)}
              </span>
            </div>

            {error && <div className="mb-4"><FormMessage type="error">{error}</FormMessage></div>}

            {user ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-ink text-paper px-6 py-4 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
              >
                {loading ? dict.cart.redirecting : dict.cart.checkout}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-ink text-paper px-6 py-4 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
                >
                  {loading ? dict.cart.redirecting : dict.cart.continueGuest}
                </button>
                <Link
                  href="/account/login?redirect=/cart"
                  className="block w-full text-center border border-line px-6 py-4 placard-label hover:bg-paper-dim transition-colors"
                >
                  {dict.cart.loginTrack}
                </Link>
              </div>
            )}
            <p className="placard-label text-ink-soft mt-3 text-center">
              {dict.cart.paymentNote}
            </p>
          </>
        )}
      </main>
    </>
  );
}
