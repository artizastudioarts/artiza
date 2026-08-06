import type { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";

  const { data: products } = await supabasePublic
    .from("products")
    .select("id, created_at");

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/product/${p.id}`,
    lastModified: p.created_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/reviews`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    ...productEntries,
  ];
}
