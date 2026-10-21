"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { MAX_CART_QTY, CustomBoxOrderItem } from "@/lib/types";

export type CartItem = {
  id: string; // product id, or a generated id for a custom box
  cartItemId: string; // unique per cart line — same product with different custom text/variation gets its own line
  title: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  quantity: number;
  customText?: string;
  variationId?: string;
  variationLabel?: string;
  // Optional paid add-on colors. price_cents already includes them (display only;
  // the checkout re-resolves the real prices server-side from the ids).
  specialColorIds?: string[];
  specialColorLabels?: string[];
  // Colors picked from the palette (product or whole custom box), in the order chosen.
  paletteColorIds?: string[];
  paletteColorLabels?: string[];
  isCustomBox?: boolean;
  customBoxArticles?: { articleId: string; quantity: number }[];
  customBoxNotes?: string;
  // Only used for cart-page display — the checkout request re-resolves
  // real labels/prices server-side, same as everything else.
  customBoxSummary?: CustomBoxOrderItem[];
};

function buildCartItemId(
  productId: string,
  customText?: string,
  variationId?: string,
  specialColorIds?: string[],
  paletteColorIds?: string[]
) {
  const colors = [...(specialColorIds ?? [])].sort().join(",");
  const palette = [...(paletteColorIds ?? [])].sort().join(",");
  return `${productId}::${customText ?? ""}::${variationId ?? ""}::${colors}::${palette}`;
}

type CartContextType = {
  items: CartItem[];
  loaded: boolean;
  addItem: (
    item: Omit<CartItem, "quantity" | "cartItemId">,
    quantity?: number
  ) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "artshop_cart_v3";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage on mount is client-only and can't be done in the initializer (no window during SSR)
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function addItem(
    item: Omit<CartItem, "quantity" | "cartItemId">,
    quantity = 1
  ) {
    const cartItemId = buildCartItemId(item.id, item.customText, item.variationId, item.specialColorIds, item.paletteColorIds);
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        const next = Math.min(existing.quantity + quantity, MAX_CART_QTY);
        return prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: next } : i
        );
      }
      const capped = Math.max(1, Math.min(quantity, MAX_CART_QTY));
      return [...prev, { ...item, cartItemId, quantity: capped }];
    });
  }

  function setQuantity(cartItemId: string, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, MAX_CART_QTY)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(cartItemId: string) {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }

  function clear() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{ items, loaded, addItem, setQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
