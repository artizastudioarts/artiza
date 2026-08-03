"use client";

import { useState } from "react";
import Image from "next/image";
import type { Dictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";
import type { ProductBadge } from "@/lib/types";
import ProductBadgeRibbon from "@/components/ProductBadgeRibbon";

export default function ProductGallery({
  images,
  title,
  dict,
  badge,
}: {
  images: string[];
  title: string;
  dict: Dictionary;
  badge?: ProductBadge | null;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-paper-dim flex items-center justify-center placard-label text-ink-soft">
        No image
        <ProductBadgeRibbon badge={badge ?? null} dict={dict} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/5] bg-paper-dim">
        <Image
          src={images[active]}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <ProductBadgeRibbon badge={badge ?? null} dict={dict} />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              aria-label={interpolate(dict.product.showPhoto, { n: i + 1, total: images.length })}
              className={`relative w-16 h-16 shrink-0 border ${
                i === active ? "border-ink" : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
