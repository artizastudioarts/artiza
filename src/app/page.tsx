import { supabasePublic } from "@/lib/supabase";
import { HomeContent } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getPageContent } from "@/lib/getPageContent";
import HomeCarousel, { type CarouselImage } from "@/components/HomeCarousel";
import ReviewCard from "@/components/ReviewCard";
import MadeInGermanyBadge from "@/components/MadeInGermanyBadge";
import type { Review } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 0;

type CarouselRow = {
  id: string;
  image_url: string;
  caption_de: string | null;
  caption_en: string | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const pageContent = await getPageContent("home", locale);
  const headline = pageContent.headline ?? dict.home.defaultHeadline;
  const body = pageContent.body ?? dict.home.defaultBody;

  return {
    title: headline,
    description: body,
    openGraph: { title: headline, description: body },
    twitter: { title: headline, description: body },
  };
}

export default async function Home() {
  const { data } = await supabasePublic
    .from("home_content")
    .select("*")
    .eq("id", 1)
    .single();

  const content = data as HomeContent | null;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const pageContent = await getPageContent("home", locale);

  const { data: carouselRows } = await supabasePublic
    .from("home_carousel_images")
    .select("id, image_url, caption_de, caption_en")
    .order("sort_order", { ascending: true });

  const carouselImages: CarouselImage[] = ((carouselRows as CarouselRow[]) ?? []).map(
    (row) => ({
      id: row.id,
      image_url: row.image_url,
      caption: (locale === "de" ? row.caption_de : row.caption_en) ?? null,
    })
  );

  const { data: reviewRows } = await supabasePublic
    .from("reviews")
    .select("*")
    .eq("status", "featured")
    .order("created_at", { ascending: false })
    .limit(6);

  const featuredReviews = (reviewRows as Review[]) ?? [];

  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <p className="placard-label text-ink-soft mb-4">
            {pageContent.subheadline ?? dict.home.defaultSubheadline}
          </p>
          <h1 className="font-display text-4xl md:text-6xl italic leading-tight max-w-3xl mx-auto">
            {pageContent.headline ?? dict.home.defaultHeadline}
          </h1>
          <p className="mt-6 text-ink-soft max-w-xl mx-auto leading-relaxed">
            {pageContent.body ?? dict.home.defaultBody}
          </p>
          <Link
            href="/shop"
            className="inline-block mt-8 bg-ink text-paper px-8 py-4 placard-label hover:bg-oxblood transition-colors"
          >
            {dict.home.shopButton}
          </Link>
          <div className="mt-10 flex justify-center">
            <MadeInGermanyBadge locale={locale} className="w-24 h-24" />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="relative aspect-video bg-paper-dim overflow-hidden rounded-xl">
            {content?.video_url ? (
              <video
                src={content.video_url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center placard-label text-ink-soft text-center px-6">
                {dict.home.videoFallback}
              </div>
            )}
          </div>
          <p className="placard-label text-ink-soft text-center mt-4">
            {dict.home.videoCaption}
          </p>
        </section>

        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <p className="placard-label text-ink-soft mb-3">
                {pageContent.storyEyebrow ?? dict.home.defaultStoryEyebrow}
              </p>
              <h2 className="font-display text-3xl md:text-4xl italic leading-tight">
                {pageContent.storyHeading ?? dict.home.defaultStoryHeading}
              </h2>
            </div>
            <div className="md:col-span-7">
              <p className="text-ink-soft leading-relaxed text-lg">
                {pageContent.storyBody ?? dict.home.defaultStoryBody}
              </p>
            </div>
          </div>
        </section>

        {carouselImages.length > 0 && (
          <section className="pb-20">
            <div className="max-w-6xl mx-auto px-6 mb-6">
              <p className="placard-label text-ink-soft">
                {pageContent.carouselEyebrow ?? dict.home.defaultCarouselEyebrow}
              </p>
            </div>
            <HomeCarousel
              images={carouselImages}
              prevLabel={dict.home.carouselPrev}
              nextLabel={dict.home.carouselNext}
              regionLabel={dict.home.carouselRegionLabel}
            />
          </section>
        )}

        {featuredReviews.length > 0 && (
          <section className="border-t border-line">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                <div>
                  <p className="placard-label text-ink-soft mb-3">
                    {pageContent.reviewsEyebrow ?? dict.home.defaultReviewsEyebrow}
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl italic leading-tight">
                    {pageContent.reviewsHeading ?? dict.home.defaultReviewsHeading}
                  </h2>
                </div>
                <Link
                  href="/reviews"
                  className="placard-label text-ink-soft hover:text-ink"
                >
                  {dict.reviews.homeReadAll} →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    verifiedLabel={dict.reviews.verifiedBadge}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 py-14 text-center">
            <h2 className="font-display text-2xl italic mb-4">
              {dict.home.readyHeading}
            </h2>
            <Link
              href="/shop"
              className="inline-block bg-ink text-paper px-8 py-4 placard-label hover:bg-oxblood transition-colors"
            >
              {dict.home.browseButton}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
