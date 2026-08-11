import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "de" ? "Abgemeldet" : "Unsubscribed" };
}

export default async function UnsubscribedPage() {
  const locale = await getLocale();
  const isDe = locale === "de";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-md mx-auto px-6 py-24 flex-1 w-full text-center">
        <h1 className="font-display text-2xl italic mb-4">
          {isDe ? "Du wurdest abgemeldet" : "You've been unsubscribed"}
        </h1>
        <p className="text-ink-soft">
          {isDe
            ? "Deine E-Mail-Adresse wurde aus unserem Newsletter-Verteiler entfernt. Du kannst dich jederzeit wieder anmelden."
            : "Your email address has been removed from our newsletter. You're welcome to sign up again anytime."}
        </p>
      </main>
      <Footer />
    </div>
  );
}
