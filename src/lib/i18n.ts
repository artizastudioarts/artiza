export type Locale = "de" | "en";

export const defaultLocale: Locale = "de";
export const locales: Locale[] = ["de", "en"];
export const localeCookieName = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "de" || value === "en";
}
