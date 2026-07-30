"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { formatPrice, type Order } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  paid: "Order received",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export default function AccountPage() {
  const { user, session, loaded, signOut } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loaded) return;
    if (!user) {
      router.push("/account/login?redirect=/account");
      return;
    }

    fetch("/api/account/orders", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrders(data.orders);
      })
      .catch(() => setError("Could not load orders"));
  }, [loaded, user, session, router]);

  if (!loaded || !user) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-24 flex-1 w-full" />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl italic">Your account</h1>
            <p className="text-ink-soft text-sm mt-1">{user.email}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="placard-label text-ink-soft hover:text-oxblood"
          >
            Log out
          </button>
        </div>

        <h2 className="placard-label text-ink-soft mb-4">Your orders</h2>

        {error && <p className="text-oxblood text-sm">{error}</p>}

        {!error && orders === null && (
          <p className="text-ink-soft text-sm">Loading…</p>
        )}

        {orders && orders.length === 0 && (
          <p className="text-ink-soft text-sm">
            No orders yet — orders you place while logged in will show up here.
          </p>
        )}

        {orders && orders.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {orders.map((order) => (
              <li
                key={order.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-display text-lg">
                    {order.product_title}
                    {order.quantity > 1 ? ` × ${order.quantity}` : ""}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {new Date(order.created_at).toLocaleDateString()} ·{" "}
                    {formatPrice(order.amount_total_cents, order.currency)}
                  </p>
                </div>
                <span className="placard-label text-ink-soft">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
