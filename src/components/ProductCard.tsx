import Link from "next/link";
import Image from "next/image";
import { Product, formatPrice } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { localizeProduct } from "@/lib/localizeProduct";

export default function ProductCard({
  product,
  dict,
  locale,
}: {
  product: Product;
  dict: Dictionary;
  locale: Locale;
}) {
  const soldOut = product.stock_quantity <= 0;
  const lowStock = !soldOut && product.stock_quantity <= 5;
  const secondImage = product.image_urls?.[1];
  const display = localizeProduct(product, locale);

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] bg-paper-dim overflow-hidden">
        {product.image_url ? (
          <>
            <Image
              src={product.image_url}
              alt={display.title ?? ""}
              fill
              className={`object-cover transition duration-500 group-hover:scale-[1.03] ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt={display.title ?? ""}
                fill
                className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center placard-label text-ink-soft">
            No image
          </div>
        )}
        {soldOut && (
          <div className="absolute top-3 left-3 bg-ink text-paper px-2 py-1 placard-label">
            {dict.productCard.soldOut}
          </div>
        )}
        {lowStock && (
          <div className="absolute top-3 left-3 bg-oxblood text-paper px-2 py-1 placard-label">
            {dict.productCard.onlyLeft(product.stock_quantity)}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="font-display text-lg leading-snug">{display.title}</h3>
        <p className="placard-label text-ink-soft">{display.medium}</p>
        <p className="text-sm text-ink-soft">
          {formatPrice(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
