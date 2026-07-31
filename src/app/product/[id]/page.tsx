import { supabasePublic } from "@/lib/supabase";
import { Product, formatPrice } from "@/lib/types";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";

export const revalidate = 0; // always fetch fresh — no stale "sold" status

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
        <ProductGallery images={images} title={product.title} />

        <div className="max-w-md">
          <p className="placard-label text-ink-soft mb-3">
            {product.medium ?? "Original artwork"}
          </p>
          <h1 className="font-display text-4xl italic leading-tight mb-4">
            {product.title}
          </h1>
          {product.dimensions && (
            <p className="text-ink-soft mb-1">{product.dimensions}</p>
          )}
          <p className="text-2xl font-display mb-6">
            {formatPrice(product.price_cents, product.currency)}
          </p>
          {product.artist_note && (
            <p className="text-ink-soft leading-relaxed mb-8">
              {product.artist_note}
            </p>
          )}

          {product.stock_quantity <= 0 ? (
            <div className="placard-label text-ink-soft border border-line px-4 py-3 inline-block">
              Currently sold out
            </div>
          ) : (
            <>
              <p className="placard-label text-ink-soft mb-4">
                {product.stock_quantity <= 5
                  ? `Only ${product.stock_quantity} left`
                  : `${product.stock_quantity} in stock`}
              </p>
              <AddToCartButton product={product} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
