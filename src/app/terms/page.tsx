import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getPageContent } from "@/lib/getPageContent";
import { interpolate } from "@/lib/i18n";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const content = await getPageContent("terms", locale);
  return { title: content.title ?? dict.terms.title };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const content = await getPageContent("terms", locale);

  const lastUpdated = new Date().toLocaleDateString(
    locale === "de" ? "de-DE" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );

  // Each section falls back to the built-in default text if the admin
  // hasn't customized it — same pattern as the homepage content.
  const sections = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const key = `s${n}` as "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8" | "s9" | "s10";
    return {
      heading: content[`s${n}_heading`] ?? dict.terms[key].heading,
      body:
        content[`s${n}_body`] ??
        // s5 and s10 have richer default markup (bold text / a link) —
        // build that same markup as a fallback so it still renders
        // correctly before the admin has customized anything.
        (n === 5
          ? `${dict.terms.s5.before}<strong>${dict.terms.s5.bold}</strong>${dict.terms.s5.after}`
          : n === 10
            ? `${dict.terms.s10.before}<a href="mailto:info@artizastudio.de">info@artizastudio.de</a>${dict.terms.s10.after}`
            : ""),
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">
          {content.eyebrow ?? dict.terms.eyebrow}
        </p>
        <h1 className="font-display text-3xl italic mb-8">
          {content.title ?? dict.terms.title}
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <p className="text-ink-soft">
            {interpolate(dict.terms.lastUpdated, { date: lastUpdated })}
          </p>

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
