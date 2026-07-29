import Link from "next/link";
import Image from "next/image";
import { Product, formatPrice } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] bg-paper-dim overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center placard-label">
            No image
          </div>
        )}
        {product.is_sold && (
          <div className="absolute top-3 left-3 bg-ink text-paper px-2 py-1 placard-label">
            Sold
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="font-display text-lg leading-snug">{product.title}</h3>
        <p className="placard-label">{product.medium}</p>
        <p className="text-sm text-ink-soft">
          {formatPrice(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
