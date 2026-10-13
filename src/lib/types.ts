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
  variations_enabled: boolean;
  created_at: string;
};

export type ProductVariation = {
  id: string;
  product_id: string;
  label: string;
  label_en: string | null;
  price_cents: number;
  sort_order: number;
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
  custom_box_shipping_cents: number;
  custom_box_min_order_cents: number;
};

export type CustomBoxCategory = {
  id: string;
  name: string;
  name_en: string | null;
  image_url: string | null;
  sort_order: number;
};

export type CustomBoxArticle = {
  id: string;
  category_id: string;
  label: string;
  label_en: string | null;
  price_cents: number;
  sort_order: number;
};

// What actually ended up in a customer's box, frozen onto the order at
// checkout time.
export type CustomBoxOrderItem = {
  categoryLabel: string;
  articleLabel: string;
  priceCents: number;
  quantity: number;
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
  variation_label?: string | null;
  order_type?: "standard" | "custom_box";
  custom_box_items?: CustomBoxOrderItem[] | null;
  custom_box_notes?: string | null;
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

export type SupplyKind = "paint" | "casting_powder" | "other";

export type SupplyItem = {
  id: string;
  kind: SupplyKind;
  name: string;
  supplier: string;
  batch_number: string;
  purchased_at: string; // YYYY-MM-DD
  quantity: string | null;
  best_before: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
};

export type ShipmentRecord = {
  id: string;
  shipped_at: string; // YYYY-MM-DD
  order_number: string;
  kit_batch_number: string;
  notes: string | null;
  created_at: string;
  shipment_supplies: { supply_id: string; supply_items: SupplyItem | null }[];
};
