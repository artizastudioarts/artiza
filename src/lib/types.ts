export type ProductBadge =
  | "best_seller"
  | "artists_pick"
  | "trending"
  | "customer_favorite"
  | "new_creations";

export type Product = {
  id: string;
  title: string;
  artist_note: string | null;
  medium: string | null;
  dimensions: string | null;
  title_en: string | null;
  artist_note_en: string | null;
  medium_en: string | null;
  dimensions_en: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  image_urls: string[];
  badge: ProductBadge | null;
  custom_text_enabled: boolean;
  custom_text_max_length: number | null;
  custom_text_label: string | null;
  custom_text_label_en: string | null;
  custom_text_pricing_mode: "fixed" | "per_character";
  custom_text_price_per_char_cents: number | null;
  custom_text_min_length: number | null;
  weight_grams: number | null;
  created_at: string;
};

export type ShippingMethod = "standard" | "express";

export type ShippingRate = {
  id: string;
  method: ShippingMethod;
  min_weight_g: number;
  max_weight_g: number | null;
  price_cents: number;
  sort_order: number;
};

export type ShippingSettings = {
  id: number;
  free_standard_threshold_cents: number | null;
};

// No stock tracking — quantity is simply whatever the customer chooses,
// capped at a sane number rather than actual inventory.
export const MAX_CART_QTY = 20;

export type Order = {
  id: string;
  order_number: string;
  product_title: string;
  quantity: number;
  amount_total_cents: number;
  shipping_cents: number | null;
  currency: string;
  status: string;
  created_at: string;
  custom_text?: string | null;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  order_number: string;
  type: "invoice" | "credit_note";
  related_invoice_number: string | null;
  pdf_path: string | null;
  created_at: string;
};

export type InvoiceSettings = {
  id: number;
  business_name: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  tax_number: string | null;
  kleinunternehmer: boolean;
  footer_note: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
};

export type Review = {
  id: string;
  order_number: string;
  customer_name: string;
  rating: number | null;
  review_text: string;
  image_url: string | null;
  status: "pending" | "approved" | "featured" | "rejected";
  created_at: string;
};

export function truncateWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

export type HomeContent = {
  id: number;
  video_url: string | null;
};

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
