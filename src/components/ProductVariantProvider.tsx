"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ProductVariation, SpecialColor, formatPrice } from "@/lib/types";

// Shares the customer's chosen option (variation) between the photo
// gallery, the price, the option buttons and the "What's in the box"
// accordion, so picking an option updates all of them at once.
type Ctx = {
  variations: ProductVariation[];
  selectedId: string;
  select: (id: string) => void;
  selected: ProductVariation | undefined;
  // Optional paid add-on colors (glitter etc.) and which ones the customer ticked.
  specialColors: SpecialColor[];
  pickedColorIds: string[];
  toggleColor: (id: string) => void;
  // Palette colors the customer picks for this product (null when the product does not offer it).
  palette: PaletteConfig | null;
  pickedPaletteIds: string[];
  togglePalette: (id: string) => void;
};

export type PaletteConfig = { colors: SpecialColor[]; freeCount: number; extraCents: number };

/** Most palette colors one set can carry. */
export const MAX_PALETTE_PICKS = 12;

const VariantContext = createContext<Ctx | null>(null);

export function useProductVariant() {
  return useContext(VariantContext);
}

export default function ProductVariantProvider({
  variations,
  specialColors = [],
  palette = null,
  children,
}: {
  variations: ProductVariation[];
  specialColors?: SpecialColor[];
  palette?: PaletteConfig | null;
  children: ReactNode;
}) {
  // The option marked "default" in the admin is preselected; if none is
  // marked, the first option is.
  const initial = (variations.find((v) => v.is_default) ?? variations[0])?.id ?? "";
  const [selectedId, setSelectedId] = useState(initial);
  const selected = variations.find((v) => v.id === selectedId);
  const [pickedColorIds, setPickedColorIds] = useState<string[]>([]);
  function toggleColor(id: string) {
    setPickedColorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  const [pickedPaletteIds, setPickedPaletteIds] = useState<string[]>([]);
  function togglePalette(id: string) {
    setPickedPaletteIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_PALETTE_PICKS
          ? prev
          : [...prev, id]
    );
  }
  return (
    <VariantContext.Provider
      value={{
        variations,
        selectedId,
        select: setSelectedId,
        selected,
        specialColors,
        pickedColorIds,
        toggleColor,
        palette,
        pickedPaletteIds,
        togglePalette,
      }}
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
