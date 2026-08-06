import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: dict.cookies.pageTitle };
}

export default async function CookiesPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const isDe = locale === "de";
  const lastUpdated = new Date().toLocaleDateString(isDe ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">{dict.cookies.pageEyebrow}</p>
        <h1 className="font-display text-3xl italic mb-8">{dict.cookies.pageTitle}</h1>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <p className="text-ink-soft">
            {isDe ? "Zuletzt aktualisiert" : "Last updated"}: {lastUpdated}
          </p>

          {isDe ? (
            <>
              <section>
                <h2 className="font-display text-lg mb-2">Was sind Cookies?</h2>
                <p>
                  Cookies sind kleine Textdateien, die auf deinem Gerät gespeichert werden,
                  wenn du unsere Website besuchst. Sie helfen der Website, sich an
                  Informationen über deinen Besuch zu erinnern.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Notwendige Cookies</h2>
                <p>
                  Diese sind für den Betrieb der Website erforderlich und können nicht
                  deaktiviert werden:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <strong>locale</strong> — speichert, ob du die Website auf Deutsch
                    oder Englisch ansiehst.
                  </li>
                  <li>
                    <strong>cookie_consent</strong> — speichert deine Cookie-Einstellungen,
                    damit wir dich nicht bei jedem Besuch erneut fragen.
                  </li>
                  <li>
                    <strong>Anmelde-Cookies</strong> — falls du ein Konto erstellst, halten
                    diese dich zwischen Besuchen angemeldet.
                  </li>
                </ul>
                <p className="mt-2">
                  Dein Warenkorb wird nicht über Cookies, sondern über den lokalen
                  Speicher deines Browsers (localStorage) verwaltet, mit demselben Zweck.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Statistik-Cookies</h2>
                <p>
                  Helfen uns zu verstehen, wie die Website genutzt wird. Wir nutzen dafür{" "}
                  <strong>Vercel Web Analytics</strong>, das anonymisierte Nutzungsdaten
                  erfasst, ohne Cookies zu setzen oder dich persönlich zu identifizieren.
                  Diese Kategorie ist nur mit deiner Zustimmung aktiv.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Marketing-Cookies</h2>
                <p>
                  Würden für personalisierte Werbung oder E-Mail-Tracking verwendet. Wir
                  setzen aktuell keine Marketing-Dienste ein — diese Kategorie ist für
                  eine mögliche zukünftige Nutzung vorbereitet und nur mit deiner
                  Zustimmung aktiv.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Deine Auswahl ändern</h2>
                <p>
                  Du kannst deine Cookie-Einstellungen jederzeit über den Link
                  „Cookie-Einstellungen&quot; in der Fußzeile dieser Website ändern.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="font-display text-lg mb-2">What are cookies?</h2>
                <p>
                  Cookies are small text files stored on your device when you visit our
                  website. They help the site remember information about your visit.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Necessary cookies</h2>
                <p>These are required for the site to work and can&apos;t be turned off:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <strong>locale</strong> — remembers whether you&apos;re viewing the
                    site in German or English.
                  </li>
                  <li>
                    <strong>cookie_consent</strong> — remembers your cookie preferences so
                    we don&apos;t ask again on every visit.
                  </li>
                  <li>
                    <strong>Login cookies</strong> — if you create an account, these keep
                    you signed in between visits.
                  </li>
                </ul>
                <p className="mt-2">
                  Your cart isn&apos;t managed via cookies — it uses your browser&apos;s
                  local storage instead, for the same purpose.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Statistics cookies</h2>
                <p>
                  Help us understand how the site is used. We use{" "}
                  <strong>Vercel Web Analytics</strong> for this, which collects
                  anonymized usage data without setting cookies or identifying you
                  personally. This category is only active with your consent.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Marketing cookies</h2>
                <p>
                  Would be used for personalized ads or email tracking. We don&apos;t
                  currently use any marketing services — this category is ready for
                  possible future use, and only active with your consent.
                </p>
              </section>

              <section>
                <h2 className="font-display text-lg mb-2">Changing your choice</h2>
                <p>
                  You can update your cookie preferences at any time using the
                  &quot;Cookie Settings&quot; link in this site&apos;s footer.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
