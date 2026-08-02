"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export default function Footer() {
  const { dict } = useLocale();
  return (
    <footer className="border-t border-line py-8 mt-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 placard-label text-ink-soft">
        <span>{dict.footer.rights(new Date().getFullYear())}</span>
        <Link href="/terms" className="hover:text-ink">
          {dict.footer.terms}
        </Link>
      </div>
    </footer>
  );
}
