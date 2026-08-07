import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getPageContent } from "@/lib/getPageContent";
import { getInvoiceSettings } from "@/lib/getInvoiceSettings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: dict.impressum.pageTitle };
}

export default async function ImpressumPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const content = await getPageContent("impressum", locale);
  // Business name and address come from the same place your invoices
  // pull them from — one source of truth, filled in once.
  const settings = await getInvoiceSettings();

  const businessAddressLines = [
    settings?.address_line1,
    [settings?.postal_code, settings?.city].filter(Boolean).join(" "),
    settings?.country,
  ].filter(Boolean);

  const hasDetails = Boolean(settings?.business_name && content.ownerName);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">{dict.impressum.pageEyebrow}</p>
        <h1 className="font-display text-3xl italic mb-8">{dict.impressum.pageTitle}</h1>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          {!hasDetails && (
            <p className="text-oxblood border border-line p-3">
              {dict.impressum.missingDetailsNote}
            </p>
          )}

          <section>
            <h2 className="font-display text-lg mb-2">{dict.impressum.sectionHeading}</h2>
            {settings?.business_name && <p>{settings.business_name}</p>}
            {content.ownerName && <p>{content.ownerName}</p>}
            {businessAddressLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">{dict.impressum.contactHeading}</h2>
            {content.phone && (
              <p>
                {dict.impressum.phoneLabel}: {content.phone}
              </p>
            )}
            {content.email && (
              <p>
                {dict.impressum.emailLabel}:{" "}
                <a href={`mailto:${content.email}`} className="underline">
                  {content.email}
                </a>
              </p>
            )}
          </section>

          {content.vatId && (
            <section>
              <h2 className="font-display text-lg mb-2">{dict.impressum.vatIdLabel}</h2>
              <p>{content.vatId}</p>
            </section>
          )}

          {content.disputeResolutionNote && (
            <section>
              <h2 className="font-display text-lg mb-2">
                {dict.impressum.disputeResolutionHeading}
              </h2>
              <p>{content.disputeResolutionNote}</p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
