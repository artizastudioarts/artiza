"use client";

import { useEffect, useState } from "react";
import FormMessage from "@/components/FormMessage";
import type { ShipmentRecord, SupplyItem, SupplyKind } from "@/lib/types";
import { SUPPLY_KIND_LABELS } from "./SuppliesTab";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  shipped_at: today(),
  order_number: "",
  kit_batch_number: "",
  notes: "",
  supply_ids: [] as string[],
});

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default function ShipmentsTab() {
  const [shipments, setShipments] = useState<ShipmentRecord[] | null>(null);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [search, setSearch] = useState("");
  const [supplySearch, setSupplySearch] = useState("");

  function load() {
    fetch("/api/admin/shipments")
      .then((r) => r.json())
      .then((d) => setShipments(d.shipments ?? []));
  }

  useEffect(() => {
    load();
    fetch("/api/admin/supplies")
      .then((r) => r.json())
      .then((d) => setSupplies(d.items ?? []));
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        const numbers = (d.orders ?? []).map((o: { order_number: string }) => o.order_number);
        setOrderNumbers(Array.from(new Set<string>(numbers)));
      });
    }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    const res = await fetch(
      editingId ? `/api/admin/shipments/${editingId}` : "/api/admin/shipments",
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
    setSaved(editingId ? "Changes saved." : "Package recorded.");
    setForm(emptyForm());
    setEditingId(null);
    load();
  }

  function startEdit(s: ShipmentRecord) {
    setEditingId(s.id);
    setSaved("");
    setError("");
    setForm({
      shipped_at: s.shipped_at,
      order_number: s.order_number,
      kit_batch_number: s.kit_batch_number,
      notes: s.notes ?? "",
      supply_ids: s.shipment_supplies.map((l) => l.supply_id),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function handleDelete(s: ShipmentRecord) {
    if (!window.confirm(`Delete the record for order ${s.order_number}?`)) return;
    setError("");
    setSaved("");
    const res = await fetch(`/api/admin/shipments/${s.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not delete");
      return;
    }
    if (editingId === s.id) cancelEdit();
    load();
  }

  function toggleSupply(id: string) {
    setForm((f) => ({
      ...f,
      supply_ids: f.supply_ids.includes(id)
        ? f.supply_ids.filter((x) => x !== id)
        : [...f.supply_ids, id],
    }));
  }

  const sq = supplySearch.trim().toLowerCase();
  const pickable = supplies.filter(
    (s) =>
      !sq ||
      form.supply_ids.includes(s.id) ||
      [s.name, s.supplier, s.batch_number].some((v) => v.toLowerCase().includes(sq))
  );

  const q = search.trim().toLowerCase();
  const visible = (shipments ?? []).filter((s) => {
    if (!q) return true;
    const hay = [
      s.order_number,
      s.kit_batch_number,
      s.notes ?? "",
      ...s.shipment_supplies.flatMap((l) =>
        l.supply_items ? [l.supply_items.name, l.supply_items.batch_number, l.supply_items.supplier] : []
      ),
    ];
    return hay.some((v) => v.toLowerCase().includes(q));
  });

  const field = "border border-line px-3 py-2 bg-paper w-full";
  const kinds: SupplyKind[] = ["casting_powder", "paint", "other"];

  function linked(s: ShipmentRecord, kind: SupplyKind) {
    return s.shipment_supplies
      .map((l) => l.supply_items)
      .filter((i): i is SupplyItem => i !== null && i.kind === kind);
  }

  return (
    <div className="max-w-4xl space-y-8">
      <p className="text-ink-soft text-sm">
        Record each package you ship: its order number, your own kit batch number, and the paint
        and casting powder batches that went into it. Add materials first under the Supplies tab.
        Search by any batch number to see every package that used it, and export the whole log to
        CSV when you need it.
      </p>

      <form onSubmit={handleSubmit} className="border border-line p-4 space-y-3">
        <p className="placard-label text-ink-soft">
          {editingId ? "Edit package record" : "Record a shipped package"}
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm text-ink-soft">
            Shipping date
            <input
              type="date"
              value={form.shipped_at}
              onChange={(e) => setForm({ ...form, shipped_at: e.target.value })}
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className="text-sm text-ink-soft">
            Order number
            <input
              list="order-number-options"
              value={form.order_number}
              onChange={(e) => setForm({ ...form, order_number: e.target.value })}
              placeholder="e.g. AS-2610-000012"
              required
              className={`${field} mt-1`}
            />
            <datalist id="order-number-options">
              {orderNumbers.slice(0, 200).map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          <label className="text-sm text-ink-soft">
            Kit batch number
            <input
              value={form.kit_batch_number}
              onChange={(e) => setForm({ ...form, kit_batch_number: e.target.value })}
              placeholder="your own batch number"
              required
              className={`${field} mt-1`}
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-ink-soft">
            Materials used ({form.supply_ids.length} selected)
          </p>
          {supplies.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No supplies yet. Add your paints and casting powder under the Supplies tab first.
            </p>
          ) : (
            <>
              <input
                value={supplySearch}
                onChange={(e) => setSupplySearch(e.target.value)}
                placeholder="Filter by name, supplier or batch…"
                className={field}
              />
              <div className="border border-line max-h-64 overflow-y-auto p-3 space-y-4">
                {kinds.map((k) => {
                  const list = pickable.filter((s) => s.kind === k);
                  if (list.length === 0) return null;
                  return (
                    <div key={k}>
                      <p className="placard-label text-ink-soft mb-1">{SUPPLY_KIND_LABELS[k]}</p>
                      {list.map((s) => (
                        <label key={s.id} className="flex items-start gap-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={form.supply_ids.includes(s.id)}
                            onChange={() => toggleSupply(s.id)}
                            className="mt-1"
                          />
                          <span>
                            {s.name}{" "}
                            <span className="text-ink-soft">
                              — batch <span className="font-mono">{s.batch_number}</span>,{" "}
                              {s.supplier}, bought {fmtDate(s.purchased_at)}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Record package"}
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
          placeholder="Search order, kit batch, or any material batch…"
          className="border border-line px-3 py-2 bg-paper flex-1 min-w-[200px]"
        />
        {/* A plain link is right here: it downloads a CSV file, not a page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/shipments/export"
          className="bg-ink text-paper px-4 py-2 placard-label whitespace-nowrap"
        >
          Export CSV
        </a>
      </div>

      {shipments === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-ink-soft">
          {shipments.length === 0 ? "No packages recorded yet." : "No records match."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-line placard-label text-ink-soft">
                <th className="py-2 pr-4">Shipped</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Kit batch</th>
                <th className="py-2 pr-4">Casting powder</th>
                <th className="py-2 pr-4">Paints</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(s.shipped_at)}</td>
                  <td className="py-3 pr-4 font-mono whitespace-nowrap">{s.order_number}</td>
                  <td className="py-3 pr-4 font-mono">{s.kit_batch_number}</td>
                  <td className="py-3 pr-4">
                    {linked(s, "casting_powder").map((i) => (
                      <p key={i.id}>
                        {i.name} <span className="font-mono text-ink-soft">({i.batch_number})</span>
                      </p>
                    ))}
                    {linked(s, "casting_powder").length === 0 && "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {[...linked(s, "paint"), ...linked(s, "other")].map((i) => (
                      <p key={i.id}>
                        {i.name} <span className="font-mono text-ink-soft">({i.batch_number})</span>
                      </p>
                    ))}
                    {linked(s, "paint").length + linked(s, "other").length === 0 && "—"}
                    {s.notes && <p className="text-ink-soft text-xs mt-1">{s.notes}</p>}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(s)}
                      className="placard-label hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
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
