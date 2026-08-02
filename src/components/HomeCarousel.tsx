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
  const [inView, setInView] = useState(false);
  const isPointerDown = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const pausedUntil = useRef(0);

  // Render the strip twice back-to-back so we can loop seamlessly: once we
  // scroll past the first copy, we silently snap back by one copy's width.
  const loop = images.length > 1;
  const strip = loop ? [...images, ...images] : images;

  // Start the film rolling only once this section actually enters view —
  // like a projector starting when the reel reaches the gate, not before.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop || !inView) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let raf: number;
    const SPEED_PX_PER_MS = 0.03; // slow, steady film-reel pace
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
  }, [loop, inView]);

  function updateProgress() {
    const track = trackRef.current;
    if (!track) return;
    const singleSetWidth = track.scrollWidth / (loop ? 2 : 1);
    const max = singleSetWidth - track.clientWidth;
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
    dragStartX.current = e.clientX;
    dragStartScroll.current = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isPointerDown.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - dragStartX.current;
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
    track.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
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
        onTouchStart={pause}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") scrollByOne(1);
          if (e.key === "ArrowLeft") scrollByOne(-1);
        }}
        className="flex overflow-x-auto select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
      >
        {strip.map((img, i) => (
          <div
            key={`${img.id}-${i}`}
            data-card
            className="group relative shrink-0 w-[78vw] sm:w-[380px] aspect-[4/5] bg-paper-dim"
          >
            <Image
              src={img.image_url}
              alt={img.caption ?? ""}
              fill
              draggable={false}
              className="object-cover"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent pt-10 pb-3 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="placard-label text-paper">{img.caption}</p>
              </div>
            )}
          </div>
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
