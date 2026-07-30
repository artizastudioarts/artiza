import { supabasePublic } from "@/lib/supabase";
import { HomeContent } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export const revalidate = 0;

export default async function Home() {
  const { data } = await supabasePublic
    .from("home_content")
    .select("*")
    .eq("id", 1)
    .single();

  const content = data as HomeContent | null;

  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <p className="placard-label mb-4">
            {content?.subheadline ?? "PAINT-YOUR-OWN FIGURE KITS FOR KIDS"}
          </p>
          <h1 className="font-display text-4xl md:text-6xl italic leading-tight max-w-3xl mx-auto">
            {content?.headline ?? "Handmade with care, painted by you"}
          </h1>
          <p className="mt-6 text-ink-soft max-w-xl mx-auto leading-relaxed">
            {content?.body ??
              "We design and hand-finish every figure model before it ships to your door as a paint-it-yourself kit. Watch how each piece comes together, then browse the shop to pick one for your own little artist."}
          </p>
          <Link
            href="/shop"
            className="inline-block mt-8 bg-ink text-paper px-8 py-4 placard-label hover:bg-oxblood transition-colors"
          >
            Shop the collection
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
                controls
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center placard-label text-center px-6">
                Add a video in the admin dashboard to show it here
              </div>
            )}
          </div>
          <p className="placard-label text-center mt-4">
            Every model, hand-finished before it ships
          </p>
        </section>

        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 py-14 text-center">
            <h2 className="font-display text-2xl italic mb-4">
              Ready to pick a model?
            </h2>
            <Link
              href="/shop"
              className="inline-block bg-ink text-paper px-8 py-4 placard-label hover:bg-oxblood transition-colors"
            >
              Browse the shop
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
