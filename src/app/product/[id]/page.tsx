import { supabasePublic } from "@/lib/supabase";
import { Product, formatPrice } from "@/lib/types";
import Header from "@/components/Header";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 60;

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

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full grid md:grid-cols-2 gap-12">
        <div className="relative aspect-[4/5] bg-paper-dim">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center placard-label">
              No image
            </div>
          )}
        </div>

        <div className="max-w-md">
          <p className="placard-label mb-3">
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

          {product.is_sold ? (
            <div className="placard-label border border-line px-4 py-3 inline-block">
              This piece has sold
            </div>
          ) : (
            <AddToCartButton product={product} />
          )}
        </div>
      </main>
    </>
  );
}
