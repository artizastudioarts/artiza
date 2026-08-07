import { supabasePublic } from "@/lib/supabase";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SortSelect from "@/components/SortSelect";
import { getLocale } from "@/lib/getLocale";
import { getDictionary } from "@/lib/dictionaries";
import { Suspense } from "react";
import type { Metadata } from "next";

export const revalidate = 0; // always fetch fresh — no stale "sold" status

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.shop.heading,
    description: dict.shop.body,
    openGraph: { title: dict.shop.heading, description: dict.shop.body },
    twitter: { title: dict.shop.heading, description: dict.shop.body },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;

  let query = supabasePublic.from("products").select("*");
  switch (sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "name_asc":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  const { data: products } = await query;

  const list = (products as Product[]) ?? [];
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div className="max-w-xl">
            <p className="placard-label text-ink-soft mb-3">{dict.shop.eyebrow}</p>
            <h1 className="font-display text-4xl md:text-5xl italic leading-tight">
              {dict.shop.heading}
            </h1>
            <p className="mt-4 text-ink-soft">{dict.shop.body}</p>
          </div>
          {list.length > 0 && (
            <Suspense fallback={null}>
              <SortSelect dict={dict} />
            </Suspense>
          )}
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
