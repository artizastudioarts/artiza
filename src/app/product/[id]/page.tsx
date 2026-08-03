import { supabasePublic } from "@/lib/supabase";
import { Product, formatPrice } from "@/lib/types";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { localizeProduct } from "@/lib/localizeProduct";
import type { Metadata } from "next";

export const revalidate = 0; // always fetch fresh — no stale "sold" status

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabasePublic
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  const product = data as Product | null;
  if (!product) return {};

  const locale = await getLocale();
  const display = localizeProduct(product, locale);
  const description = (display.artist_note ?? display.medium ?? "").slice(0, 160);

  return {
    title: display.title ?? undefined,
    description,
    openGraph: {
      title: display.title ?? undefined,
      description,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
    twitter: {
      title: display.title ?? undefined,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await supabasePublic
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  const product = data as Product | null;
  if (!product) notFound();

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const display = localizeProduct(product, locale);
  // The cart, checkout, and order emails should show whichever language
  // the customer was actually looking at when they added it.
  const displayProduct: Product = { ...product, ...display };

  const images =
    product.image_urls?.length
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full grid md:grid-cols-2 gap-12">
        <ProductGallery images={images} title={display.title ?? ""} dict={dict} badge={product.badge} />

        <div className="max-w-md">
          <p className="placard-label text-ink-soft mb-3">
            {display.medium ?? dict.product.originalArtworkFallback}
          </p>
          <h1 className="font-display text-4xl italic leading-tight mb-4">
            {display.title}
          </h1>
          {display.dimensions && (
            <p className="text-ink-soft mb-1">{display.dimensions}</p>
          )}
          <p className="text-2xl font-display mb-6">
            {formatPrice(product.price_cents, product.currency)}
          </p>
          {display.artist_note && (
            <p className="text-ink-soft leading-relaxed mb-8">
              {display.artist_note}
            </p>
          )}

          <AddToCartButton product={displayProduct} dict={dict} />
        </div>
      </main>
    </>
  );
}
