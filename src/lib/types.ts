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
