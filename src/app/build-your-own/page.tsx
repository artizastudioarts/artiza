import { supabasePublic } from "@/lib/supabase";
import type { Product, ProductVariation } from "@/lib/types";
import { buildBoxCatalog } from "@/lib/customBoxCatalog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomBoxBuilder from "@/components/CustomBoxBuilder";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { getShippingSettings } from "@/lib/getShippingSettings";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.customBox.heading,
    description: dict.customBox.subheading,
  };
}

export default async function BuildYourOwnPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const [{ data: productRows }, { data: variationRows }, shippingSettings] = await Promise.all([
    supabasePublic.from("products").select("*").order("created_at", { ascending: false }),
    supabasePublic.from("product_variations").select("*"),
    getShippingSettings(),
  ]);

  // Every shop product with all its options — nothing to maintain twice.
  const { categories, articles } = buildBoxCatalog(
    (productRows as Product[]) ?? [],
    (variationRows as ProductVariation[]) ?? [],
    locale,
    "Standard"
  );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-14 flex-1 w-full">
        <h1 className="font-display text-3xl italic mb-2">{dict.customBox.heading}</h1>
        <p className="text-ink-soft mb-10">{dict.customBox.subheading}</p>
        {categories.length === 0 ? (
          <p className="text-ink-soft">{dict.customBox.empty}</p>
        ) : (
          <CustomBoxBuilder
            categories={categories}
            articles={articles}
            minOrderCents={shippingSettings?.custom_box_min_order_cents ?? 0}
            currency="eur"
            dict={dict}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
