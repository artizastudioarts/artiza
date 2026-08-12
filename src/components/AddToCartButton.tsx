"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Product, MAX_CART_QTY } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";

export default function AddToCartButton({
  product,
  dict,
}: {
  product: Product;
  dict: Dictionary;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [customText, setCustomText] = useState("");
  const [added, setAdded] = useState(false);

  const router = useRouter();

  const requiresCustomText = product.custom_text_enabled;
  const maxLength = product.custom_text_max_length ?? 30;
  // product is already the locale-resolved display version (same pattern
  // as title/artist_note) — no need to re-check locale here.
  const label = product.custom_text_label || dict.product.customTextDefaultLabel;
  const trimmedCustomText = customText.trim();
  const canAdd = !requiresCustomText || trimmedCustomText.length > 0;

  function handleAdd() {
    if (!canAdd) return;
    addItem(
      {
        id: product.id,
        title: product.title,
        price_cents: product.price_cents,
        currency: product.currency,
        image_url: product.image_url,
        customText: requiresCustomText ? trimmedCustomText : undefined,
      },
      qty
    );
    setAdded(true);
  }

  if (added) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/cart")}
          className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
        >
          {dict.product.viewCart}
        </button>
        <Link
          href="/shop"
          className="border border-line px-6 py-3 placard-label hover:bg-paper-dim transition-colors"
        >
          {dict.product.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requiresCustomText && (
        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {label}
          </label>
          <input
            required
            value={customText}
            onChange={(e) => setCustomText(e.target.value.slice(0, maxLength))}
            maxLength={maxLength}
            className="w-full max-w-xs border border-line px-3 py-2 bg-paper"
          />
          <p className="text-xs text-ink-soft mt-1">
            {customText.length}/{maxLength}
          </p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <select
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="border border-line px-3 py-3 bg-paper placard-label text-ink-soft"
        >
          {Array.from({ length: MAX_CART_QTY }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {interpolate(dict.product.qty, { n })}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
        >
          {dict.product.addToCart}
        </button>
      </div>
    </div>
  );
}
