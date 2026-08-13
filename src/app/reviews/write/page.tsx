"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormMessage from "@/components/FormMessage";
import { useLocale } from "@/context/LocaleContext";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`text-2xl leading-none ${n <= value ? "text-brass" : "text-line"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function WriteReviewForm() {
  const { dict } = useLocale();
  const params = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      let image_url: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/reviews/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        image_url = uploadData.url;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: orderNumber,
          customer_name: name,
          rating: rating || null,
          review_text: reviewText,
          image_url,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "order_not_found") throw new Error(dict.reviews.errorOrderNotFound);
        if (data.error === "already_reviewed") throw new Error(dict.reviews.errorAlreadyReviewed);
        throw new Error(dict.reviews.errorGeneric);
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.reviews.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="max-w-md mx-auto px-6 py-24 flex-1 w-full text-center">
        <h1 className="font-display text-3xl italic mb-4">{dict.reviews.successTitle}</h1>
        <p className="text-ink-soft mb-8">{dict.reviews.successBody}</p>
        <Link
          href="/shop"
          className="inline-block bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
        >
          {dict.reviews.backToShop}
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-14 flex-1 w-full">
      <h1 className="font-display text-3xl italic mb-2">{dict.reviews.writeTitle}</h1>
      <p className="text-ink-soft text-sm mb-8">{dict.reviews.writeSubtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {dict.reviews.orderNumberLabel}
          </label>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={dict.reviews.orderNumberPlaceholder}
            className="w-full border border-line px-4 py-3 bg-paper"
          />
        </div>

        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {dict.reviews.nameLabel}
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line px-4 py-3 bg-paper"
          />
        </div>

        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {dict.reviews.ratingLabel}{" "}
            <span className="normal-case text-ink-soft">{dict.reviews.ratingOptional}</span>
          </label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {dict.reviews.reviewLabel}
          </label>
          <textarea
            required
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
            className="w-full border border-line px-4 py-3 bg-paper"
          />
        </div>

        <div>
          <label className="placard-label text-ink-soft block mb-1">
            {dict.reviews.photoLabel}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <FormMessage type="error">{error}</FormMessage>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-paper px-6 py-3 placard-label disabled:opacity-50"
        >
          {submitting ? dict.reviews.submitting : dict.reviews.submitButton}
        </button>
      </form>
    </main>
  );
}

export default function WriteReviewPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <WriteReviewForm />
      </Suspense>
      <Footer />
    </>
  );
}
