import { supabasePublic } from "@/lib/supabase";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";

export const revalidate = 0; // always fetch fresh — no stale "sold" status

export default async function ShopPage() {
  const { data: products } = await supabasePublic
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (products as Product[]) ?? [];
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="mb-12 max-w-xl">
          <p className="placard-label text-ink-soft mb-3">{dict.shop.eyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl italic leading-tight">
            {dict.shop.heading}
          </h1>
          <p className="mt-4 text-ink-soft">{dict.shop.body}</p>
        </div>

        {list.length === 0 ? (
          <p className="text-ink-soft">{dict.shop.empty}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} dict={dict} locale={locale} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
