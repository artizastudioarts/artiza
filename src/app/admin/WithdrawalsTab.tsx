"use client";

import { useEffect, useState } from "react";
import FormMessage from "@/components/FormMessage";
import type { WithdrawalRequest } from "@/lib/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function WithdrawalsTab() {
  const [requests, setRequests] = useState<WithdrawalRequest[] | null>(null);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/withdrawals")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []));
  }

  useEffect(load, []);

  async function setStatus(r: WithdrawalRequest, status: "received" | "processed") {
    setError("");
    const res = await fetch(`/api/admin/withdrawals/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError("Could not update this request.");
      return;
    }
    load();
  }

  const open = (requests ?? []).filter((r) => r.status === "received").length;

  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-ink-soft text-sm">
        Every withdrawal a customer declares on the &quot;Vertrag widerrufen&quot; page lands here
        (you also get an email, and the customer gets an acknowledgment of receipt). Mark a request
        as processed once you have answered it and handled the return and refund. A request marked
        &quot;no matching order&quot; had an order number and email that don&apos;t belong to any
        order, so check the details with the customer before refunding.
      </p>
      {error && <FormMessage type="error">{error}</FormMessage>}
      {requests === null ? (
        <p className="text-ink-soft">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-ink-soft">No withdrawals yet.</p>
      ) : (
        <>
          <p className="placard-label text-ink-soft">
            {open} open · {requests.length - open} processed
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-line placard-label text-ink-soft">
                  <th className="py-2 pr-4">Received</th>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Items</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-line align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="py-3 pr-4">
                      <span className="font-mono whitespace-nowrap">{r.order_number}</span>
                      {!r.order_matched && (
                        <p className="text-oxblood text-xs mt-1">no matching order</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {r.name}
                      <br />
                      <a href={`mailto:${r.email}`} className="underline text-ink-soft">
                        {r.email}
                      </a>
                    </td>
                    <td className="py-3 pr-4">{r.items_note ?? "Entire order"}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.status === "processed" ? (
                        <>
                          Processed
                          {r.processed_at && (
                            <p className="text-ink-soft text-xs">{fmt(r.processed_at)}</p>
                          )}
                        </>
                      ) : (
                        <span className="font-semibold">Open</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.status === "received" ? (
                        <button
                          onClick={() => setStatus(r, "processed")}
                          className="placard-label hover:underline"
                        >
                          Mark processed
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(r, "received")}
                          className="placard-label text-ink-soft hover:underline"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
