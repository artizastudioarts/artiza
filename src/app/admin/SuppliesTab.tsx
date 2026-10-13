"use client";

import { useEffect, useState } from "react";
import FormMessage from "@/components/FormMessage";
import type { SupplyItem, SupplyKind } from "@/lib/types";

export const SUPPLY_KIND_LABELS: Record<SupplyKind, string> = {
  paint: "Paint",
  casting_powder: "Casting powder",
  other: "Other",
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  kind: "paint" as SupplyKind,
  name: "",
  supplier: "",
  batch_number: "",
  purchased_at: today(),
  quantity: "",
  best_before: "",
  invoice_number: "",
  notes: "",
});

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default function SuppliesTab() {
  const [items, setItems] = useState<SupplyItem[] | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | SupplyKind>("all");

  function load() {
    fetch("/api/admin/supplies")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    const res = await fetch(
      editingId ? `/api/admin/supplies/${editingId}` : "/api/admin/supplies",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setSaved(editingId ? "Changes saved." : "Added to your supplies.");
    setForm(emptyForm());
    setEditingId(null);
    load();
  }

  function startEdit(item: SupplyItem) {
    setEditingId(item.id);
    setSaved("");
    setError("");
    setForm({
      kind: item.kind,
      name: item.name,
      supplier: item.supplier,
      batch_number: item.batch_number,
      purchased_at: item.purchased_at,
      quantity: item.quantity ?? "",
      best_before: item.best_before ?? "",
      invoice_number: item.invoice_number ?? "",
      notes: item.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function handleDelete(item: SupplyItem) {
    if (!window.confirm(`Delete "${item.name}" (batch ${item.batch_number})?`)) return;
    setError("");
    setSaved("");
    const res = await fetch(`/api/admin/supplies/${item.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not delete");
      return;
    }
    if (editingId === item.id) cancelEdit();
    load();
  }

  const q = search.trim().toLowerCase();
  const visible = (items ?? []).filter((i) => {
    if (kindFilter !== "all" && i.kind !== kindFilter) return false;
    if (!q) return true;
    return [i.name, i.supplier, i.batch_number, i.invoice_number, i.notes]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const field = "border border-line px-3 py-2 bg-paper w-full";

  return (
    <div className="max-w-4xl space-y-8">
      <p className="text-ink-soft text-sm">
        A record of every paint and batch of casting powder you buy, so a shipped package can be
        traced back to its materials. Nothing is counted or deducted. Keep the paper receipts in
        your own folder and note the invoice number here to find them. Use &quot;Export CSV&quot;
        whenever you need the list.
      </p>

      <form onSubmit={handleSubmit} className="border border-line p-4 space-y-3">
        <p className="placard-label text-ink-soft">
          {editingId ? "Edit entry" : "Add a purchase"}
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm text-ink-soft">
            Type
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as SupplyKind })}
              className={`${field} mt-1`}
            >
              {(Object.keys(SUPPLY_KIND_LABELS) as SupplyKind[]).map((k) => (
                <option key={k} value={k}>
                  {SUPPLY_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink-soft sm:col-span-2">
            Name / colour
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Fingerfarbe Rot, Gießpulver Ultraweiß"
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Supplier
            <input
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Batch number (Charge / LOT)
            <input
              value={form.batch_number}
              onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Purchase date
            <input
              type="date"
              value={form.purchased_at}
              onChange={(e) => setForm({ ...form, purchased_at: e.target.value })}
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Quantity (optional)
            <input
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="e.g. 6 x 250 ml, 5 kg"
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Best before (optional)
            <input
              type="date"
              value={form.best_before}
              onChange={(e) => setForm({ ...form, best_before: e.target.value })}
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Invoice number (optional)
            <input
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              className={`${field} mt-1`}
            />
          </label>
        </div>
        <label className="text-sm text-ink-soft block">
          Notes (optional)
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className={`${field} mt-1`}
          />
        </label>
        {error && <FormMessage type="error">{error}</FormMessage>}
        {saved && <FormMessage type="success">{saved}</FormMessage>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-paper px-6 py-2 placard-label disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add to supplies"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="border border-line px-6 py-2 placard-label"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, supplier, batch, invoice…"
          className="border border-line px-3 py-2 bg-paper flex-1 min-w-[200px]"
        />
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as "all" | SupplyKind)}
          className="border border-line px-3 py-2 bg-paper"
        >
          <option value="all">All types</option>
          {(Object.keys(SUPPLY_KIND_LABELS) as SupplyKind[]).map((k) => (
            <option key={k} value={k}>
              {SUPPLY_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        {/* A plain link is right here: it downloads a CSV file, not a page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/supplies/export"
          className="bg-ink text-paper px-4 py-2 placard-label whitespace-nowrap"
        >
          Export CSV
        </a>
      </div>

      {items === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-ink-soft">
          {items.length === 0 ? "No supplies recorded yet." : "No entries match."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-line placard-label text-ink-soft">
                <th className="py-2 pr-4">Bought</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Supplier</th>
                <th className="py-2 pr-4">Batch</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Best before</th>
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <tr key={i.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(i.purchased_at)}</td>
                  <td className="py-3 pr-4">{SUPPLY_KIND_LABELS[i.kind]}</td>
                  <td className="py-3 pr-4">
                    {i.name}
                    {i.notes && <p className="text-ink-soft text-xs mt-1">{i.notes}</p>}
                  </td>
                  <td className="py-3 pr-4">{i.supplier}</td>
                  <td className="py-3 pr-4 font-mono">{i.batch_number}</td>
                  <td className="py-3 pr-4">{i.quantity ?? "—"}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(i.best_before)}</td>
                  <td className="py-3 pr-4">{i.invoice_number ?? "—"}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(i)}
                      className="placard-label hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="placard-label text-oxblood hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
