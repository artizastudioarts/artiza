"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

// A horizontal, swipeable row of products. The next card always peeks in
// from the right edge, there are arrow buttons, and a progress bar, so it
// is obvious on every screen size that this scrolls sideways.
export default function BestSellersSlider({
  products,
  dict,
  locale,
  fromPrices,
}: {
  products: Product[];
  dict: Dictionary;
  locale: Locale;
  fromPrices: Record<string, number>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, products.length]);

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slide]");
    const step = (card?.offsetWidth ?? 240) + 16;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  const arrow =
    "w-11 h-11 rounded-full border border-line bg-paper flex items-center justify-center text-ink text-xl leading-none transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink";

  return (
    <div role="region" aria-label={dict.home.bestSellersRegionLabel} className="w-full min-w-0 max-w-full">
      <div className="relative min-w-0">
        <div
          ref={trackRef}
          onScroll={update}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 scroll-smooth pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div
              key={p.id}
              data-slide
              className="snap-start shrink-0 w-[68%] sm:w-[42%] md:w-[30%] lg:w-[23%]"
            >
              <ProductCard
                product={p}
                dict={dict}
                locale={locale}
                fromPriceCents={fromPrices[p.id]}
              />
            </div>
          ))}
          {/* spacer so the last card can snap fully into view */}
          <div className="shrink-0 w-2" aria-hidden="true" />
        </div>
        {canNext && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-24px] top-0 bottom-2 w-14 bg-gradient-to-l from-paper to-transparent md:hidden"
          />
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex-1 h-1 bg-line rounded-full overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-brand rounded-full transition-[width] duration-150"
            style={{ width: `${Math.max(12, progress * 100)}%` }}
          />
        </div>
        <p className="placard-label text-ink-soft md:hidden">{dict.home.bestSellersSwipe}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            aria-label={dict.home.carouselPrev}
            className={arrow}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            aria-label={dict.home.carouselNext}
            className={arrow}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
