"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/types";
import type { CustomBoxOrderItem } from "@/lib/types";

type OrderDetail = {
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
  order_type: "standard" | "custom_box";
  custom_box_items: CustomBoxOrderItem[] | null;
  custom_box_notes: string | null;
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setOrder(d.order);
      });
  }, [params.id]);

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-oxblood">{error}</p>
        <Link href="/admin" className="underline placard-label text-sm">
          ← Back to orders
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  const currency = order.currency ?? "eur";
  const boxItems = order.custom_box_items ?? [];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div>
        <Link href="/admin" className="underline placard-label text-sm text-ink-soft">
          ← Back to orders
        </Link>
        <h1 className="font-display text-3xl italic mt-2">
          Order {order.order_number}
        </h1>
        {order.order_type === "custom_box" && (
          <span className="placard-label text-xs bg-ink text-paper px-1.5 py-0.5 inline-block mt-2">
            Custom Box
          </span>
        )}
      </div>

      <div className="border border-line p-4 space-y-1 text-sm">
        <p><span className="text-ink-soft">Customer:</span> {order.customer_name || "—"}</p>
        <p><span className="text-ink-soft">Email:</span> {order.customer_email || "—"}</p>
        <p><span className="text-ink-soft">Phone:</span> {order.phone || "—"}</p>
        <p><span className="text-ink-soft">Status:</span> {order.status}</p>
        <p><span className="text-ink-soft">Placed:</span> {new Date(order.created_at).toLocaleString("de-DE")}</p>
        {order.shipping_address && (
          <p className="text-ink-soft">
            {Object.values(order.shipping_address).filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {order.order_type === "custom_box" ? (
        <div className="border border-line p-4">
          <h2 className="placard-label text-ink-soft mb-3">Box contents</h2>
          {order.quantity > 1 && (
            <p className="text-sm text-ink-soft mb-2">
              {order.quantity} identical boxes ordered — quantities below are per box.
            </p>
          )}
          <table className="w-full text-sm border-collapse mb-3">
            <thead>
              <tr className="text-left border-b border-line placard-label text-ink-soft">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Article</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Price</th>
              </tr>
            </thead>
            <tbody>
              {boxItems.map((item, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 pr-4">{item.categoryLabel}</td>
                  <td className="py-2 pr-4">{item.articleLabel}</td>
                  <td className="py-2 pr-4">{item.quantity}</td>
                  <td className="py-2 pr-4">
                    {formatPrice(item.priceCents * item.quantity, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {order.custom_box_notes && (
            <div>
              <p className="placard-label text-ink-soft mb-1">Order notes</p>
              <p className="text-sm whitespace-pre-wrap">{order.custom_box_notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-line p-4 text-sm">
          {order.product_title} × {order.quantity}
        </div>
      )}

      <div className="border border-line p-4 flex justify-between text-sm">
        <span className="text-ink-soft">Total (incl. shipping)</span>
        <span className="font-display text-lg">
          {formatPrice((order.amount_total_cents ?? 0) + (order.shipping_cents ?? 0), currency)}
        </span>
      </div>
    </main>
  );
}
