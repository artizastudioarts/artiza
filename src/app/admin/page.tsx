"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/types";
import { supabasePublic } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  customer_email: string | null;
  customer_name: string | null;
  phone: string | null;
  shipping_address: Record<string, string> | null;
  product_title: string | null;
  quantity: number;
  amount_total_cents: number | null;
  currency: string | null;
  status: string;
  created_at: string;
};

type ProductBadge =
  | "best_seller"
  | "artists_pick"
  | "trending"
  | "customer_favorite"
  | "new_creations";

const BADGE_OPTIONS: { value: ProductBadge | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "best_seller", label: "Best Seller" },
  { value: "artists_pick", label: "Artist's Pick" },
  { value: "trending", label: "Trending" },
  { value: "customer_favorite", label: "Customer Favorite" },
  { value: "new_creations", label: "New Creation" },
];

type Product = {
  id: string;
  title: string;
  medium: string | null;
  dimensions: string | null;
  artist_note: string | null;
  title_en: string | null;
  medium_en: string | null;
  dimensions_en: string | null;
  artist_note_en: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  image_urls: string[];
  badge: ProductBadge | null;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"orders" | "products" | "home" | "content" | "reviews">(
    "orders"
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl italic">Admin</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("orders")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "orders" ? "bg-ink text-paper" : ""
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setTab("products")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "products" ? "bg-ink text-paper" : ""
            }`}
          >
            Artwork
          </button>
          <button
            onClick={() => setTab("home")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "home" ? "bg-ink text-paper" : ""
            }`}
          >
            Home Page
          </button>
          <button
            onClick={() => setTab("content")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "content" ? "bg-ink text-paper" : ""
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "reviews" ? "bg-ink text-paper" : ""
            }`}
          >
            Reviews
          </button>
        </div>
      </div>

      {tab === "orders" ? (
        <OrdersTab />
      ) : tab === "products" ? (
        <ProductsTab />
      ) : tab === "home" ? (
        <HomeTab />
      ) : tab === "content" ? (
        <ContentTab />
      ) : (
        <ReviewsTab />
      )}
    </main>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (loading) return <p className="text-ink-soft">Loading orders…</p>;
  if (orders.length === 0)
    return <p className="text-ink-soft">No orders yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-line placard-label text-ink-soft">
            <th className="py-2 pr-4">Order #</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Piece</th>
            <th className="py-2 pr-4">Qty</th>
            <th className="py-2 pr-4">Customer</th>
            <th className="py-2 pr-4">Shipping</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line align-top">
              <td className="py-3 pr-4 whitespace-nowrap font-mono text-xs">
                {o.order_number}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">
                {new Date(o.created_at).toLocaleDateString("de-DE")}
              </td>
              <td className="py-3 pr-4">{o.product_title}</td>
              <td className="py-3 pr-4">{o.quantity}</td>
              <td className="py-3 pr-4">
                {o.customer_name}
                <br />
                <span className="text-ink-soft">{o.customer_email}</span>
                {o.phone && (
                  <>
                    <br />
                    <span className="text-ink-soft">{o.phone}</span>
                  </>
                )}
              </td>
              <td className="py-3 pr-4 text-ink-soft">
                {o.shipping_address
                  ? [
                      o.shipping_address.line1,
                      o.shipping_address.postal_code,
                      o.shipping_address.city,
                      o.shipping_address.country,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "—"}
              </td>
              <td className="py-3 pr-4">
                {o.amount_total_cents != null
                  ? formatPrice(o.amount_total_cents, o.currency ?? "eur")
                  : "—"}
              </td>
              <td className="py-3 pr-4">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="border border-line px-2 py-1 bg-paper"
                >
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  function loadProducts() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(loadProducts, []);

  async function updateBadge(id: string, badge: ProductBadge | "") {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, badge: badge || null } : p))
    );
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, badge: badge || null }),
    });
  }

  async function deleteProduct(id: string) {
    if (!confirm("Remove this piece permanently?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div>
      <button
        onClick={() => {
          setEditingProduct(null);
          setShowForm((s) => !s);
        }}
        className="mb-6 bg-ink text-paper px-4 py-2 placard-label"
      >
        {showForm ? "Close" : "+ Add new piece"}
      </button>

      {showForm && (
        <ProductForm
          onSaved={() => {
            setShowForm(false);
            loadProducts();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSaved={() => {
            setEditingProduct(null);
            loadProducts();
          }}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {loading ? (
        <p className="text-ink-soft">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="border border-line">
              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="w-full aspect-[4/5] object-cover"
                />
              )}
              <div className="p-3">
                <p className="font-display">{p.title}</p>
                <p className="placard-label text-ink-soft">
                  {formatPrice(p.price_cents, p.currency)}
                </p>
                <div className="flex items-center justify-between mt-3 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    Badge:
                    <select
                      value={p.badge ?? ""}
                      onChange={(e) =>
                        updateBadge(p.id, e.target.value as ProductBadge | "")
                      }
                      className="border border-line px-2 py-1 bg-paper text-sm"
                    >
                      {BADGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingProduct(p);
                      }}
                      className="text-ink-soft text-sm hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-oxblood text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onSaved,
  onCancel,
}: {
  product?: Product;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: product?.title ?? "",
    medium: product?.medium ?? "",
    dimensions: product?.dimensions ?? "",
    price: product ? (product.price_cents / 100).toString() : "",
    artist_note: product?.artist_note ?? "",
    badge: product?.badge ?? "",
    title_en: product?.title_en ?? "",
    medium_en: product?.medium_en ?? "",
    dimensions_en: product?.dimensions_en ?? "",
    artist_note_en: product?.artist_note_en ?? "",
  });
  const [formLocale, setFormLocale] = useState<"de" | "en">("de");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Keep the existing photos unless the admin chose new ones.
      let image_urls = product?.image_urls?.length
        ? product.image_urls
        : product?.image_url
          ? [product.image_url]
          : [];

      if (files.length > 0) {
        image_urls = [];
        for (const f of files) {
          const fd = new FormData();
          fd.append("file", f);
          const uploadRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: fd,
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error);
          image_urls.push(uploadData.url);
        }
      }

      const image_url = image_urls[0] ?? "";
      const badge = form.badge || null;

      const res = await fetch("/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          product
            ? { id: product.id, ...form, badge, image_url, image_urls }
            : { ...form, badge, image_url, image_urls }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-line p-6 mb-8 space-y-4 max-w-md"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormLocale("de")}
          className={`placard-label px-3 py-1.5 border border-line ${
            formLocale === "de" ? "bg-ink text-paper" : ""
          }`}
        >
          Deutsch
        </button>
        <button
          type="button"
          onClick={() => setFormLocale("en")}
          className={`placard-label px-3 py-1.5 border border-line ${
            formLocale === "en" ? "bg-ink text-paper" : ""
          }`}
        >
          English
        </button>
      </div>

      {formLocale === "de" ? (
        <>
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
          />
          <input
            placeholder="Model / category (e.g. Paint-your-own dinosaur)"
            value={form.medium}
            onChange={(e) => setForm({ ...form, medium: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
          />
          <input
            placeholder="Size / kit contents (e.g. 12cm figure + 6 paints)"
            value={form.dimensions}
            onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
          />
          <textarea
            placeholder="Description (what's included, age range, etc.)"
            value={form.artist_note}
            onChange={(e) => setForm({ ...form, artist_note: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
            rows={3}
          />
        </>
      ) : (
        <>
          <p className="text-ink-soft text-sm">
            Optional — leave any field empty to show the German text to English visitors instead.
          </p>
          <input
            placeholder="Title (English)"
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
          />
          <input
            placeholder="Model / category (English)"
            value={form.medium_en}
            onChange={(e) => setForm({ ...form, medium_en: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
          />
          <input
            placeholder="Size / kit contents (English)"
            value={form.dimensions_en}
            onChange={(e) => setForm({ ...form, dimensions_en: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
          />
          <textarea
            placeholder="Description (English)"
            value={form.artist_note_en}
            onChange={(e) => setForm({ ...form, artist_note_en: e.target.value })}
            className="w-full border border-line px-3 py-2 bg-paper"
            rows={3}
          />
        </>
      )}

      <input
        required
        type="number"
        step="0.01"
        placeholder="Price (EUR)"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        className="w-full border border-line px-3 py-2 bg-paper"
      />
      <div>
        <label className="placard-label text-ink-soft block mb-1">Badge</label>
        <select
          value={form.badge}
          onChange={(e) =>
            setForm({ ...form, badge: e.target.value as ProductBadge | "" })
          }
          className="w-full border border-line px-3 py-2 bg-paper"
        >
          {BADGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        {product?.image_urls?.length && files.length === 0 ? (
          <div className="flex gap-2 mb-2 flex-wrap">
            {product.image_urls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={product.title}
                className="w-16 h-16 object-cover border border-line"
              />
            ))}
          </div>
        ) : null}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <p className="text-ink-soft text-sm mt-1">
          {product
            ? "Select one or more photos to replace the current gallery, or leave empty to keep it. The first photo becomes the cover photo."
            : "You can select more than one photo. The first one becomes the cover photo shown on the shop page."}
        </p>
      </div>
      {error && <p className="text-oxblood text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
        >
          {submitting ? "Saving…" : product ? "Save changes" : "Save piece"}
        </button>
        {product && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-line px-6 py-2 placard-label"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

type HomeContentForm = {
  video_url: string;
};

function HomeTab() {
  const [form, setForm] = useState<HomeContentForm | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/home")
      .then((r) => r.json())
      .then((d) =>
        setForm({
          video_url: d.content?.video_url ?? "",
        })
      );
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      let video_url = form.video_url;
      if (videoFile) {
        setUploading(true);
        const urlRes = await fetch("/api/admin/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: videoFile.name }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData.error);

        const { error: uploadError } = await supabasePublic.storage
          .from("artwork")
          .uploadToSignedUrl(urlData.path, urlData.token, videoFile);
        if (uploadError) throw uploadError;

        video_url = urlData.publicUrl;
        setUploading(false);
      }

      const res = await fetch("/api/admin/home", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, video_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setForm({ ...form, video_url });
      setVideoFile(null);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div className="max-w-xl space-y-14">
      <form onSubmit={handleSave} className="space-y-5">
        <p className="text-ink-soft text-sm">
          This is the video shown on your homepage. To edit the homepage
          headline and text (in German or English), use the{" "}
          <strong>Content</strong> tab above.
        </p>

        <div>
          <label className="placard-label text-ink-soft block mb-1">
            Video (slow-mo of the making process, mp4 works best)
          </label>
          {form.video_url && !videoFile && (
            <video
              src={form.video_url}
              className="w-full max-w-sm mb-2 border border-line"
              controls
              muted
            />
          )}
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
          {uploading && (
            <p className="placard-label text-ink-soft mt-1">Uploading video, this can take a moment…</p>
          )}
        </div>

        {error && <p className="text-oxblood text-sm">{error}</p>}
        {saved && <p className="text-sm text-ink-soft">Saved — check the homepage.</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save homepage content"}
        </button>
      </form>

      <CarouselManager />
    </div>
  );
}

// Pages whose text is editable here. When a new page is built with
// translatable text wired to site_content, add it to this list — the rest
// of this tab is fully generic and needs no other changes.
const CONTENT_PAGES: { key: string; label: string }[] = [
  { key: "home", label: "Home page" },
];

type ContentField = {
  field_key: string;
  label: string;
  field_type: "text" | "textarea";
  value_de: string | null;
  value_en: string | null;
  sort_order: number;
};

function ContentTab() {
  const [pageKey, setPageKey] = useState(CONTENT_PAGES[0].key);
  const [locale, setLocale] = useState<"de" | "en">("de");
  const [fields, setFields] = useState<ContentField[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to a loading state before fetching a newly selected page's fields is intentional, not derived state
    setFields(null);
    fetch(`/api/admin/content?page=${pageKey}`)
      .then((r) => r.json())
      .then((d) => setFields(d.fields ?? []));
  }, [pageKey]);

  useEffect(() => {
    if (!fields) return;
    const next: Record<string, string> = {};
    for (const f of fields) {
      next[f.field_key] = (locale === "de" ? f.value_de : f.value_en) ?? "";
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding the editable form values when the selected page or language changes, not state that can be derived at render time
    setValues(next);
    setSaved(false);
  }, [fields, locale]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: pageKey, locale, values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Reflect the save locally so switching languages shows it right away.
      setFields((prev) =>
        prev
          ? prev.map((f) =>
              locale === "de"
                ? { ...f, value_de: values[f.field_key] ?? "" }
                : { ...f, value_en: values[f.field_key] ?? "" }
            )
          : prev
      );
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <select
          value={pageKey}
          onChange={(e) => setPageKey(e.target.value)}
          className="border border-line px-3 py-2 bg-paper placard-label"
        >
          {CONTENT_PAGES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocale("de")}
            className={`placard-label px-3 py-2 border border-line ${
              locale === "de" ? "bg-ink text-paper" : ""
            }`}
          >
            Deutsch
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`placard-label px-3 py-2 border border-line ${
              locale === "en" ? "bg-ink text-paper" : ""
            }`}
          >
            English
          </button>
        </div>
      </div>

      {!fields ? (
        <p className="text-ink-soft">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <p className="text-ink-soft text-sm">
            {locale === "de"
              ? "Leave a field empty to fall back to the site's built-in German text."
              : "Leave a field empty to fall back to the site's built-in English text."}
          </p>
          {fields
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((f) => (
              <div key={f.field_key}>
                <label className="placard-label text-ink-soft block mb-1">
                  {f.label}
                </label>
                {f.field_type === "textarea" ? (
                  <textarea
                    value={values[f.field_key] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [f.field_key]: e.target.value })
                    }
                    rows={4}
                    className="w-full border border-line px-3 py-2 bg-paper"
                  />
                ) : (
                  <input
                    value={values[f.field_key] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [f.field_key]: e.target.value })
                    }
                    className="w-full border border-line px-3 py-2 bg-paper"
                  />
                )}
              </div>
            ))}

          {error && <p className="text-oxblood text-sm">{error}</p>}
          {saved && <p className="text-sm text-ink-soft">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${locale === "de" ? "German" : "English"} text`}
          </button>
        </form>
      )}
    </div>
  );
}

