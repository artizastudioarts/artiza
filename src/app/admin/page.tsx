"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/types";

type Order = {
  id: string;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: Record<string, string> | null;
  product_title: string | null;
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
  price_cents: number;
  currency: string;
  image_url: string | null;
  is_sold: boolean;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"orders" | "products">("orders");

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
        </div>
      </div>

      {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
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
          <tr className="text-left border-b border-line placard-label">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Piece</th>
            <th className="py-2 pr-4">Customer</th>
            <th className="py-2 pr-4">Shipping</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line align-top">
              <td className="py-3 pr-4 whitespace-nowrap">
                {new Date(o.created_at).toLocaleDateString("de-DE")}
              </td>
              <td className="py-3 pr-4">{o.product_title}</td>
              <td className="py-3 pr-4">
                {o.customer_name}
                <br />
                <span className="text-ink-soft">{o.customer_email}</span>
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

  function loadProducts() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(loadProducts, []);

  async function toggleSold(id: string, is_sold: boolean) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_sold } : p))
    );
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_sold }),
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
        onClick={() => setShowForm((s) => !s)}
        className="mb-6 bg-ink text-paper px-4 py-2 placard-label"
      >
        {showForm ? "Close" : "+ Add new piece"}
      </button>

      {showForm && (
        <NewProductForm
          onCreated={() => {
            setShowForm(false);
            loadProducts();
          }}
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
                <p className="placard-label">
                  {formatPrice(p.price_cents, p.currency)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={p.is_sold}
                      onChange={(e) => toggleSold(p.id, e.target.checked)}
                    />
                    Sold
                  </label>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="text-oxblood text-sm"
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

function NewProductForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    medium: "",
    dimensions: "",
    price: "",
    artist_note: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      let image_url = "";
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        image_url = uploadData.url;
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated();
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
        placeholder="Medium (e.g. Oil on canvas)"
        value={form.medium}
        onChange={(e) => setForm({ ...form, medium: e.target.value })}
        className="w-full border border-line px-3 py-2 bg-paper"
      />
      <input
        placeholder="Dimensions (e.g. 60 x 80 cm)"
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
      <textarea
        placeholder="Artist note / description"
        value={form.artist_note}
        onChange={(e) => setForm({ ...form, artist_note: e.target.value })}
        className="w-full border border-line px-3 py-2 bg-paper"
        rows={3}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="text-oxblood text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save piece"}
      </button>
    </form>
  );
}
