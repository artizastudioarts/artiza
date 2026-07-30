"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, product.stock_quantity - inCart);

  function handleAdd() {
    addItem(
      {
        id: product.id,
        title: product.title,
        price_cents: product.price_cents,
        currency: product.currency,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
      },
      qty
    );
    setAdded(true);
  }

  if (added) {
    return (
      <button
        onClick={() => router.push("/cart")}
        className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
      >
        View cart
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="border border-line px-3 py-3 bg-paper placard-label"
      >
        {Array.from({ length: Math.min(remaining, 20) }, (_, i) => i + 1).map(
          (n) => (
            <option key={n} value={n}>
              Qty {n}
            </option>
          )
        )}
      </select>
      <button
        onClick={handleAdd}
        disabled={remaining === 0}
        className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
      >
        Add to cart
      </button>
    </div>
  );
}
