import type { Product } from "./types";
import type { Locale } from "./i18n";

/**
 * Returns the product's text fields in the given language. English falls
 * back to the original (German) text for any field the admin hasn't
 * translated yet, so nothing ever shows up blank.
 */
export function localizeProduct(product: Product, locale: Locale) {
  if (locale === "en") {
    return {
      title: product.title_en || product.title,
      medium: product.medium_en || product.medium,
      dimensions: product.dimensions_en || product.dimensions,
      artist_note: product.artist_note_en || product.artist_note,
      custom_text_label: product.custom_text_label_en || product.custom_text_label,
    };
  }
  return {
    title: product.title,
    medium: product.medium,
    dimensions: product.dimensions,
    artist_note: product.artist_note,
    custom_text_label: product.custom_text_label,
  };
}
