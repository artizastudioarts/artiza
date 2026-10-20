import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnsubscribeForm from "@/components/UnsubscribeForm";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.newsletter.unsubTitle };
}

export default async function UnsubscribePage() {
  const dict = getDictionary(await getLocale());
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-md mx-auto px-6 py-20 flex-1 w-full text-center">
        <h1 className="font-display text-2xl italic mb-4">{dict.newsletter.unsubTitle}</h1>
        <p className="text-ink-soft mb-8">{dict.newsletter.unsubBody}</p>
        <UnsubscribeForm />
      </main>
      <Footer />
    </div>
  );
}
