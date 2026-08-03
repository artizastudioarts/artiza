import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabasePublic } from "@/lib/supabase";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import type { Review } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const description =
    locale === "de"
      ? "Echte, verifizierte Bewertungen von Kunden, die bei Artiza Studio bestellt haben."
      : "Real, verified reviews from customers who've ordered from Artiza Studio.";
  return {
    title: dict.reviews.pageTitle,
    description,
    openGraph: { title: dict.reviews.pageTitle, description },
    twitter: { title: dict.reviews.pageTitle, description },
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="text-base tracking-wide">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-brass" : "text-line"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function ReviewsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { data } = await supabasePublic
    .from("reviews")
    .select("*")
    .in("status", ["approved", "featured"])
    .order("created_at", { ascending: false });

  const reviews = (data as Review[]) ?? [];

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <p className="placard-label text-ink-soft mb-3">{dict.reviews.pageEyebrow}</p>
            <h1 className="font-display text-4xl italic leading-tight">
              {dict.reviews.pageTitle}
            </h1>
          </div>
          <Link
            href="/reviews/write"
            className="inline-block bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
          >
            {dict.reviews.writeReviewButton}
          </Link>
        </div>

        {reviews.length === 0 ? (
          <p className="text-ink-soft">{dict.reviews.pageEmpty}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {reviews.map((review) => (
              <li
                key={review.id}
                id={`review-${review.id}`}
                className="py-10 flex flex-col sm:flex-row gap-6 scroll-mt-24 [&:target]:bg-paper-dim transition-colors"
              >
                {review.image_url && (
                  <div className="relative w-full sm:w-48 aspect-[4/5] shrink-0 bg-paper-dim">
                    <Image
                      src={review.image_url}
                      alt={review.customer_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  {review.rating && (
                    <div className="mb-2">
                      <Stars rating={review.rating} />
                    </div>
                  )}
                  <p className="font-display text-xl italic mb-1">
                    {review.customer_name}
                  </p>
                  <p className="placard-label text-oxblood mb-3">
                    ✓ {dict.reviews.verifiedBadge}
                  </p>
                  <p className="text-ink-soft leading-relaxed">{review.review_text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
