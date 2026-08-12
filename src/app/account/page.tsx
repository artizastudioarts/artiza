"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { formatPrice, type Order } from "@/lib/types";

export default function AccountPage() {
  const { user, session, loaded, signOut } = useAuth();
  const { dict, locale } = useLocale();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  async function downloadInvoice(orderNumber: string) {
    setDownloading(orderNumber);
    try {
      const res = await fetch(
        `/api/account/invoices?order_number=${encodeURIComponent(orderNumber)}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } finally {
      setDownloading(null);
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    paid: dict.account.statusPaid,
    shipped: dict.account.statusShipped,
    cancelled: dict.account.statusCancelled,
  };

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

  // Multiple products bought in one checkout now share one order number —
  // group them together instead of listing the same number repeatedly.
  const groups: Order[][] = [];
  if (orders) {
    const byNumber = new Map<string, Order[]>();
    for (const order of orders) {
      const list = byNumber.get(order.order_number) ?? [];
      list.push(order);
      byNumber.set(order.order_number, list);
    }
    groups.push(...byNumber.values());
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl italic">{dict.account.yourAccount}</h1>
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
            {dict.account.logout}
          </button>
        </div>

        <h2 className="placard-label text-ink-soft mb-4">{dict.account.yourOrders}</h2>

        {error && <p className="text-oxblood text-sm">{error}</p>}

        {!error && orders === null && (
          <p className="text-ink-soft text-sm">{dict.account.loading}</p>
        )}

        {orders && orders.length === 0 && (
          <p className="text-ink-soft text-sm">{dict.account.noOrders}</p>
        )}

        {groups.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {groups.map((group) => {
              const first = group[0];
              const total =
                group.reduce((sum, o) => sum + o.amount_total_cents, 0) +
                (first.shipping_cents ?? 0);
              return (
                <li key={first.order_number} className="py-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="placard-label text-ink-soft">{first.order_number}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => downloadInvoice(first.order_number)}
                        disabled={downloading === first.order_number}
                        className="placard-label text-ink-soft hover:text-ink disabled:opacity-50"
                      >
                        {downloading === first.order_number
                          ? dict.account.downloading
                          : dict.account.downloadInvoice}
                      </button>
                      <Link
                        href={`/reviews/write?order=${encodeURIComponent(first.order_number)}`}
                        className="placard-label text-oxblood hover:underline"
                      >
                        {dict.reviews.writeReviewButton}
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {group.map((order, i) => (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <p className="font-display text-lg">
                          {order.product_title}
                          {order.quantity > 1 ? ` × ${order.quantity}` : ""}
                          {order.custom_text && (
                            <span className="block text-sm text-ink-soft font-sans italic">
                              {dict.account.personalizationLabel}: {order.custom_text}
                            </span>
                          )}
                        </p>
                        <span className="placard-label text-ink-soft shrink-0">
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-ink-soft mt-2">
                    {new Date(first.created_at).toLocaleDateString(
                      locale === "de" ? "de-DE" : "en-GB"
                    )}{" "}
                    · {formatPrice(total, first.currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
