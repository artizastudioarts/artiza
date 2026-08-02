export type Locale = "de" | "en";

export const defaultLocale: Locale = "de";
export const locales: Locale[] = ["de", "en"];
export const localeCookieName = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "de" || value === "en";
}

/**
 * Fills in {placeholders} in a translated string, e.g.
 * interpolate("Only {n} left", { n: 3 }) -> "Only 3 left"
 *
 * Dictionary entries are plain strings rather than functions on purpose —
 * functions can't be passed from Server Components to Client Components in
 * Next.js, so any dynamic text is a template filled in at the point it's
 * rendered instead.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}
