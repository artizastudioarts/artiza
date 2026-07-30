import { supabasePublic } from "@/lib/supabase";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";

export const revalidate = 0; // always fetch fresh, no stale "sold" status

export default async function Home() {
  const { data: products } = await supabasePublic
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (products as Product[]) ?? [];

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="mb-12 max-w-xl">
          <p className="placard-label mb-3">Original works, one at a time</p>
          <h1 className="font-display text-4xl md:text-5xl italic leading-tight">
            Each piece is one of one.
          </h1>
          <p className="mt-4 text-ink-soft">
            Browse the current collection below. Once a piece sells, it&apos;s
            gone for good — no reprints, no editions.
          </p>
        </div>

        {list.length === 0 ? (
          <p className="text-ink-soft">
            No pieces are listed yet. Add some in the admin dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-line py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 placard-label">
          © {new Date().getFullYear()} Studio. All artwork shipped with care.
        </div>
      </footer>
    </>
  );
}
