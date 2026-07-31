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

type Product = {
  id: string;
  title: string;
  medium: string | null;
  dimensions: string | null;
  artist_note: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  image_urls: string[];
  stock_quantity: number;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"orders" | "products" | "home">("orders");

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
        </div>
      </div>

      {tab === "orders" ? (
        <OrdersTab />
      ) : tab === "products" ? (
        <ProductsTab />
      ) : (
        <HomeTab />
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

  async function updateStock(id: string, stock_quantity: number) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity } : p))
    );
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock_quantity }),
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
                    In stock:
                    <input
                      type="number"
                      min={0}
                      value={p.stock_quantity}
                      onChange={(e) =>
                        updateStock(p.id, Math.max(0, Number(e.target.value)))
                      }
                      className="w-16 border border-line px-2 py-1 bg-paper"
                    />
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
    stock_quantity: product ? product.stock_quantity.toString() : "",
  });
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

      const res = await fetch("/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          product
            ? { id: product.id, ...form, image_url, image_urls }
            : { ...form, image_url, image_urls }
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
      <input
        required
        type="number"
        step="0.01"
        placeholder="Price (EUR)"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        className="w-full border border-line px-3 py-2 bg-paper"
      />
      <input
        required
        type="number"
        min={0}
        placeholder="Stock quantity"
        value={form.stock_quantity}
        onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
        className="w-full border border-line px-3 py-2 bg-paper"
      />
      <textarea
        placeholder="Description (what's included, age range, etc.)"
        value={form.artist_note}
        onChange={(e) => setForm({ ...form, artist_note: e.target.value })}
        className="w-full border border-line px-3 py-2 bg-paper"
        rows={3}
      />
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
  headline: string;
  subheadline: string;
  body: string;
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
          headline: d.content?.headline ?? "",
          subheadline: d.content?.subheadline ?? "",
          body: d.content?.body ?? "",
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
    <form onSubmit={handleSave} className="max-w-xl space-y-5">
      <p className="text-ink-soft text-sm">
        This is the content shown on your homepage — the brand story people
        see before they ever reach the shop.
      </p>

      <div>
        <label className="placard-label text-ink-soft block mb-1">Small label above headline</label>
        <input
          value={form.subheadline}
          onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>

      <div>
        <label className="placard-label text-ink-soft block mb-1">Headline</label>
        <input
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>

      <div>
        <label className="placard-label text-ink-soft block mb-1">Body text</label>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={4}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>

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
  );
}
