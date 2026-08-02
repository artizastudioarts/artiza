"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { localeCookieName } from "@/lib/i18n";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";

type LocaleContextType = {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  function setLocale(next: Locale) {
    setLocaleState(next);
    // One year, so the choice sticks around like a normal site preference.
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=31536000`;
    // Re-renders server-fetched pages (home, shop, product, terms) with the
    // new language, without a full page reload.
    router.refresh();
  }

  return (
    <LocaleContext.Provider value={{ locale, dict: getDictionary(locale), setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
