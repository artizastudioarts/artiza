import { supabasePublic } from "@/lib/supabase";
import { HomeContent } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getPageContent } from "@/lib/getPageContent";

export const revalidate = 0;

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
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="relative aspect-video bg-paper-dim overflow-hidden">
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
