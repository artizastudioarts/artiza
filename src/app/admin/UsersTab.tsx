"use client";

import { useEffect, useMemo, useState } from "react";
import FormMessage from "@/components/FormMessage";
import type { AdminUser } from "@/app/api/admin/users/route";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

const eur = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

type Filter = "all" | "buyers" | "unconfirmed" | "disabled";

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/users")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) {
          setError(d.error ?? "Could not load users");
          setUsers([]);
          return;
        }
        setUsers(d.users ?? []);
      })
      .catch(() => {
        setError("Could not load users");
        setUsers([]);
      });
  }

  useEffect(load, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (filter === "buyers" && u.order_count === 0) return false;
      if (filter === "unconfirmed" && u.confirmed) return false;
      if (filter === "disabled" && !u.disabled) return false;
      if (!q) return true;
      return (
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  async function toggleDisabled(u: AdminUser) {
    const action = u.disabled ? "enable" : "disable";
    if (
      action === "disable" &&
      !confirm(`Block ${u.email}? They will no longer be able to log in. Nothing is deleted.`)
    )
      return;
    setBusyId(u.id);
    setNotice("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, action }),
    });
    const d = await res.json();
    setBusyId(null);
    if (!res.ok) return setError(d.error ?? "Failed");
    setNotice(action === "disable" ? `${u.email} is blocked.` : `${u.email} can log in again.`);
    load();
  }

  async function remove(u: AdminUser) {
    const typed = prompt(
      `Delete the account of ${u.email}?\n\nTheir login is removed for good. Their past orders ` +
        `(${u.order_count}) stay in your records, but are no longer linked to an account.\n\n` +
        `Type DELETE to confirm.`
    );
    if (typed !== "DELETE") return;
    setBusyId(u.id);
    setNotice("");
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    const d = await res.json();
    setBusyId(null);
    if (!res.ok) return setError(d.error ?? "Failed");
    setNotice(`Account of ${u.email} deleted.`);
    load();
  }

  const counts = {
    total: users?.length ?? 0,
    buyers: (users ?? []).filter((u) => u.order_count > 0).length,
    unconfirmed: (users ?? []).filter((u) => !u.confirmed).length,
    disabled: (users ?? []).filter((u) => u.disabled).length,
  };

  const filterBtn = (key: Filter, label: string, n: number) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`placard-label px-3 py-1.5 border border-line ${
        filter === key ? "bg-ink text-paper" : ""
      }`}
    >
      {label} ({n})
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft text-sm max-w-xl">
          Customers who registered an account. Guests who checked out without registering
          are not listed here; you find them in the Orders tab.
        </p>
        <a
          href="/api/admin/users?format=csv"
          className="border border-line px-4 py-2 placard-label"
        >
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterBtn("all", "All", counts.total)}
        {filterBtn("buyers", "With orders", counts.buyers)}
        {filterBtn("unconfirmed", "Email not confirmed", counts.unconfirmed)}
        {filterBtn("disabled", "Blocked", counts.disabled)}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by email or name"
        className="w-full max-w-sm border border-line px-3 py-2 bg-paper text-sm"
      />

      {notice && <FormMessage type="success">{notice}</FormMessage>}
      {error && <FormMessage type="error">{error}</FormMessage>}

      {users === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-ink-soft">No users match.</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-left placard-label text-ink-soft">
              <tr>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Registered</th>
                <th className="px-3 py-2">Last login</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Spent</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium">{u.email ?? "—"}</div>
                    {u.name && <div className="text-ink-soft text-xs">{u.name}</div>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(u.last_sign_in_at)}</td>
                  <td className="px-3 py-2 text-right">{u.order_count}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {u.order_count ? eur(u.total_spent_cents) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs space-y-1">
                    {u.disabled && <div className="text-oxblood font-semibold">Blocked</div>}
                    {!u.confirmed && <div className="text-ink-soft">Email not confirmed</div>}
                    {!u.disabled && u.confirmed && <div className="text-ink-soft">Active</div>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button
                      onClick={() => toggleDisabled(u)}
                      disabled={busyId === u.id}
                      className="text-ink-soft hover:text-ink mr-3 disabled:opacity-50"
                    >
                      {u.disabled ? "Unblock" : "Block"}
                    </button>
                    <button
                      onClick={() => remove(u)}
                      disabled={busyId === u.id}
                      className="text-oxblood disabled:opacity-50"
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
