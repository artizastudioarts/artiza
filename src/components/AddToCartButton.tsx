"use client";

import { useState } from "react";
import { useProductVariant } from "@/components/ProductVariantProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Product, ProductVariation, MAX_CART_QTY, formatPrice } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";
import PaletteColorGrid from "@/components/PaletteColorGrid";
import { paletteExtraCents } from "@/lib/specialColors";
import {
  countBillableChars,
  sanitizeCustomText,
  calcPerCharacterPriceCents,
} from "@/lib/customTextPricing";

export default function AddToCartButton({
  product,
  variations = [],
  dict,
}: {
  product: Product;
  variations?: ProductVariation[];
  dict: Dictionary;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [customText, setCustomText] = useState("");
  const variant = useProductVariant();
  const [added, setAdded] = useState(false);

  const hasVariations = product.variations_enabled && variations.length > 0;
  const selectedVariation = variant?.selected;

  const router = useRouter();

  const requiresCustomText = product.custom_text_enabled;
  const isPerCharacter = product.custom_text_pricing_mode === "per_character";
  const maxLength = product.custom_text_max_length ?? 30;
  const minLength = product.custom_text_min_length ?? 1;
  const pricePerCharCents = product.custom_text_price_per_char_cents ?? 0;
  // product is already the locale-resolved display version (same pattern
  // as title/artist_note) — no need to re-check locale here.
  const label = product.custom_text_label || dict.product.customTextDefaultLabel;

  const trimmedCustomText = customText.trim();
  const billableChars = countBillableChars(trimmedCustomText);
  // The variation's own price stands in for the base product price
  // wherever that base would otherwise be used — per-character text
  // pricing (when also enabled) still fully overrides it, same as it
  // already does for products with no variations.
  const baseCents = hasVariations
    ? (selectedVariation?.price_cents ?? 0)
    : product.price_cents;
  const computedPriceCents = isPerCharacter
    ? calcPerCharacterPriceCents(trimmedCustomText, pricePerCharCents)
    : baseCents;

  // The glitter / special colors are picked in their own box further down
  // the page (shared through the same context).
  const pickedColors = (variant?.specialColors ?? []).filter((c) =>
    (variant?.pickedColorIds ?? []).includes(c.id)
  );
  const specialExtraCents = pickedColors.reduce((sum, c) => sum + c.price_cents, 0);

  // Colors picked from the palette: the first few are free, the rest cost extra.
  const palette = variant?.palette ?? null;
  const pickedPalette = palette
    ? variant!.pickedPaletteIds
        .map((id) => palette.colors.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
    : [];
  const paletteExtra = palette
    ? paletteExtraCents(pickedPalette.length, palette.freeCount, palette.extraCents)
    : 0;
  const paletteOk = !palette || pickedPalette.length > 0;

  const meetsLength =
    trimmedCustomText.length > 0 && billableChars >= minLength;
  const canAdd =
    (!requiresCustomText || meetsLength) && (!hasVariations || !!selectedVariation) && paletteOk;

  function handleAdd() {
    if (!canAdd) return;
    addItem(
      {
        id: product.id,
        title: product.title,
        price_cents: computedPriceCents + specialExtraCents + paletteExtra,
        currency: product.currency,
        image_url: product.image_url,
        customText: requiresCustomText ? trimmedCustomText : undefined,
        variationId: hasVariations ? selectedVariation?.id : undefined,
        variationLabel: hasVariations ? selectedVariation?.label : undefined,
        specialColorIds: pickedColors.length > 0 ? pickedColors.map((c) => c.id) : undefined,
        specialColorLabels: pickedColors.length > 0 ? pickedColors.map((c) => c.name) : undefined,
        paletteColorIds: pickedPalette.length > 0 ? pickedPalette.map((c) => c.id) : undefined,
        paletteColorLabels: pickedPalette.length > 0 ? pickedPalette.map((c) => c.name) : undefined,
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
          className="bg-brand text-white px-6 py-3 placard-label hover:bg-brand-deep transition-colors"
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
      {hasVariations && (
        <div>
          <p className="placard-label text-ink-soft mb-2">
            {dict.product.chooseVariation}
          </p>
          <div role="radiogroup" aria-label={dict.product.chooseVariation} className="flex flex-wrap gap-2">
            {variations.map((v) => {
              const on = v.id === selectedVariation?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => variant?.select(v.id)}
                  className={`px-4 py-2 text-left border-2 transition-colors ${
                    on
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-paper hover:border-brand"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-tight">{v.label}</span>
                  <span className={`block text-xs ${on ? "text-white/90" : "text-ink-soft"}`}>
                    {formatPrice(v.price_cents, product.currency)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {requiresCustomText && (
        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {label}
          </label>
          <input
            required
            value={customText}
            onChange={(e) =>
              setCustomText(sanitizeCustomText(e.target.value).slice(0, maxLength))
            }
            maxLength={maxLength}
            className="w-full max-w-xs border border-line px-3 py-2 bg-paper"
          />
          <p className="text-xs text-ink-soft mt-1">
            {isPerCharacter
              ? interpolate(dict.product.customTextCharCountPerChar, {
                  n: billableChars,
                  min: minLength,
                  max: maxLength,
                })
              : `${customText.length}/${maxLength}`}
          </p>
          {isPerCharacter && (
            <p className="placard-label mt-2">
              {interpolate(dict.product.customTextPriceRate, {
                rate: formatPrice(pricePerCharCents, product.currency),
              })}
              {billableChars > 0 && (
                <>
                  {" — "}
                  {interpolate(dict.product.customTextComputedTotal, {
                    total: formatPrice(computedPriceCents, product.currency),
                  })}
                </>
              )}
            </p>
          )}
        </div>
      )}
      {palette && variant && (
        <PaletteColorGrid
          colors={palette.colors}
          pickedIds={variant.pickedPaletteIds}
          onToggle={variant.togglePalette}
          freeCount={palette.freeCount}
          extraCents={palette.extraCents}
          currency={product.currency}
          dict={dict}
        />
      )}
      {pickedColors.length > 0 && (
        <p className="text-sm text-ink-soft">
          {interpolate(dict.product.specialColorsSummary, {
            n: pickedColors.length,
            total: formatPrice(specialExtraCents, product.currency),
          })}
        </p>
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
          className="bg-brand text-white px-6 py-3 placard-label hover:bg-brand-deep transition-colors disabled:opacity-50"
        >
          {dict.product.addToCart}
        </button>
      </div>
    </div>
  );
}
