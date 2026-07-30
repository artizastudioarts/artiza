"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";

export default function SuccessPage() {
  const { clear, loaded } = useCart();

  useEffect(() => {
    if (loaded) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto px-6 py-24 flex-1 w-full text-center">
        <p className="placard-label mb-3">Order confirmed</p>
        <h1 className="font-display text-3xl italic mb-4">
          Thank you for your order
        </h1>
        <p className="text-ink-soft mb-8">
          A confirmation has been sent to your email. Your piece will be
          carefully packed and shipped soon.
        </p>
        <Link
          href="/"
          className="inline-block bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
        >
          Back to gallery
        </Link>
      </main>
    </>
  );
}
