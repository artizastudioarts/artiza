import type { supabaseAdmin } from "@/lib/supabase";
import type { CustomBoxArticle, CustomBoxCategory, Product, ProductVariation } from "@/lib/types";

/**
 * The "Build your own box" page lists the shop's own products — each product
 * is a group and each of its options is an article — so nothing has to be
 * entered twice. Article ids look like:
 *   p:<productId>                  product without options
 *   p:<productId>:<variationId>    one option of a product
 * Older ids (a plain uuid) still point at the legacy custom_box_articles table
 * so carts and checkouts that were already in progress keep working.
 *
 * Products with personalization text are left out: a box cannot carry the text.
 */
export const BOX_ARTICLE_PREFIX = "p:";

export function boxArticleId(productId: string, variationId?: string | null) {
  return variationId ? `${BOX_ARTICLE_PREFIX}${productId}:${variationId}` : `${BOX_ARTICLE_PREFIX}${productId}`;
}

export type ResolvedBoxArticle = { categoryLabel: string; articleLabel: string; priceCents: number };

type Db = ReturnType<typeof supabaseAdmin>;

/** Server side: look up the real label and price for each article id. Never trust the client. */
export async function resolveBoxArticles(db: Db, ids: string[]): Promise<Map<string, ResolvedBoxArticle>> {
  const out = new Map<string, ResolvedBoxArticle>();
  const unique = [...new Set(ids)];

  const productIds = new Set<string>();
  const parsed = new Map<string, { productId: string; variationId: string | null }>();
  for (const id of unique) {
    if (!id.startsWith(BOX_ARTICLE_PREFIX)) continue;
    const [productId, variationId] = id.slice(BOX_ARTICLE_PREFIX.length).split(":");
    if (!productId) continue;
    parsed.set(id, { productId, variationId: variationId || null });
    productIds.add(productId);
  }

  if (productIds.size > 0) {
    const [{ data: products }, { data: variations }] = await Promise.all([
      db.from("products").select("id,title,price_cents,variations_enabled,custom_text_enabled").in("id", [...productIds]),
      db.from("product_variations").select("id,product_id,label,price_cents").in("product_id", [...productIds]),
    ]);
    const productById = new Map((products ?? []).map((p) => [p.id as string, p]));
    const variationById = new Map((variations ?? []).map((v) => [v.id as string, v]));
    for (const [id, { productId, variationId }] of parsed) {
      const product = productById.get(productId);
      if (!product || product.custom_text_enabled) continue;
      if (product.variations_enabled) {
        const v = variationId ? variationById.get(variationId) : undefined;
        if (!v || v.product_id !== productId) continue;
        out.set(id, { categoryLabel: product.title, articleLabel: v.label, priceCents: v.price_cents });
      } else if (!variationId) {
        out.set(id, { categoryLabel: product.title, articleLabel: product.title, priceCents: product.price_cents });
      }
    }
  }

  const legacyIds = unique.filter((id) => !id.startsWith(BOX_ARTICLE_PREFIX));
  if (legacyIds.length > 0) {
    const [{ data: articles }, { data: categories }] = await Promise.all([
      db.from("custom_box_articles").select("*").in("id", legacyIds),
      db.from("custom_box_categories").select("*"),
    ]);
    const categoryById = new Map((categories ?? []).map((c) => [c.id as string, c]));
    for (const a of articles ?? []) {
      out.set(a.id as string, {
        categoryLabel: categoryById.get(a.category_id as string)?.name ?? "",
        articleLabel: a.label as string,
        priceCents: a.price_cents as number,
      });
    }
  }
  return out;
}

/** Page side: turn products and their options into the groups/articles the builder shows. */
export function buildBoxCatalog(
  products: Product[],
  variations: ProductVariation[],
  locale: string,
  singleLabel: string
): { categories: CustomBoxCategory[]; articles: CustomBoxArticle[] } {
  const categories: CustomBoxCategory[] = [];
  const articles: CustomBoxArticle[] = [];
  products
    .filter((p) => !p.custom_text_enabled)
    .forEach((p, pi) => {
      const title = locale === "en" ? p.title_en || p.title : p.title;
      const opts = p.variations_enabled
        ? variations.filter((v) => v.product_id === p.id).sort((a, b) => a.sort_order - b.sort_order)
        : [];
      if (p.variations_enabled && opts.length === 0) return;
      categories.push({
        id: p.id,
        name: title,
        name_en: null,
        image_url: p.image_url ?? p.image_urls?.[0] ?? null,
        sort_order: pi,
      });
      if (p.variations_enabled) {
        opts.forEach((v, vi) =>
          articles.push({
            id: boxArticleId(p.id, v.id),
            category_id: p.id,
            label: locale === "en" ? v.label_en || v.label : v.label,
            label_en: null,
            price_cents: v.price_cents,
            sort_order: vi,
          })
        );
      } else {
        articles.push({
          id: boxArticleId(p.id),
          category_id: p.id,
          label: singleLabel,
          label_en: null,
          price_cents: p.price_cents,
          sort_order: 0,
        });
      }
    });
  return { categories, articles };
}
