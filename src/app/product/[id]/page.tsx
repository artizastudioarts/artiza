import { supabasePublic } from "@/lib/supabase";
import { Product, formatPrice } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import MadeInGermanyBadge from "@/components/MadeInGermanyBadge";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { localizeProduct } from "@/lib/localizeProduct";
import { getShippingSettings } from "@/lib/getShippingSettings";
import { interpolate } from "@/lib/i18n";
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
  const shippingSettings = await getShippingSettings();
  const freeThreshold = shippingSettings?.free_standard_threshold_cents;
  // The cart, checkout, and order emails should show whichever language
  // the customer was actually looking at when they added it.
  const displayProduct: Product = { ...product, ...display };

  const images =
    product.image_urls?.length
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];

  // Prefer other products sharing the same category/medium, then fill any
  // remaining slots with the most recently added other products.
  const related: Product[] = [];
  if (product.medium) {
    const { data: sameMedium } = await supabasePublic
      .from("products")
      .select("*")
      .eq("medium", product.medium)
      .neq("id", product.id)
      .limit(4);
    related.push(...((sameMedium as Product[]) ?? []));
  }
  if (related.length < 4) {
    const excludeIds = [product.id, ...related.map((p) => p.id)];
    const { data: others } = await supabasePublic
      .from("products")
      .select("*")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(4 - related.length);
    related.push(...((others as Product[]) ?? []));
  }

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
          <div className="mb-6">
            <p className="text-2xl font-display mb-1">
              {product.custom_text_pricing_mode === "per_character" &&
              product.custom_text_price_per_char_cents != null
                ? interpolate(dict.product.customTextPriceRate, {
                    rate: formatPrice(product.custom_text_price_per_char_cents, product.currency),
                  })
                : formatPrice(product.price_cents, product.currency)}
            </p>
            {freeThreshold != null && (
              <p className="placard-label text-ink-soft">
                {interpolate(dict.shipping.freeProductNote, {
                  amount: formatPrice(freeThreshold, "eur"),
                })}
              </p>
            )}
          </div>
          {display.artist_note && (
            <p className="text-ink-soft leading-relaxed mb-8">
              {display.artist_note}
            </p>
          )}

          <AddToCartButton product={displayProduct} dict={dict} />

          <div className="mt-8">
            <MadeInGermanyBadge locale={locale} className="w-20 h-20" />
          </div>
        </div>
      </main>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="font-display text-2xl italic mb-6">
            {dict.product.relatedHeading}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} dict={dict} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