type CarouselImageRow = {
  id: string;
  image_url: string;
  caption_de: string | null;
  caption_en: string | null;
  sort_order: number;
};

function CarouselManager() {
  const [images, setImages] = useState<CarouselImageRow[] | null>(null);
  const [captions, setCaptions] = useState<Record<string, { de: string; en: string }>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/carousel")
      .then((r) => r.json())
      .then((d) => {
        const rows: CarouselImageRow[] = d.images ?? [];
        setImages(rows);
        setCaptions(
          Object.fromEntries(
            rows.map((r) => [r.id, { de: r.caption_de ?? "", en: r.caption_en ?? "" }])
          )
        );
      });
  }

  useEffect(load, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);

        const res = await fetch("/api/admin/carousel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: uploadData.url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function saveCaptions(id: string) {
    const c = captions[id];
    await fetch("/api/admin/carousel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, caption_de: c.de || null, caption_en: c.en || null }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Remove this photo from the gallery?")) return;
    setImages((prev) => prev?.filter((i) => i.id !== id) ?? null);
    await fetch("/api/admin/carousel", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function move(id: string, direction: -1 | 1) {
    if (!images) return;
    const index = images.findIndex((i) => i.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= images.length) return;
    const a = images[index];
    const b = images[swapIndex];

    const next = [...images];
    next[index] = b;
    next[swapIndex] = a;
    setImages(next);

    await Promise.all([
      fetch("/api/admin/carousel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, sort_order: b.sort_order }),
      }),
      fetch("/api/admin/carousel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, sort_order: a.sort_order }),
      }),
    ]);
  }

  return (
    <div>
      <h2 className="font-display text-xl italic mb-2">Homepage gallery carousel</h2>
      <p className="text-ink-soft text-sm mb-5">
        Photos shown in the scrolling gallery near the bottom of the
        homepage. Captions are optional and can differ between German and
        English.
      </p>

      {images === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : (
        <div className="space-y-4 mb-6">
          {images.map((img, i) => (
            <div key={img.id} className="border border-line p-3 flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt=""
                className="w-20 h-20 object-cover border border-line shrink-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Caption (German)"
                  value={captions[img.id]?.de ?? ""}
                  onChange={(e) =>
                    setCaptions({
                      ...captions,
                      [img.id]: { ...captions[img.id], de: e.target.value },
                    })
                  }
                  onBlur={() => saveCaptions(img.id)}
                  className="w-full border border-line px-2 py-1.5 bg-paper text-sm"
                />
                <input
                  placeholder="Caption (English)"
                  value={captions[img.id]?.en ?? ""}
                  onChange={(e) =>
                    setCaptions({
                      ...captions,
                      [img.id]: { ...captions[img.id], en: e.target.value },
                    })
                  }
                  onBlur={() => saveCaptions(img.id)}
                  className="w-full border border-line px-2 py-1.5 bg-paper text-sm"
                />
              </div>
              <div className="flex flex-col justify-between items-end shrink-0">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(img.id, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    className="border border-line w-7 h-7 text-ink-soft disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(img.id, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                    className="border border-line w-7 h-7 text-ink-soft disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="text-oxblood text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <p className="text-ink-soft text-sm">No photos yet — add some below.</p>
          )}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleUpload(e.target.files)}
      />
      {uploading && (
        <p className="placard-label text-ink-soft mt-2">Uploading…</p>
      )}
      {error && <p className="text-oxblood text-sm mt-2">{error}</p>}
    </div>
  );
}

type AdminReview = {
  id: string;
  order_number: string;
  customer_name: string;
  rating: number | null;
  review_text: string;
  image_url: string | null;
  status: "pending" | "approved" | "featured" | "rejected";
  created_at: string;
};

const REVIEW_STATUS_LABELS: Record<AdminReview["status"], string> = {
  pending: "New",
  approved: "Approved (on /reviews)",
  featured: "Featured (on homepage)",
  rejected: "Rejected",
};

function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [filter, setFilter] = useState<"all" | AdminReview["status"]>("all");

  function load() {
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []));
  }

  useEffect(load, []);

  async function setStatus(id: string, status: AdminReview["status"]) {
    setReviews((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev
    );
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setReviews((prev) => prev?.filter((r) => r.id !== id) ?? null);
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const filtered = reviews?.filter((r) => filter === "all" || r.status === filter) ?? [];

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "pending", "approved", "featured", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`placard-label px-3 py-1.5 border border-line ${
              filter === f ? "bg-ink text-paper" : ""
            }`}
          >
            {f === "all" ? "All" : REVIEW_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {reviews === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-soft">No reviews here yet.</p>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {filtered.map((r) => (
            <div key={r.id} className="border border-line p-4 flex gap-4">
              {r.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.image_url}
                  alt=""
                  className="w-24 h-24 object-cover border border-line shrink-0"
                />
              ) : (
                <div className="w-24 h-24 border border-line shrink-0 flex items-center justify-center text-ink-soft placard-label">
                  No photo
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-display text-lg">{r.customer_name}</p>
                  <span className="placard-label text-ink-soft">
                    {REVIEW_STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="placard-label text-ink-soft mb-1">
                  Order {r.order_number}
                  {r.rating ? ` · ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}` : ""}
                </p>
                <p className="text-sm text-ink-soft mb-3">{r.review_text}</p>
                <div className="flex gap-3 flex-wrap text-sm">
                  {r.status !== "featured" && (
                    <button
                      onClick={() => setStatus(r.id, "featured")}
                      className="text-oxblood hover:underline"
                    >
                      Feature on homepage
                    </button>
                  )}
                  {r.status !== "approved" && (
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      className="text-ink-soft hover:underline"
                    >
                      {r.status === "featured" ? "Un-feature (keep approved)" : "Approve"}
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(r.id, "rejected")}
                      className="text-ink-soft hover:underline"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    className="text-oxblood hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
