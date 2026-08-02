"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type CarouselImage = {
  id: string;
  image_url: string;
  caption: string | null;
};

export default function HomeCarousel({
  images,
  prevLabel,
  nextLabel,
  regionLabel,
}: {
  images: CarouselImage[];
  prevLabel: string;
  nextLabel: string;
  regionLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const isPointerDown = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const didDrag = useRef(false);
  const pausedUntil = useRef(0);

  // Render the strip twice back-to-back so we can loop seamlessly: once we
  // scroll past the first copy, we silently snap back by one copy's width.
  const loop = images.length > 2;
  const strip = loop ? [...images, ...images] : images;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let raf: number;
    const SPEED_PX_PER_MS = 0.018; // slow, gallery-walk pace
    let last = performance.now();

    function tick(now: number) {
      const track = trackRef.current;
      const dt = now - last;
      last = now;
      if (track && !isPointerDown.current && now > pausedUntil.current) {
        track.scrollLeft += SPEED_PX_PER_MS * dt;
        const singleSetWidth = track.scrollWidth / 2;
        if (track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth;
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);

  function updateProgress() {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth / (loop ? 2 : 1) - track.clientWidth;
    const singleSetWidth = track.scrollWidth / (loop ? 2 : 1);
    const pos = loop ? track.scrollLeft % singleSetWidth : track.scrollLeft;
    setProgress(max > 0 ? Math.min(1, Math.max(0, pos / max)) : 0);
  }

  function pause() {
    pausedUntil.current = performance.now() + 2500;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return; // let touch use native swipe/scroll
    const track = trackRef.current;
    if (!track) return;
    isPointerDown.current = true;
    didDrag.current = false;
    dragStartX.current = e.clientX;
    dragStartScroll.current = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isPointerDown.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 3) didDrag.current = true;
    track.scrollLeft = dragStartScroll.current - dx;
  }

  function handlePointerUp() {
    isPointerDown.current = false;
    pause();
  }

  function scrollByOne(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.querySelector("[data-card]")?.clientWidth ?? 320;
    track.scrollBy({ left: direction * (cardWidth + 20), behavior: "smooth" });
    pause();
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="region"
        aria-label={regionLabel}
        tabIndex={0}
        onScroll={updateProgress}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={pause}
        onTouchStart={pause}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") scrollByOne(1);
          if (e.key === "ArrowLeft") scrollByOne(-1);
        }}
        className="flex gap-5 overflow-x-auto px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pb-2 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing snap-x snap-proximity"
      >
        {strip.map((img, i) => (
          <figure
            key={`${img.id}-${i}`}
            data-card
            className="shrink-0 w-[68vw] sm:w-[320px] snap-start"
          >
            <div className="relative aspect-[4/5] bg-paper-dim border border-line overflow-hidden">
              <Image
                src={img.image_url}
                alt={img.caption ?? ""}
                fill
                draggable={false}
                className="object-cover"
              />
            </div>
            {img.caption && (
              <figcaption className="placard-label text-ink-soft mt-2">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Brass progress rail — a nod to museum-placard signage */}
      <div className="mt-4 h-px bg-line relative mx-6 md:mx-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        <div
          className="absolute top-0 left-0 h-px bg-brass transition-[width] duration-150 ease-out"
          style={{ width: `${Math.max(6, progress * 100)}%` }}
        />
      </div>

      <div className="hidden md:flex justify-end gap-2 mt-4 px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        <button
          aria-label={prevLabel}
          onClick={() => scrollByOne(-1)}
          className="border border-line w-9 h-9 flex items-center justify-center hover:bg-paper-dim transition-colors"
        >
          ←
        </button>
        <button
          aria-label={nextLabel}
          onClick={() => scrollByOne(1)}
          className="border border-line w-9 h-9 flex items-center justify-center hover:bg-paper-dim transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}
