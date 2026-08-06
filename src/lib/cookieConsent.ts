export type CookieConsent = {
  necessary: true; // always on, not a real choice
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_CONSENT_NAME = "cookie_consent";

export const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function readConsentCookie(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_CONSENT_NAME}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(value);
    return { necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch {
    return null;
  }
}

export function writeConsentCookie(consent: CookieConsent) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(consent));
  // One year, same pattern as the locale preference cookie.
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/; max-age=31536000`;
}
