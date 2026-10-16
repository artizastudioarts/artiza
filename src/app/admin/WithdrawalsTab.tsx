"use client";

import { useEffect, useState } from "react";
import FormMessage from "@/components/FormMessage";
import type { WithdrawalRequest } from "@/lib/types";
import { WITHDRAWAL_REASON_LABEL_DE, type WithdrawalReasonCode } from "@/lib/withdrawalReasons";

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
  const [notice, setNotice] = useState("");

  function load() {
    fetch("/api/admin/withdrawals")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []));
  }

  useEffect(load, []);

  async function setStatus(r: WithdrawalRequest, status: "received" | "processed") {
    setError("");
    setNotice("");
    const res = await fetch(`/api/admin/withdrawals/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError("Could not update this request.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.orderUpdate === "cancelled") {
      setNotice(`Order ${r.order_number} was set to Cancelled automatically.`);
    } else if (data.orderUpdate === "already_cancelled") {
      setNotice(`Order ${r.order_number} was already Cancelled.`);
    } else if (data.orderUpdate === "manual") {
      setNotice(
        `Order ${r.order_number} was NOT changed (partial withdrawal or no matching order). Please update its status in the Orders tab yourself.`
      );
    }
    load();
  }

  async function sendRefundEmail(r: WithdrawalRequest) {
    setError("");
    setNotice("");
    const amount = window.prompt(
      `Refund email to ${r.email}\n\nAmount you refunded in Stripe (in euros, e.g. 24,90):`
    );
    if (!amount) return;
    const res = await fetch(`/api/admin/withdrawals/${r.id}/refund-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.status === 400) {
      setError("That amount isn't valid. Use a number like 24,90.");
      return;
    }
    if (!res.ok) {
      setError("The email could not be sent.");
      return;
    }
    setNotice(`Refund email sent to ${r.email}.`);
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
        order, so check the details with the customer before refunding. Marking a request as
        processed also sets a fully withdrawn order to Cancelled automatically (partial or
        unmatched withdrawals are left for you to change by hand). No email is sent to the
        customer when this happens.
      </p>
      <details className="border border-line p-4 text-sm">
        <summary className="cursor-pointer placard-label">How a refund works (steps)</summary>
        <ol className="list-decimal pl-5 mt-3 space-y-2 text-ink-soft">
          <li>Reply to the customer: ask them to send the kit back and tell them where to. The customer pays the return shipping.</li>
          <li>
            Wait for the parcel, or for proof of posting. You may hold the refund until then, but
            the refund must be made within 14 days of receiving the withdrawal.
          </li>
          <li>
            Refund in Stripe: Payments → find the payment (search by the customer&apos;s email) →
            Refund. Refund the full amount including the original standard shipping, to the original
            payment method.
          </li>
          <li>
            Click &quot;Mark processed&quot; here. A fully withdrawn order is set to Cancelled
            automatically. For a partial withdrawal, refund only those items in Stripe and change
            the order status in the Orders tab yourself.
          </li>
          <li>
            Click &quot;Send refund email&quot; on the request and enter the amount you refunded, so
            the customer knows the money is on its way (Stripe&apos;s own receipt is generic).
          </li>
          <li>
            Orders tab → &quot;Generate credit note&quot; on the cancelled order and keep the PDF
            for your accounting.
          </li>
        </ol>
      </details>
      {error && <FormMessage type="error">{error}</FormMessage>}
      {notice && <FormMessage type="success">{notice}</FormMessage>}
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
                    <td className="py-3 pr-4">
                      {r.items_note ?? "Entire order"}
                      {r.reason_code && (
                        <p className="text-ink-soft text-xs mt-1">
                          Reason:{" "}
                          {WITHDRAWAL_REASON_LABEL_DE[r.reason_code as WithdrawalReasonCode] ??
                            r.reason_code}
                          {r.reason_note ? ` – ${r.reason_note}` : ""}
                        </p>
                      )}
                    </td>
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
                      <br />
                      <button
                        onClick={() => sendRefundEmail(r)}
                        className="placard-label text-oxblood hover:underline mt-1"
                      >
                        {r.refund_email_sent_at ? "Send refund email again" : "Send refund email"}
                      </button>
                      {r.refund_email_sent_at && (
                        <p className="text-ink-soft text-xs">Sent {fmt(r.refund_email_sent_at)}</p>
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
