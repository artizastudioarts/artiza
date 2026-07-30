export type Product = {
  id: string;
  title: string;
  artist_note: string | null;
  medium: string | null;
  dimensions: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  stock_quantity: number;
  created_at: string;
};

export type Order = {
  id: string;
  product_title: string;
  quantity: number;
  amount_total_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

export type HomeContent = {
  id: number;
  headline: string;
  subheadline: string;
  body: string;
  video_url: string | null;
};

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
