import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Functional/private pages — nothing to gain from search engines
      // indexing these, and no harm in keeping crawlers away from them.
      disallow: ["/admin", "/api", "/cart", "/account", "/success"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
