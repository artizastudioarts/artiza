"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import FormMessage from "@/components/FormMessage";
import { interpolate } from "@/lib/i18n";
import { WITHDRAWAL_REASON_CODES, type WithdrawalReasonCode } from "@/lib/withdrawalReasons";

type Step = "form" | "review" | "done";

export default function WithdrawalForm() {
  const { dict, locale } = useLocale();
  const w = dict.widerruf;

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [items, setItems] = useState("");
  const [reason, setReason] = useState<"" | WithdrawalReasonCode>("");
  const [reasonNote, setReasonNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [receivedAt, setReceivedAt] = useState("");

  const field = "w-full border border-line px-3 py-2 bg-paper";

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("review");
  }

  async function handleConfirm() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          order_number: orderNumber,
          items,
          reason: reason || undefined,
          reason_note: reason === "other" ? reasonNote : undefined,
          locale,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? w.errorTooMany
            : res.status === 400
              ? w.errorInvalid
              : w.errorGeneric
        );
        // Let the customer fix invalid details.
        if (res.status === 400) setStep("form");
        return;
      }
      setReceivedAt(data.received_at ?? "");
      setStep("done");
    } catch {
      setError(w.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-3">
        <FormMessage type="success">{w.successTitle}</FormMessage>
        <p className="text-sm text-ink-soft">
          {interpolate(w.successBody, { time: receivedAt, email: email.trim() })}
        </p>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="space-y-5 max-w-md">
        <h2 className="font-display text-xl">{w.reviewHeading}</h2>
        <dl className="border border-line p-4 space-y-3 text-sm">
          <div>
            <dt className="placard-label text-ink-soft">{w.nameLabel}</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt className="placard-label text-ink-soft">{w.emailLabel}</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt className="placard-label text-ink-soft">{w.orderLabel}</dt>
            <dd className="font-mono">{orderNumber}</dd>
          </div>
          <div>
            <dt className="placard-label text-ink-soft">{w.itemsLabel}</dt>
            <dd>{items.trim() || w.reviewWhole}</dd>
          </div>
          {reason && (
            <div>
              <dt className="placard-label text-ink-soft">{w.reasonLabel}</dt>
              <dd>
                {w.reasons[reason]}
                {reason === "other" && reasonNote.trim() ? `: ${reasonNote.trim()}` : ""}
              </dd>
            </div>
          )}
        </dl>
        <p className="text-sm text-ink-soft">{w.reviewIntro}</p>
        {error && <FormMessage type="error">{error}</FormMessage>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={sending}
            className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
          >
            {sending ? w.sending : w.confirmButton}
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={sending}
            className="border border-line px-6 py-3 placard-label"
          >
            {w.backButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleContinue} className="space-y-4 max-w-md">
      {/* Honeypot field — hidden from real visitors, bots often fill it */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />
      <div>
        <label className="placard-label text-ink-soft block mb-1">{w.nameLabel}</label>
        <input
          required
          minLength={2}
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className={field}
        />
      </div>
      <div>
        <label className="placard-label text-ink-soft block mb-1">{w.emailLabel}</label>
        <input
          required
          type="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={field}
        />
      </div>
      <div>
        <label className="placard-label text-ink-soft block mb-1">{w.orderLabel}</label>
        <input
          required
          minLength={3}
          maxLength={50}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className={`${field} font-mono`}
        />
        <p className="text-xs text-ink-soft mt-1">{w.orderHint}</p>
      </div>
      <div>
        <label className="placard-label text-ink-soft block mb-1">{w.itemsLabel}</label>
        <textarea
          rows={3}
          maxLength={1000}
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className={field}
        />
        <p className="text-xs text-ink-soft mt-1">{w.itemsHint}</p>
      </div>
      <div>
        <label className="placard-label text-ink-soft block mb-1">{w.reasonLabel}</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as "" | WithdrawalReasonCode)}
          className={field}
        >
          <option value="">{w.reasonNone}</option>
          {WITHDRAWAL_REASON_CODES.map((c) => (
            <option key={c} value={c}>
              {w.reasons[c]}
            </option>
          ))}
        </select>
        {reason === "other" && (
          <div className="mt-2">
            <label className="placard-label text-ink-soft block mb-1">{w.reasonNoteLabel}</label>
            <textarea
              rows={2}
              maxLength={1000}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className={field}
            />
          </div>
        )}
        <p className="text-xs text-ink-soft mt-1">{w.reasonHint}</p>
      </div>
      {error && <FormMessage type="error">{error}</FormMessage>}
      <button
        type="submit"
        className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
      >
        {w.continueButton}
      </button>
    </form>
  );
}
