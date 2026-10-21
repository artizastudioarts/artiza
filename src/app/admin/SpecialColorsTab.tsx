"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  name_en: string | null;
  hex: string | null;
  price_cents: number;
  active: boolean;
};

type Draft = { name: string; name_en: string; hex: string; price: string; active: boolean };

const inputClass = "border border-line px-3 py-2 bg-paper text-sm w-full";

export default function SpecialColorsTab() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newColor, setNewColor] = useState<Draft>({ name: "", name_en: "", hex: "#d4af37", price: "0.50", active: true });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/admin/special-colors")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) {
          setError(d.error ?? "Could not load the special colors");
          setRows([]);
          return;
        }
        const list: Row[] = d.colors ?? [];
        setRows(list);
        setDrafts(
          Object.fromEntries(
            list.map((c) => [
              c.id,
              {
                name: c.name,
                name_en: c.name_en ?? "",
                hex: c.hex ?? "#dddddd",
                price: (c.price_cents / 100).toFixed(2),
                active: c.active,
              },
            ])
          )
        );
      })
      .catch(() => {
        setError("Could not load the special colors");
        setRows([]);
      });
  }

  useEffect(load, []);

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function call(method: "POST" | "PATCH" | "DELETE", body: unknown, okMessage: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const res = await fetch("/api/admin/special-colors", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(d.error ?? "Something went wrong");
      return false;
    }
    setNotice(okMessage);
    load();
    return true;
  }

  async function add() {
    const ok = await call("POST", newColor, "Color added.");
    if (ok) setNewColor({ name: "", name_en: "", hex: "#d4af37", price: "0.50", active: true });
  }

  return (
    <div className="max-w-3xl space-y-8">
      <p className="text-ink-soft text-sm">
        Special add-on colors (for example glitter colors) that customers can add to <strong>every</strong>{" "}
        product. On each product page they see the colors below with their price; every color they
        choose is added to the price <strong>per set</strong> and shown on the order, the invoice and the
        emails. Nothing appears on the product pages until you add at least one active color.
      </p>

      {error && <p className="text-sm text-oxblood">{error}</p>}
      {notice && <p className="text-sm text-ink-soft">{notice}</p>}

      <div className="border border-line p-4 space-y-3">
        <p className="placard-label text-ink-soft">Add a special color</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Name (German)
            <input
              className={inputClass}
              value={newColor.name}
              placeholder="z. B. Glitzer Gold"
              onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Name (English)
            <input
              className={inputClass}
              value={newColor.name_en}
              placeholder="e.g. Glitter gold"
              onChange={(e) => setNewColor({ ...newColor, name_en: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Swatch color (shown as a dot)
            <input
              type="color"
              className="block h-10 w-20 border border-line bg-paper"
              value={newColor.hex}
              onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Price per color (€)
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={newColor.price}
              onChange={(e) => setNewColor({ ...newColor, price: e.target.value })}
            />
          </label>
        </div>
        <button
          onClick={add}
          disabled={busy || !newColor.name.trim()}
          className="bg-ink text-paper px-5 py-2 placard-label disabled:opacity-50"
        >
          Add color
        </button>
      </div>

      <div className="space-y-4">
        <p className="placard-label text-ink-soft">Your special colors</p>
        {rows === null ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No special colors yet.</p>
        ) : (
          rows.map((c) => {
            const d = drafts[c.id];
            if (!d) return null;
            return (
              <div key={c.id} className="border border-line p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Name (German)
                    <input className={inputClass} value={d.name} onChange={(e) => setDraft(c.id, { name: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    Name (English)
                    <input className={inputClass} value={d.name_en} onChange={(e) => setDraft(c.id, { name_en: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    Swatch color
                    <input
                      type="color"
                      className="block h-10 w-20 border border-line bg-paper"
                      value={d.hex}
                      onChange={(e) => setDraft(c.id, { hex: e.target.value })}
                    />
                  </label>
                  <label className="text-sm">
                    Price per color (€)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={d.price}
                      onChange={(e) => setDraft(c.id, { price: e.target.value })}
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={(e) => setDraft(c.id, { active: e.target.checked })}
                  />
                  Offered to customers (untick to hide it without deleting)
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => call("PATCH", { id: c.id, ...d }, "Saved.")}
                    disabled={busy || !d.name.trim()}
                    className="bg-ink text-paper px-5 py-2 placard-label disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete “${c.name}”? Past orders keep their text.`)) {
                        call("DELETE", { id: c.id }, "Deleted.");
                      }
                    }}
                    disabled={busy}
                    className="border border-line px-5 py-2 placard-label disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
