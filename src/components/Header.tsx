"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { items } = useCart();

  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-display italic text-2xl tracking-tight">
          Studio
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
