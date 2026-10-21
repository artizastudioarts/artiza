"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { CustomBoxCategory, CustomBoxArticle, SpecialColor, formatPrice } from "@/lib/types";
import PaletteColorGrid from "@/components/PaletteColorGrid";
import { paletteExtraCents } from "@/lib/specialColors";
import type { Dictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";

export default function CustomBoxBuilder({
  categories,
  articles,
  minOrderCents,
  paletteColors = [],
  colorFreeCount = 3,
  colorExtraCents = 45,
  currency,
  dict,
}: {
  categories: CustomBoxCategory[];
  articles: CustomBoxArticle[];
  minOrderCents: number;
  // Colors the customer can choose for the whole box (empty = not offered).
  paletteColors?: SpecialColor[];
  colorFreeCount?: number;
  colorExtraCents?: number;
  currency: string;
  dict: Dictionary;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);
  const [pickedColorIds, setPickedColorIds] = useState<string[]>([]);

  function toggleColor(id: string) {
    setPickedColorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 12 ? prev : [...prev, id]
    );
  }

  function setQty(articleId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [articleId]: Math.max(0, qty) }));
  }

  function addWholeCategory(categoryId: string) {
    const inCategory = articles.filter((a) => a.category_id === categoryId);
    setQuantities((prev) => {
      const next = { ...prev };
      for (const a of inCategory) {
        next[a.id] = Math.max(next[a.id] ?? 0, 1);
      }
      return next;
    });
  }

  const selectedArticles = articles.filter((a) => (quantities[a.id] ?? 0) > 0);
  const totalCents = selectedArticles.reduce(
    (sum, a) => sum + a.price_cents * (quantities[a.id] ?? 0),
    0
  );
  const meetsMinimum = totalCents >= minOrderCents;
  // Colors for the whole box: the first few free, the rest cost extra (added on top of the minimum check).
  const colorsOffered = paletteColors.length > 0;
  const colorExtra = colorsOffered
    ? paletteExtraCents(pickedColorIds.length, colorFreeCount, colorExtraCents)
    : 0;
  const grandTotalCents = totalCents + colorExtra;
  const colorsOk = !colorsOffered || pickedColorIds.length > 0;
  const canAdd = selectedArticles.length > 0 && meetsMinimum && colorsOk;

  function handleAdd() {
    if (!canAdd) return;
    const summary = selectedArticles.map((a) => {
      const category = categories.find((c) => c.id === a.category_id);
      return {
        categoryLabel: category?.name ?? "",
        articleLabel: a.label,
        priceCents: a.price_cents,
        quantity: quantities[a.id] ?? 0,
      };
    });
    addItem(
      {
        id: crypto.randomUUID(),
        title: dict.customBox.cartTitle,
        price_cents: grandTotalCents,
        currency,
        image_url: null,
        isCustomBox: true,
        customBoxArticles: selectedArticles.map((a) => ({
          articleId: a.id,
          quantity: quantities[a.id] ?? 0,
        })),
        customBoxNotes: notes.trim() || undefined,
        paletteColorIds: colorsOffered ? pickedColorIds : undefined,
        paletteColorLabels: colorsOffered
          ? pickedColorIds
              .map((id) => paletteColors.find((c) => c.id === id)?.name)
              .filter((n): n is string => !!n)
          : undefined,
        customBoxSummary: summary,
      },
      1
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
    <div className="space-y-10">
      {categories.map((cat) => (
        <div key={cat.id} className="border border-line p-5">
          <div className="flex flex-col sm:flex-row gap-5 mb-4">
            {cat.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full sm:w-48 h-48 object-cover"
              />
            ) : null}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="font-display text-xl italic">{cat.name}</h2>
                <button
                  onClick={() => addWholeCategory(cat.id)}
                  className="border border-line px-3 py-1.5 placard-label text-xs hover:bg-paper-dim transition-colors whitespace-nowrap"
                >
                  {dict.customBox.addWholeCategory}
                </button>
              </div>
              <ul className="space-y-2">
                {articles
                  .filter((a) => a.category_id === cat.id)
                  .map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-4">
                      <span className="text-sm">
                        {a.label}{" "}
                        <span className="text-ink-soft">
                          — {formatPrice(a.price_cents, currency)}
                        </span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={quantities[a.id] ?? 0}
                        onChange={(e) => setQty(a.id, Number(e.target.value))}
                        className="w-16 border border-line px-2 py-1 bg-paper text-sm"
                      />
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {colorsOffered && (
        <PaletteColorGrid
          colors={paletteColors}
          pickedIds={pickedColorIds}
          onToggle={toggleColor}
          freeCount={colorFreeCount}
          extraCents={colorExtraCents}
          currency={currency}
          dict={dict}
        />
      )}

      <div>
        <label className="placard-label text-ink-soft block mb-1">
          {dict.customBox.notesLabel}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={dict.customBox.notesPlaceholder}
          rows={3}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>

      <div className="border-t border-line pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="placard-label text-ink-soft">{dict.customBox.totalLabel}</span>
          <span className="font-display text-xl">{formatPrice(grandTotalCents, currency)}</span>
        </div>
        {!meetsMinimum && (
          <p className="text-sm text-oxblood">
            {interpolate(dict.customBox.belowMinimum, {
              min: formatPrice(minOrderCents, currency),
              remaining: formatPrice(minOrderCents - totalCents, currency),
            })}
          </p>
        )}
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
