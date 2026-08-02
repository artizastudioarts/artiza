import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}
