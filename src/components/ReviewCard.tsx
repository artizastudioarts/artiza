import Link from "next/link";
import Image from "next/image";
import type { Review } from "@/lib/types";
import { truncateWords } from "@/lib/types";

const MAX_WORDS = 32;

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="text-sm tracking-wide">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-brass" : "text-line"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewCard({
  review,
  verifiedLabel,
}: {
  review: Review;
  verifiedLabel: string;
}) {
  return (
    <Link
      href={`/reviews#review-${review.id}`}
      className="flex border border-line hover:border-ink transition-colors"
    >
      <div className="relative w-28 sm:w-32 shrink-0 bg-paper-dim">
        {review.image_url ? (
          <Image
            src={review.image_url}
            alt={review.customer_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-2xl italic text-ink-soft">
            {review.customer_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col justify-center gap-1 min-w-0">
        {review.rating && <Stars rating={review.rating} />}
        <p className="font-display text-lg leading-snug">{review.customer_name}</p>
        <p className="text-sm text-ink-soft leading-relaxed">
          {truncateWords(review.review_text, MAX_WORDS)}
        </p>
        <p className="placard-label text-oxblood mt-1">✓ {verifiedLabel}</p>
      </div>
    </Link>
  );
}
