"use client";

import { formatPrice, type SpecialColor } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";
import { paletteExtraCents } from "@/lib/specialColors";

// "Choose your colors": swatches the customer ticks. The first `freeCount`
// are free, every further one costs `extraCents`. Used on product pages and
// in the make-your-own box. Shows the running extra cost.
export default function PaletteColorGrid({
  colors,
  pickedIds,
  onToggle,
  freeCount,
  extraCents,
  currency,
  dict,
}: {
  colors: SpecialColor[];
  pickedIds: string[];
  onToggle: (id: string) => void;
  freeCount: number;
  extraCents: number;
  currency: string;
  dict: Dictionary;
}) {
  if (colors.length === 0) return null;
  const extra = paletteExtraCents(pickedIds.length, freeCount, extraCents);

  return (
    <section className="border border-line p-4" aria-label={dict.product.colorPickHeading}>
      <p className="placard-label mb-2">{dict.product.colorPickHeading}</p>
      <p className="text-sm text-ink-soft mb-3">
        {interpolate(dict.product.colorPickHint, {
          free: freeCount,
          price: formatPrice(extraCents, currency),
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => {
          const index = pickedIds.indexOf(c.id);
          const on = index >= 0;
          // Colors beyond the free ones are the paid ones.
          const paid = on && index >= freeCount;
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
                onChange={() => onToggle(c.id)}
              />
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded-full border border-ink/30 shrink-0"
                style={{ background: c.hex || "#dddddd" }}
              />
              <span className="text-sm font-semibold leading-tight">{c.name}</span>
              {paid && (
                <span className="text-xs text-ink-soft">+{formatPrice(extraCents, currency)}</span>
              )}
              {on && (
                <span aria-hidden="true" className="text-brand font-bold">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
      <p className="placard-label mt-3">
        {pickedIds.length === 0
          ? dict.product.colorPickRequired
          : `${interpolate(dict.product.colorPickCount, { n: pickedIds.length })} — ${
              extra > 0
                ? interpolate(dict.product.colorPickCost, { total: formatPrice(extra, currency) })
                : dict.product.colorPickAllFree
            }`}
      </p>
    </section>
  );
}
