"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { items } = useCart();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = (
    <>
      <Link
        href="/"
        onClick={() => setMenuOpen(false)}
        className="placard-label text-ink-soft hover:text-ink"
      >
        Home
      </Link>
      <Link
        href="/shop"
        onClick={() => setMenuOpen(false)}
        className="placard-label text-ink-soft hover:text-ink"
      >
        Shop
      </Link>
      <Link
        href="/cart"
        onClick={() => setMenuOpen(false)}
        className="placard-label text-ink-soft hover:text-ink"
      >
        Cart{items.length > 0 ? ` (${items.length})` : ""}
      </Link>
      <Link
        href="/account"
        onClick={() => setMenuOpen(false)}
        className="placard-label text-ink-soft hover:text-ink"
      >
        {user ? "Account" : "Log in"}
      </Link>
    </>
  );

  return (
    <header className="border-b border-line relative">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3"
        >
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

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">{navLinks}</nav>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden flex flex-col justify-center gap-1.5 w-8 h-8"
        >
          <span
            className={`block h-0.5 w-6 bg-ink transition-transform ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-ink transition-opacity ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-ink transition-transform ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-line px-6 py-4 flex flex-col gap-4 bg-paper">
          {navLinks}
        </nav>
      )}
    </header>
  );
}
