import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import { getPageContent } from "@/lib/getPageContent";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = await getPageContent("widerruf", locale);
  return { title: content.title ?? "Widerrufsbelehrung" };
}

export default async function WiderrufPage() {
  const locale = await getLocale();
  const content = await getPageContent("widerruf", locale);

  const sections = Array.from({ length: 4 }, (_, i) => {
    const n = i + 1;
    return {
      heading: content[`s${n}_heading`] ?? "",
      body: content[`s${n}_body`] ?? "",
    };
  }).filter((s) => s.heading && s.body);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">
          {content.eyebrow ?? (locale === "de" ? "Rechtliches" : "Legal")}
        </p>
        <h1 className="font-display text-3xl italic mb-8">
          {content.title ?? (locale === "de" ? "Widerrufsbelehrung" : "Right of Withdrawal")}
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-display text-lg mb-2">{s.heading}</h2>
              <p dangerouslySetInnerHTML={{ __html: s.body }} />
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
