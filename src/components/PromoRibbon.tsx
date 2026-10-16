"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";

type Props = { badge?: string; text?: string; code?: string; link?: string };

// Floating promotion ribbon, pinned to the bottom-right corner on every screen
// size. It stays put (no animation, no close button). Content comes from
// Admin -> Content -> "Promotion ribbon"; with both texts empty it is hidden.
export default function PromoRibbon({ badge, text, code, link }: Props) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  if (!badge && !text) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/site-locked")) return null;

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the code stays visible on the ribbon.
    }
  }

  const safeLink = link && link.startsWith("/") ? link : undefined;

  return (
    <aside
      aria-label={locale === "de" ? "Aktion" : "Promotion"}
      className="fixed right-0 z-40 max-w-[78vw] sm:max-w-xs bg-brand text-white rounded-l-2xl shadow-lg pl-4 pr-3 py-2.5 flex items-center gap-3"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
    >
      {badge && (
        <span className="font-display text-2xl leading-none font-bold whitespace-nowrap">{badge}</span>
      )}
      <div className="min-w-0 text-xs leading-snug">
        {text &&
          (safeLink ? (
            <Link href={safeLink} className="block hover:underline">
              {text}
            </Link>
          ) : (
            <span className="block">{text}</span>
          ))}
        {code && (
          <button
            type="button"
            onClick={copy}
            className="mt-1 inline-flex items-center gap-1.5 border border-dashed border-white/80 px-2 py-0.5 font-mono text-[11px] tracking-wider"
          >
            <span>{code}</span>
            <span className="opacity-80">
              {copied ? (locale === "de" ? "kopiert" : "copied") : locale === "de" ? "kopieren" : "copy"}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
