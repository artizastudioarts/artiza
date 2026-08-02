"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { interpolate } from "@/lib/i18n";

export default function Footer() {
  const { dict } = useLocale();
  return (
    <footer className="border-t border-line py-8 mt-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 placard-label text-ink-soft">
        <span>{interpolate(dict.footer.rights, { year: new Date().getFullYear() })}</span>
        <div className="flex gap-5">
          <Link href="/reviews" className="hover:text-ink">
            {dict.reviews.pageTitle}
          </Link>
          <Link href="/terms" className="hover:text-ink">
            {dict.footer.terms}
          </Link>
        </div>
      </div>
    </footer>
  );
}
