import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FaqAccordion from "@/components/FaqAccordion";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getPageContent } from "@/lib/getPageContent";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = await getPageContent("faq", locale);
  const dict = getDictionary(locale);
  return { title: content.title ?? dict.faq.navLabel };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const content = await getPageContent("faq", locale);

  const items = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    return {
      question: content[`q${n}_question`] ?? "",
      answer: content[`q${n}_answer`] ?? "",
    };
  }).filter((item) => item.question && item.answer);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">
          {content.eyebrow ?? dict.faq.navLabel}
        </p>
        <h1 className="font-display text-3xl italic mb-8">
          {content.title ?? dict.faq.navLabel}
        </h1>

        {items.length > 0 && <FaqAccordion items={items} />}
      </main>
      <Footer />
    </div>
  );
}
