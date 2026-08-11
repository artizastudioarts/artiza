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
  shipping_cents: number | null;
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
  weight_grams: number | null;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<
    | "orders"
    | "products"
    | "home"
    | "content"
    | "reviews"
    | "emails"
    | "shipping"
    | "invoices"
    | "discounts"
    | "newsletter"
  >("orders");

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
          <button
            onClick={() => setTab("emails")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "emails" ? "bg-ink text-paper" : ""
            }`}
          >
            Emails
          </button>
          <button
            onClick={() => setTab("shipping")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "shipping" ? "bg-ink text-paper" : ""
            }`}
          >
            Shipping
          </button>
          <button
            onClick={() => setTab("invoices")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "invoices" ? "bg-ink text-paper" : ""
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setTab("discounts")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "discounts" ? "bg-ink text-paper" : ""
            }`}
          >
            Discounts
          </button>
          <button
            onClick={() => setTab("newsletter")}
            className={`placard-label px-4 py-2 border border-line ${
              tab === "newsletter" ? "bg-ink text-paper" : ""
            }`}
          >
            Newsletter
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
      ) : tab === "reviews" ? (
        <ReviewsTab />
      ) : tab === "emails" ? (
        <EmailsTab />
      ) : tab === "shipping" ? (
        <ShippingTab />
      ) : tab === "invoices" ? (
        <InvoicesTab />
      ) : tab === "discounts" ? (
        <DiscountsTab />
      ) : (
        <NewsletterTab />
      )}
    </main>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  type DocInfo = { invoice_number: string; pdf_path: string | null };
  const [invoicesByOrder, setInvoicesByOrder] = useState<Record<string, DocInfo>>({});
  const [creditNotesByOrder, setCreditNotesByOrder] = useState<Record<string, DocInfo>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadInvoices is defined in this component and only needs to run once on mount, like the orders fetch above
  }, []);

  function loadInvoices() {
    fetch("/api/admin/invoices")
      .then((r) => r.json())
      .then((d) => {
        const invoices: Record<string, DocInfo> = {};
        const creditNotes: Record<string, DocInfo> = {};
        for (const inv of d.invoices ?? []) {
          // Invoices are returned newest-first — keep the first (latest) per order.
          const target = inv.type === "credit_note" ? creditNotes : invoices;
          if (!target[inv.order_number]) {
            target[inv.order_number] = {
              invoice_number: inv.invoice_number,
              pdf_path: inv.pdf_path,
            };
          }
        }
        setInvoicesByOrder(invoices);
        setCreditNotesByOrder(creditNotes);
      });
  }

  async function downloadInvoice(pdfPath: string) {
    const res = await fetch(`/api/admin/invoices/download?path=${encodeURIComponent(pdfPath)}`);
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
  }

  async function generateInvoice(orderNumber: string) {
    setGenerating(orderNumber);
    await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_number: orderNumber }),
    });
    setGenerating(null);
    loadInvoices();
  }

  async function generateCreditNote(orderNumber: string) {
    setGenerating(`credit:${orderNumber}`);
    await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_number: orderNumber, type: "credit_note" }),
    });
    setGenerating(null);
    loadInvoices();
  }

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

  // Multiple products bought in one checkout share one order number —
  // group them so it reads as one order, not several unrelated rows.
  const groups: Order[][] = [];
  const byNumber = new Map<string, Order[]>();
  for (const o of orders) {
    const list = byNumber.get(o.order_number) ?? [];
    list.push(o);
    byNumber.set(o.order_number, list);
  }
  groups.push(...byNumber.values());

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
            <th className="py-2 pr-4">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const first = group[0];
            return group.map((o, i) => (
              <tr
                key={o.id}
                className={`border-b border-line align-top ${
                  i === 0 ? "border-t-2 border-t-ink" : ""
                }`}
              >
                {i === 0 && (
                  <>
                    <td
                      className="py-3 pr-4 whitespace-nowrap font-mono text-xs"
                      rowSpan={group.length}
                    >
                      {first.order_number}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap" rowSpan={group.length}>
                      {new Date(first.created_at).toLocaleDateString("de-DE")}
                    </td>
                  </>
                )}
                <td className="py-3 pr-4">{o.product_title}</td>
                <td className="py-3 pr-4">{o.quantity}</td>
                {i === 0 && (
                  <td className="py-3 pr-4" rowSpan={group.length}>
                    {first.customer_name}
                    <br />
                    <span className="text-ink-soft">{first.customer_email}</span>
                    {first.phone && (
                      <>
                        <br />
                        <span className="text-ink-soft">{first.phone}</span>
                      </>
                    )}
                  </td>
                )}
                {i === 0 && (
                  <td className="py-3 pr-4 text-ink-soft" rowSpan={group.length}>
                    {first.shipping_address
                      ? [
                          first.shipping_address.line1,
                          first.shipping_address.postal_code,
                          first.shipping_address.city,
                          first.shipping_address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "—"}
                    {first.shipping_cents != null && (
                      <>
                        <br />
                        <span className="text-xs">
                          Versand:{" "}
                          {first.shipping_cents === 0
                            ? "kostenlos"
                            : formatPrice(first.shipping_cents, first.currency ?? "eur")}
                        </span>
                      </>
                    )}
                  </td>
                )}
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
                {i === 0 && (
                  <td className="py-3 pr-4" rowSpan={group.length}>
                    <div className="space-y-1.5">
                      <div>
                        {invoicesByOrder[first.order_number]?.pdf_path ? (
                          <button
                            onClick={() =>
                              downloadInvoice(invoicesByOrder[first.order_number].pdf_path!)
                            }
                            className="placard-label text-ink-soft hover:text-ink whitespace-nowrap"
                          >
                            Invoice ↓
                          </button>
                        ) : (
                          <button
                            onClick={() => generateInvoice(first.order_number)}
                            disabled={generating === first.order_number}
                            className="placard-label text-oxblood hover:underline whitespace-nowrap disabled:opacity-50"
                          >
                            {generating === first.order_number ? "Generating…" : "Generate invoice"}
                          </button>
                        )}
                      </div>
                      {first.status === "cancelled" && invoicesByOrder[first.order_number] && (
                        <div>
                          {creditNotesByOrder[first.order_number]?.pdf_path ? (
                            <button
                              onClick={() =>
                                downloadInvoice(creditNotesByOrder[first.order_number].pdf_path!)
                              }
                              className="placard-label text-ink-soft hover:text-ink whitespace-nowrap"
                            >
                              Credit note ↓
                            </button>
                          ) : (
                            <button
                              onClick={() => generateCreditNote(first.order_number)}
                              disabled={generating === `credit:${first.order_number}`}
                              className="placard-label text-oxblood hover:underline whitespace-nowrap disabled:opacity-50"
                            >
                              {generating === `credit:${first.order_number}`
                                ? "Generating…"
                                : "Generate credit note"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ));
          })}
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
    weight_grams: product?.weight_grams != null ? product.weight_grams.toString() : "",
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
      const weight_grams = form.weight_grams ? Math.max(0, Math.round(Number(form.weight_grams))) : null;

      const res = await fetch("/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          product
            ? { id: product.id, ...form, badge, weight_grams, image_url, image_urls }
            : { ...form, badge, weight_grams, image_url, image_urls }
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
            placeholder="Description (what's included, materials, etc.)"
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
        <label className="placard-label text-ink-soft block mb-1">
          Weight (grams) — used to calculate shipping
        </label>
        <input
          type="number"
          min={0}
          placeholder="e.g. 400"
          value={form.weight_grams}
          onChange={(e) => setForm({ ...form, weight_grams: e.target.value })}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
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
  { key: "terms", label: "Terms & Conditions" },
  { key: "impressum", label: "Impressum" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "faq", label: "FAQ" },
  { key: "contact", label: "Contact page" },
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

type EmailTemplateKey = "order_confirmation" | "order_status_changed" | "abandoned_cart";

type EmailTemplateRow = {
  key: EmailTemplateKey;
  subject: string;
  body: string;
};

const EMAIL_TEMPLATE_META: Record<
  EmailTemplateKey,
  { label: string; description: string; placeholders: string[] }
> = {
  order_confirmation: {
    label: "Order confirmation",
    description: "Sent once, right after a customer completes checkout.",
    placeholders: ["{{customer_name}}", "{{order_numbers}}", "{{items}}", "{{total}}"],
  },
  order_status_changed: {
    label: "Order status update",
    description: "Sent whenever you change an order's status in the Orders tab.",
    placeholders: ["{{customer_name}}", "{{order_number}}", "{{status}}", "{{items}}"],
  },
  abandoned_cart: {
    label: "Abandoned cart",
    description:
      "Sent automatically if a customer reaches Stripe checkout, enters their email, but doesn't finish paying within an hour.",
    placeholders: ["{{items}}"],
  },
};

const EMAIL_TEMPLATE_KEYS: EmailTemplateKey[] = [
  "order_confirmation",
  "order_status_changed",
  "abandoned_cart",
];

function EmailsTab() {
  const [selected, setSelected] = useState<EmailTemplateKey>("order_confirmation");
  const [templates, setTemplates] = useState<Record<string, EmailTemplateRow> | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, EmailTemplateRow> = {};
        for (const t of d.templates ?? []) map[t.key] = t;
        setTemplates(map);
      });
  }, []);

  useEffect(() => {
    if (!templates?.[selected]) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding the editable form fields when the selected template changes, not state that can be derived at render time
    setSubject(templates[selected].subject);
    setBody(templates[selected].body);
    setSaved(false);
  }, [templates, selected]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selected, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) =>
        prev ? { ...prev, [selected]: { key: selected, subject, body } } : prev
      );
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const meta = EMAIL_TEMPLATE_META[selected];

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-6 flex-wrap">
        {EMAIL_TEMPLATE_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`placard-label px-3 py-2 border border-line ${
              selected === key ? "bg-ink text-paper" : ""
            }`}
          >
            {EMAIL_TEMPLATE_META[key].label}
          </button>
        ))}
      </div>

      {!templates ? (
        <p className="text-ink-soft">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <p className="text-ink-soft text-sm">{meta.description}</p>

          <div className="border border-line p-3 bg-paper-dim">
            <p className="placard-label text-ink-soft mb-2">
              Available placeholders — click to copy the idea, then type them into your text:
            </p>
            <div className="flex flex-wrap gap-2">
              {meta.placeholders.map((p) => (
                <code key={p} className="bg-paper border border-line px-2 py-1 text-xs">
                  {p}
                </code>
              ))}
            </div>
          </div>

          <div>
            <label className="placard-label text-ink-soft block mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full border border-line px-3 py-2 bg-paper"
            />
          </div>

          <div>
            <label className="placard-label text-ink-soft block mb-1">
              Email body (HTML)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={14}
              className="w-full border border-line px-3 py-2 bg-paper font-mono text-sm"
            />
            <p className="text-ink-soft text-xs mt-1">
              This is raw HTML — simple tags like &lt;p&gt;, &lt;strong&gt;, and &lt;br&gt;
              work well. {"{{items}}"} inserts a ready-made list, not raw data.
            </p>
          </div>

          {error && <p className="text-oxblood text-sm">{error}</p>}
          {saved && <p className="text-sm text-ink-soft">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
        </form>
      )}
    </div>
  );
}

type ShippingRateRow = {
  id: string;
  method: "standard" | "express";
  min_weight_g: number;
  max_weight_g: number | null;
  price_cents: number;
  sort_order: number;
};

function ShippingTab() {
  const [rates, setRates] = useState<ShippingRateRow[] | null>(null);
  const [threshold, setThreshold] = useState("");
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [newTier, setNewTier] = useState<
    Record<"standard" | "express", { min: string; max: string; price: string }>
  >({
    standard: { min: "", max: "", price: "" },
    express: { min: "", max: "", price: "" },
  });

  function load() {
    fetch("/api/admin/shipping")
      .then((r) => r.json())
      .then((d) => {
        setRates(d.rates ?? []);
        const cents = d.settings?.free_standard_threshold_cents;
        setThresholdEnabled(cents != null);
        setThreshold(cents != null ? (cents / 100).toString() : "");
      });
  }

  useEffect(load, []);

  async function saveThreshold() {
    setSavingThreshold(true);
    const value = thresholdEnabled ? Math.round(Number(threshold) * 100) : null;
    await fetch("/api/admin/shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setting: "free_standard_threshold_cents", value }),
    });
    setSavingThreshold(false);
  }

  async function updateTier(id: string, fields: Partial<ShippingRateRow>) {
    setRates((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, ...fields } : r)) : prev
    );
    await fetch("/api/admin/shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
  }

  async function deleteTier(id: string) {
    if (!confirm("Remove this shipping tier?")) return;
    setRates((prev) => prev?.filter((r) => r.id !== id) ?? null);
    await fetch("/api/admin/shipping", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function addTier(method: "standard" | "express") {
    const t = newTier[method];
    if (!t.min || !t.price) return;
    const res = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        min_weight_g: Number(t.min),
        max_weight_g: t.max ? Number(t.max) : null,
        price_cents: Math.round(Number(t.price) * 100),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setRates((prev) => (prev ? [...prev, data.rate] : [data.rate]));
      setNewTier((prev) => ({ ...prev, [method]: { min: "", max: "", price: "" } }));
    }
  }

  if (rates === null) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-10">
      <p className="text-ink-soft text-sm">
        Shipping cost is calculated automatically from the total weight of
        everything in a customer&apos;s cart, against the tiers below. Set
        each product&apos;s weight in the Artwork tab — products left blank
        use a 300g default so checkout never breaks.
      </p>

      <div className="border border-line p-4">
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={thresholdEnabled}
            onChange={(e) => setThresholdEnabled(e.target.checked)}
          />
          <span className="placard-label text-ink-soft">
            Free Standard shipping above a certain order amount
          </span>
        </label>
        {thresholdEnabled && (
          <div className="flex items-center gap-2 mb-2">
            <span>€</span>
            <input
              type="number"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-28 border border-line px-2 py-1 bg-paper"
            />
            <span className="text-ink-soft text-sm">
              (Express always stays paid, even above this amount)
            </span>
          </div>
        )}
        <button
          onClick={saveThreshold}
          disabled={savingThreshold}
          className="bg-ink text-paper px-4 py-1.5 placard-label text-sm disabled:opacity-50"
        >
          {savingThreshold ? "Saving…" : "Save"}
        </button>
      </div>

      <TierTable
        method="standard"
        tiers={rates.filter((r) => r.method === "standard")}
        draft={newTier.standard}
        onUpdate={updateTier}
        onDelete={deleteTier}
        onDraftChange={(field, value) =>
          setNewTier((prev) => ({
            ...prev,
            standard: { ...prev.standard, [field]: value },
          }))
        }
        onAdd={() => addTier("standard")}
      />
      <TierTable
        method="express"
        tiers={rates.filter((r) => r.method === "express")}
        draft={newTier.express}
        onUpdate={updateTier}
        onDelete={deleteTier}
        onDraftChange={(field, value) =>
          setNewTier((prev) => ({
            ...prev,
            express: { ...prev.express, [field]: value },
          }))
        }
        onAdd={() => addTier("express")}
      />
    </div>
  );
}

type TierDraft = { min: string; max: string; price: string };

function TierTable({
  method,
  tiers,
  draft,
  onUpdate,
  onDelete,
  onDraftChange,
  onAdd,
}: {
  method: "standard" | "express";
  tiers: ShippingRateRow[];
  draft: TierDraft;
  onUpdate: (id: string, fields: Partial<ShippingRateRow>) => void;
  onDelete: (id: string) => void;
  onDraftChange: (field: keyof TierDraft, value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <h3 className="font-display text-lg italic mb-3 capitalize">
        {method === "standard" ? "Standard shipping" : "Express shipping"}
      </h3>
      <table className="w-full text-sm border-collapse mb-3">
        <thead>
          <tr className="text-left border-b border-line placard-label text-ink-soft">
            <th className="py-2 pr-4">Min (g)</th>
            <th className="py-2 pr-4">Max (g)</th>
            <th className="py-2 pr-4">Price (€)</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.id} className="border-b border-line">
              <td className="py-2 pr-4">
                <input
                  type="number"
                  value={tier.min_weight_g}
                  onChange={(e) =>
                    onUpdate(tier.id, { min_weight_g: Number(e.target.value) })
                  }
                  className="w-20 border border-line px-2 py-1 bg-paper"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="number"
                  placeholder="no limit"
                  value={tier.max_weight_g ?? ""}
                  onChange={(e) =>
                    onUpdate(tier.id, {
                      max_weight_g: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-24 border border-line px-2 py-1 bg-paper"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="number"
                  step="0.01"
                  value={(tier.price_cents / 100).toString()}
                  onChange={(e) =>
                    onUpdate(tier.id, {
                      price_cents: Math.round(Number(e.target.value) * 100),
                    })
                  }
                  className="w-24 border border-line px-2 py-1 bg-paper"
                />
              </td>
              <td className="py-2 pr-4">
                <button
                  onClick={() => onDelete(tier.id)}
                  className="text-oxblood text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-2 pr-4">
              <input
                type="number"
                placeholder="min"
                value={draft.min}
                onChange={(e) => onDraftChange("min", e.target.value)}
                className="w-20 border border-line px-2 py-1 bg-paper"
              />
            </td>
            <td className="py-2 pr-4">
              <input
                type="number"
                placeholder="no limit"
                value={draft.max}
                onChange={(e) => onDraftChange("max", e.target.value)}
                className="w-24 border border-line px-2 py-1 bg-paper"
              />
            </td>
            <td className="py-2 pr-4">
              <input
                type="number"
                step="0.01"
                placeholder="price"
                value={draft.price}
                onChange={(e) => onDraftChange("price", e.target.value)}
                className="w-24 border border-line px-2 py-1 bg-paper"
              />
            </td>
            <td className="py-2 pr-4">
              <button
                onClick={onAdd}
                className="placard-label text-ink-soft hover:text-ink"
              >
                + Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type InvoiceSettingsForm = {
  business_name: string;
  address_line1: string;
  postal_code: string;
  city: string;
  country: string;
  tax_number: string;
  kleinunternehmer: boolean;
  footer_note: string;
  bank_iban: string;
  bank_bic: string;
};

function InvoicesTab() {
  const [settings, setSettings] = useState<InvoiceSettingsForm | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [templateHtml, setTemplateHtml] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetch("/api/admin/invoice-settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings ?? {};
        setSettings({
          business_name: s.business_name ?? "",
          address_line1: s.address_line1 ?? "",
          postal_code: s.postal_code ?? "",
          city: s.city ?? "",
          country: s.country ?? "Deutschland",
          tax_number: s.tax_number ?? "",
          kleinunternehmer: s.kleinunternehmer ?? true,
          footer_note: s.footer_note ?? "",
          bank_iban: s.bank_iban ?? "",
          bank_bic: s.bank_bic ?? "",
        });
      });
    fetch("/api/admin/invoice-template")
      .then((r) => r.json())
      .then((d) => setTemplateHtml(d.html ?? ""));
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setSettingsSaved(false);
    await fetch("/api/admin/invoice-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavingSettings(false);
    setSettingsSaved(true);
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSavingTemplate(true);
    setTemplateSaved(false);
    await fetch("/api/admin/invoice-template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: templateHtml }),
    });
    setSavingTemplate(false);
    setTemplateSaved(true);
  }

  function exportCsv() {
    window.open(
      `/api/admin/invoices/export?year=${exportYear}&month=${exportMonth}`,
      "_blank"
    );
  }

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

  return (
    <div className="max-w-2xl space-y-14">
      <div className="border border-line p-4 bg-paper-dim">
        <p className="text-sm text-ink-soft">
          Fill in your business details below — this appears on every invoice
          and is legally required. As a Kleinunternehmer, invoices show a
          total amount with a legal notice instead of a VAT breakdown.
        </p>
      </div>

      <div>
        <h2 className="font-display text-xl italic mb-4">Business details</h2>
        {!settings ? (
          <p className="text-ink-soft">Loading…</p>
        ) : (
          <form onSubmit={saveSettings} className="space-y-4">
            <input
              placeholder="Legal business name"
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-paper"
            />
            <input
              placeholder="Street and house number"
              value={settings.address_line1}
              onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-paper"
            />
            <div className="flex gap-3">
              <input
                placeholder="Postal code"
                value={settings.postal_code}
                onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                className="w-1/3 border border-line px-3 py-2 bg-paper"
              />
              <input
                placeholder="City"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="flex-1 border border-line px-3 py-2 bg-paper"
              />
            </div>
            <input
              placeholder="Country"
              value={settings.country}
              onChange={(e) => setSettings({ ...settings, country: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-paper"
            />
            <input
              placeholder="Steuernummer (tax number)"
              value={settings.tax_number}
              onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
              className="w-full border border-line px-3 py-2 bg-paper"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.kleinunternehmer}
                onChange={(e) =>
                  setSettings({ ...settings, kleinunternehmer: e.target.checked })
                }
              />
              <span className="placard-label text-ink-soft">
                Kleinunternehmer (§19 UStG — no VAT charged)
              </span>
            </label>
            <textarea
              placeholder="Footer note (optional — e.g. return policy reference)"
              value={settings.footer_note}
              onChange={(e) => setSettings({ ...settings, footer_note: e.target.value })}
              rows={2}
              className="w-full border border-line px-3 py-2 bg-paper"
            />
            <div className="flex gap-3">
              <input
                placeholder="IBAN (optional)"
                value={settings.bank_iban}
                onChange={(e) => setSettings({ ...settings, bank_iban: e.target.value })}
                className="flex-1 border border-line px-3 py-2 bg-paper"
              />
              <input
                placeholder="BIC (optional)"
                value={settings.bank_bic}
                onChange={(e) => setSettings({ ...settings, bank_bic: e.target.value })}
                className="w-40 border border-line px-3 py-2 bg-paper"
              />
            </div>
            {settingsSaved && <p className="text-sm text-ink-soft">Saved.</p>}
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
            >
              {savingSettings ? "Saving…" : "Save business details"}
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl italic mb-2">PDF template</h2>
        <div className="border border-line p-3 bg-paper-dim mb-3">
          <p className="placard-label text-ink-soft mb-2">Available placeholders:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "{{invoice_number}}", "{{invoice_date}}", "{{order_number}}",
              "{{business_name}}", "{{business_address}}", "{{tax_number}}",
              "{{customer_name}}", "{{customer_address}}", "{{items_rows}}",
              "{{shipping_amount}}", "{{total_amount}}",
              "{{kleinunternehmer_notice}}", "{{footer_note}}",
            ].map((p) => (
              <code key={p} className="bg-paper border border-line px-2 py-1 text-xs">
                {p}
              </code>
            ))}
          </div>
        </div>
        <form onSubmit={saveTemplate} className="space-y-3">
          <textarea
            value={templateHtml}
            onChange={(e) => setTemplateHtml(e.target.value)}
            rows={18}
            className="w-full border border-line px-3 py-2 bg-paper font-mono text-xs"
          />
          <p className="text-ink-soft text-xs">
            This is the full HTML/CSS used to generate the invoice PDF.{" "}
            {"{{items_rows}}"} inserts a ready-made table of rows — don&apos;t
            build the item list by hand.
          </p>
          {templateSaved && <p className="text-sm text-ink-soft">Saved.</p>}
          <button
            type="submit"
            disabled={savingTemplate}
            className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
          >
            {savingTemplate ? "Saving…" : "Save template"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-xl italic mb-2">Monthly export</h2>
        <p className="text-ink-soft text-sm mb-4">
          Download every invoice issued in a given month as a spreadsheet —
          ready to hand to a Steuerberater or import into bookkeeping
          software.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={exportMonth}
            onChange={(e) => setExportMonth(Number(e.target.value))}
            className="border border-line px-3 py-2 bg-paper"
          >
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={exportYear}
            onChange={(e) => setExportYear(Number(e.target.value))}
            className="w-24 border border-line px-3 py-2 bg-paper"
          />
          <button
            onClick={exportCsv}
            className="bg-ink text-paper px-6 py-2 placard-label"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

type PromotionCode = {
  id: string;
  code: string;
  active: boolean;
  times_redeemed: number;
  max_redemptions: number | null;
  expires_at: number | null;
  promotion: {
    coupon: {
      percent_off: number | null;
      amount_off: number | null;
      currency: string | null;
    } | null;
  };
};

function DiscountsTab() {
  const [codes, setCodes] = useState<PromotionCode[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    expiresAt: "",
    maxRedemptions: "",
  });

  function load() {
    fetch("/api/admin/discounts")
      .then((r) => r.json())
      .then((d) => setCodes(d.codes ?? []));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create discount code");
      return;
    }
    setForm({ code: "", type: "percent", value: "", expiresAt: "", maxRedemptions: "" });
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    setCodes((prev) => prev?.map((c) => (c.id === id ? { ...c, active } : c)) ?? null);
    await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  }

  function describeCoupon(coupon: PromotionCode["promotion"]["coupon"]) {
    if (!coupon) return "—";
    if (coupon.percent_off) return `${coupon.percent_off}% off`;
    if (coupon.amount_off) return formatPrice(coupon.amount_off, coupon.currency ?? "eur");
    return "—";
  }

  return (
    <div className="max-w-3xl space-y-10">
      <p className="text-ink-soft text-sm">
        Codes created here show up automatically as an &quot;Add promotion
        code&quot; field on Stripe&apos;s checkout page — nothing else to
        wire up.
      </p>

      <form onSubmit={handleCreate} className="border border-line p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="CODE (e.g. WELCOME10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
            className="border border-line px-3 py-2 bg-paper flex-1 min-w-[140px]"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
            className="border border-line px-3 py-2 bg-paper"
          >
            <option value="percent">% off</option>
            <option value="fixed">€ off</option>
          </select>
          <input
            type="number"
            step={form.type === "percent" ? "1" : "0.01"}
            placeholder={form.type === "percent" ? "10" : "5.00"}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
            className="w-28 border border-line px-3 py-2 bg-paper"
          />
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <label className="text-sm text-ink-soft">
            Expires (optional)
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="ml-2 border border-line px-3 py-2 bg-paper"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Max uses (optional)
            <input
              type="number"
              min={1}
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              className="ml-2 w-24 border border-line px-3 py-2 bg-paper"
            />
          </label>
        </div>
        {error && <p className="text-oxblood text-sm">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create code"}
        </button>
      </form>

      {codes === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-ink-soft">No discount codes yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-line placard-label text-ink-soft">
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Discount</th>
              <th className="py-2 pr-4">Used</th>
              <th className="py-2 pr-4">Expires</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="py-3 pr-4 font-mono">{c.code}</td>
                <td className="py-3 pr-4">{describeCoupon(c.promotion.coupon)}</td>
                <td className="py-3 pr-4">
                  {c.times_redeemed}
                  {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                </td>
                <td className="py-3 pr-4">
                  {c.expires_at ? new Date(c.expires_at * 1000).toLocaleDateString("de-DE") : "—"}
                </td>
                <td className="py-3 pr-4">{c.active ? "Active" : "Disabled"}</td>
                <td className="py-3 pr-4">
                  <button
                    onClick={() => toggleActive(c.id, !c.active)}
                    className="placard-label text-oxblood hover:underline"
                  >
                    {c.active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

type NewsletterSubscriber = {
  id: string;
  email: string;
  locale: string;
  subscribed_at: string;
};

function NewsletterTab() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/newsletter")
      .then((r) => r.json())
      .then((d) => setSubscribers(d.subscribers ?? []));
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-ink-soft text-sm">
          Anyone who signs up on the homepage newsletter section shows up
          here, along with the welcome code they were sent (set under
          Admin → Content → Home page, field &quot;newsletterCode&quot; —
          make sure it matches a real code created in the Discounts tab).
        </p>
        <a
          href="/api/admin/newsletter/export"
          className="bg-ink text-paper px-4 py-2 placard-label whitespace-nowrap ml-4"
        >
          Export CSV
        </a>
      </div>

      {subscribers === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : subscribers.length === 0 ? (
        <p className="text-ink-soft">No subscribers yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-line placard-label text-ink-soft">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Language</th>
              <th className="py-2 pr-4">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="py-3 pr-4">{s.email}</td>
                <td className="py-3 pr-4">{s.locale.toUpperCase()}</td>
                <td className="py-3 pr-4">
                  {new Date(s.subscribed_at).toLocaleDateString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
