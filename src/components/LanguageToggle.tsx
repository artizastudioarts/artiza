"use client";

import { useLocale } from "@/context/LocaleContext";

export default function LanguageToggle() {
  const { locale, setLocale, dict } = useLocale();
  const next = locale === "de" ? "en" : "de";

  return (
    <button
      onClick={() => setLocale(next)}
      aria-label={
        locale === "de"
          ? dict.languageSwitcher.switchToEnglish
          : dict.languageSwitcher.switchToGerman
      }
      className="placard-label text-ink-soft hover:text-ink border border-line px-2.5 py-1.5 flex gap-1"
    >
      <span className={locale === "de" ? "text-ink" : ""}>DE</span>
      <span>/</span>
      <span className={locale === "en" ? "text-ink" : ""}>EN</span>
    </button>
  );
}
