"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  type CookieConsent,
  defaultConsent,
  readConsentCookie,
  writeConsentCookie,
} from "@/lib/cookieConsent";

type CookieConsentContextType = {
  consent: CookieConsent | null; // null until we know whether the visitor has decided
  bannerOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
  reopenBanner: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    // Only runs client-side, after hydration — reading document.cookie
    // during SSR would mismatch and isn't needed for the initial paint
    // anyway, since necessary cookies work regardless of this banner.
    const existing = readConsentCookie();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading document.cookie is client-only and can't happen during the initializer (no document during SSR)
      setConsent(existing);
    } else {
      setBannerOpen(true);
    }
  }, []);

  function apply(next: CookieConsent) {
    setConsent(next);
    writeConsentCookie(next);
    setBannerOpen(false);
  }

  function acceptAll() {
    apply({ necessary: true, analytics: true, marketing: true });
  }

  function rejectNonEssential() {
    apply({ ...defaultConsent });
  }

  function savePreferences(prefs: { analytics: boolean; marketing: boolean }) {
    apply({ necessary: true, ...prefs });
  }

  function reopenBanner() {
    setBannerOpen(true);
  }

  return (
    <CookieConsentContext.Provider
      value={{ consent, bannerOpen, acceptAll, rejectNonEssential, savePreferences, reopenBanner }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
