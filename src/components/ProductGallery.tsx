"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-paper-dim flex items-center justify-center placard-label text-ink-soft">
        No image
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
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${title}`}
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
