import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { interpolate } from "@/lib/i18n";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: dict.terms.title };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const lastUpdated = new Date().toLocaleDateString(
    locale === "de" ? "de-DE" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const sections = [dict.terms.s1, dict.terms.s2, dict.terms.s3, dict.terms.s4];
  const laterSections = [dict.terms.s6, dict.terms.s7, dict.terms.s8, dict.terms.s9];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">{dict.terms.eyebrow}</p>
        <h1 className="font-display text-3xl italic mb-8">{dict.terms.title}</h1>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <p className="text-ink-soft">{interpolate(dict.terms.lastUpdated, { date: lastUpdated })}</p>

          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-lg mb-2">{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}

          <section>
            <h2 className="font-display text-lg mb-2">{dict.terms.s5.heading}</h2>
            <p>
              {dict.terms.s5.before}
              <strong>{dict.terms.s5.bold}</strong>
              {dict.terms.s5.after}
            </p>
          </section>

          {laterSections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-lg mb-2">{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}

          <section>
            <h2 className="font-display text-lg mb-2">{dict.terms.s10.heading}</h2>
            <p>
              {dict.terms.s10.before}
              <a href="mailto:info@artizastudio.de" className="underline">
                info@artizastudio.de
              </a>
              {dict.terms.s10.after}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
