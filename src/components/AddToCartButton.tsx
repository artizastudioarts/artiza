"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const alreadyInCart = items.some((i) => i.id === product.id);

  function handleAdd() {
    addItem({
      id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      currency: product.currency,
      image_url: product.image_url,
    });
    setAdded(true);
  }

  if (alreadyInCart || added) {
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
    <button
      onClick={handleAdd}
      className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
    >
      Add to cart
    </button>
  );
}
