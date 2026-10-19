"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ProductVariation, formatPrice } from "@/lib/types";

// Shares the customer's chosen option (variation) between the photo
// gallery, the price, the option buttons and the "What's in the box"
// accordion, so picking an option updates all of them at once.
type Ctx = {
  variations: ProductVariation[];
  selectedId: string;
  select: (id: string) => void;
  selected: ProductVariation | undefined;
};

const VariantContext = createContext<Ctx | null>(null);

export function useProductVariant() {
  return useContext(VariantContext);
}

export default function ProductVariantProvider({
  variations,
  children,
}: {
  variations: ProductVariation[];
  children: ReactNode;
}) {
  // The option marked "default" in the admin is preselected; if none is
  // marked, the first option is.
  const initial = (variations.find((v) => v.is_default) ?? variations[0])?.id ?? "";
  const [selectedId, setSelectedId] = useState(initial);
  const selected = variations.find((v) => v.id === selectedId);
  return (
    <VariantContext.Provider
      value={{ variations, selectedId, select: setSelectedId, selected }}
    >
      {children}
    </VariantContext.Provider>
  );
}

// Price line: the selected option's price when the product has options,
// otherwise whatever the server rendered (fallback).
export function SelectedVariationPrice({
  currency,
  fallback,
}: {
  currency: string;
  fallback: ReactNode;
}) {
  const ctx = useProductVariant();
  if (!ctx || !ctx.selected) return <>{fallback}</>;
  return <>{formatPrice(ctx.selected.price_cents, currency)}</>;
}
