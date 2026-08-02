import { supabasePublic } from "./supabase";
import type { Locale } from "./i18n";

/**
 * Fetches the editable text for one page (e.g. "home") in the given
 * language. Only returns fields the admin has actually filled in for that
 * language — the calling page decides what to show when a field is
 * missing (usually a built-in default from the dictionary).
 */
export async function getPageContent(
  pageKey: string,
  locale: Locale
): Promise<Record<string, string>> {
  const { data } = await supabasePublic
    .from("site_content")
    .select("field_key, value_de, value_en")
    .eq("page_key", pageKey);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const value = locale === "de" ? row.value_de : row.value_en;
    if (value) map[row.field_key] = value;
  }
  return map;
}
