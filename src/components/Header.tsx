"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { items } = useCart();

  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Artiza Studio" className="h-10 w-auto" />
          <span className="flex items-baseline gap-1.5">
  <span className="font-body font-extrabold text-2xl tracking-tight uppercase">
    Artiza
  </span>
  <span className="font-script text-3xl text-oxblood leading-none">
    studio
  </span>
</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="placard-label hover:text-ink">
            Gallery
          </Link>
          <Link href="/cart" className="placard-label hover:text-ink">
            Cart{items.length > 0 ? ` (${items.length})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}