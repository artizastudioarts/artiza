import type { Metadata } from "next";
import { Fraunces, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getShippingSettings } from "@/lib/getShippingSettings";
import { formatPrice } from "@/lib/types";
import { interpolate } from "@/lib/i18n";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Artiza Studio — Paint-Your-Own Figures",
    template: "%s — Artiza Studio",
  },
  description:
    "Paintable figure kits for kids, shipped with care.",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Artiza Studio — Paint-Your-Own Figures",
    description: "Paintable figure kits for kids, shipped with care.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artiza Studio — Paint-Your-Own Figures",
    description: "Paintable figure kits for kids, shipped with care.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const shippingSettings = await getShippingSettings();
  const threshold = shippingSettings?.free_standard_threshold_cents;

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {threshold != null && (
          <div className="bg-ink text-paper text-center py-2 px-4">
            <p className="placard-label">
              {interpolate(dict.shipping.freeBanner, {
                amount: formatPrice(threshold, "eur"),
              })}
            </p>
          </div>
        )}
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
