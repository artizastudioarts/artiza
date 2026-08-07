import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getPageContent } from "@/lib/getPageContent";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = await getPageContent("contact", locale);
  const dict = getDictionary(locale);
  return { title: content.title ?? dict.contact.navLabel };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const content = await getPageContent("contact", locale);
  // Reuse the same phone/email already entered for the Impressum page —
  // one place to keep this up to date, not two.
  const impressum = await getPageContent("impressum", locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">
          {content.eyebrow ?? dict.contact.navLabel}
        </p>
        <h1 className="font-display text-3xl italic mb-4">
          {content.title ?? dict.contact.navLabel}
        </h1>
        {content.intro && <p className="text-ink-soft mb-8">{content.intro}</p>}

        {(impressum.email || impressum.phone) && (
          <div className="mb-10 text-sm text-ink-soft">
            {impressum.email && (
              <p>
                {dict.impressum.emailLabel}:{" "}
                <a href={`mailto:${impressum.email}`} className="underline">
                  {impressum.email}
                </a>
              </p>
            )}
            {impressum.phone && (
              <p>
                {dict.impressum.phoneLabel}: {impressum.phone}
              </p>
            )}
          </div>
        )}

        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}
