"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { interpolate } from "@/lib/i18n";

export default function Footer() {
  const { dict } = useLocale();
  const { reopenBanner } = useCookieConsent();
  const methods = [
    { name: "Visa", src: "/payment/visa.svg" },
    { name: "Mastercard", src: "/payment/mastercard.svg" },
    { name: "American Express", src: "/payment/amex.svg" },
    { name: "PayPal", src: "/payment/paypal.svg" },
    { name: "Apple Pay", src: "/payment/apple-pay.svg" },
    { name: "Google Pay", src: "/payment/google-pay.svg" },
  ];
  return (
    <footer className="border-t border-line py-8 mt-10">
      <div className="max-w-6xl mx-auto px-6 mb-6 pb-6 border-b border-line flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="placard-label text-ink-soft">{dict.footer.payWith}</span>
        <ul className="flex flex-wrap gap-2" aria-label={dict.footer.payWith}>
          {methods.map((m) => (
            <li key={m.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.name} width={46} height={29} className="h-7 w-auto" />
            </li>
          ))}
        </ul>
        <p className="w-full text-xs text-ink-soft">{dict.footer.payNote}</p>
      </div>
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 placard-label text-ink-soft">
        <span>{interpolate(dict.footer.rights, { year: new Date().getFullYear() })}</span>
        <div className="flex gap-5 flex-wrap">
          <Link href="/reviews" className="hover:text-ink">
            {dict.reviews.pageTitle}
          </Link>
          <Link href="/faq" className="hover:text-ink">
            {dict.faq.navLabel}
          </Link>
          <Link href="/contact" className="hover:text-ink">
            {dict.contact.navLabel}
          </Link>
          <Link href="/terms" className="hover:text-ink">
            {dict.footer.terms}
          </Link>
          <Link href="/widerruf" className="hover:text-ink">
            {dict.widerruf.footerLink}
          </Link>
          <Link href="/vertrag-widerrufen" className="hover:text-ink">
            {dict.widerruf.footerButton}
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            {dict.privacy.footerLink}
          </Link>
          <Link href="/impressum" className="hover:text-ink">
            {dict.impressum.footerLink}
          </Link>
          <button onClick={reopenBanner} className="hover:text-ink">
            {dict.cookies.footerLink}
          </button>
        </div>
      </div>
    </footer>
  );
}
