"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { MAX_CART_QTY } from "@/lib/types";

export type CartItem = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  loaded: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "artshop_cart_v2";

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

  function addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const next = Math.min(existing.quantity + quantity, MAX_CART_QTY);
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: next } : i
        );
      }
      const capped = Math.max(1, Math.min(quantity, MAX_CART_QTY));
      return [...prev, { ...item, quantity: capped }];
    });
  }

  function setQuantity(id: string, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(1, Math.min(quantity, MAX_CART_QTY)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
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
