import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WithdrawalForm from "@/components/WithdrawalForm";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.widerruf.pageTitle };
}

export default async function WithdrawalPage() {
  const dict = getDictionary(await getLocale());
  const w = dict.widerruf;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">{w.eyebrow}</p>
        <h1 className="font-display text-3xl italic mb-4">{w.pageTitle}</h1>
        <p className="text-ink-soft mb-4">{w.intro}</p>
        <p className="text-sm text-ink-soft mb-8">
          {w.exemptNote}{" "}
          <Link href="/widerruf" className="underline">
            {w.infoLink}
          </Link>
        </p>
        <WithdrawalForm />
      </main>
      <Footer />
    </div>
  );
}
