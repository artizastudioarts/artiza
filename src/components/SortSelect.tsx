"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/dictionaries";

export default function SortSelect({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.push(`/shop${query ? `?${query}` : ""}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="border border-line px-3 py-2 bg-paper placard-label text-ink-soft"
    >
      <option value="newest">{dict.shop.sortNewest}</option>
      <option value="price_asc">{dict.shop.sortPriceAsc}</option>
      <option value="price_desc">{dict.shop.sortPriceDesc}</option>
      <option value="name_asc">{dict.shop.sortNameAsc}</option>
    </select>
  );
}
