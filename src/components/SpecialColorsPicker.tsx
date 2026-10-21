"use client";

import { useProductVariant } from "@/components/ProductVariantProvider";
import { formatPrice } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";

// Optional paid add-on colors (glitter etc.), shown below the accordions and
// clearly marked as an extra on top of the colors already included in the
// price. The chosen colors are picked up by the add-to-cart button.
export default function SpecialColorsPicker({
  currency,
  dict,
}: {
  currency: string;
  dict: Dictionary;
}) {
  const ctx = useProductVariant();
  if (!ctx || ctx.specialColors.length === 0) return null;

  const picked = ctx.specialColors.filter((c) => ctx.pickedColorIds.includes(c.id));
  const extraCents = picked.reduce((sum, c) => sum + c.price_cents, 0);
  const included = ctx.selected?.colors_included?.trim();

  return (
    <section
      className="border border-line p-4 mt-6"
      aria-label={dict.product.specialColorsHeading}
    >
      <p className="placard-label mb-2">{dict.product.specialColorsHeading}</p>
      {included && (
        <p className="text-sm mb-1">
          <span className="font-semibold">{dict.product.specialColorsIncluded}</span> {included}
        </p>
      )}
      <p className="text-sm text-ink-soft mb-3">{dict.product.specialColorsAsk}</p>
      <div className="flex flex-wrap gap-2">
        {ctx.specialColors.map((c) => {
          const on = ctx.pickedColorIds.includes(c.id);
          return (
            <label
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 border-2 cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-brand ${
                on ? "border-brand bg-paper-dim" : "border-line hover:border-brand"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() => ctx.toggleColor(c.id)}
              />
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded-full border border-ink/30 shrink-0"
                style={{ background: c.hex || "#dddddd" }}
              />
              <span className="text-sm font-semibold leading-tight">{c.name}</span>
              <span className="text-xs text-ink-soft">
                +{formatPrice(c.price_cents, currency)}
              </span>
              {on && (
                <span aria-hidden="true" className="text-brand font-bold">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
      {picked.length > 0 && (
        <p className="placard-label mt-3">
          {interpolate(dict.product.specialColorsTotal, {
            n: picked.length,
            total: formatPrice(extraCents, currency),
          })}
        </p>
      )}
    </section>
  );
}
