"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import FormMessage from "@/components/FormMessage";

// The confirmation needs a real button press (not just opening the link), so
// email security scanners that pre-open links cannot confirm for the person.
export default function ConfirmNewsletterForm({ token }: { token: string }) {
  const { dict } = useLocale();
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function confirm() {
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <FormMessage type="success">{dict.newsletter.confirmDone}</FormMessage>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={confirm}
        disabled={status === "sending" || !token}
        className="bg-brand text-white px-8 py-4 placard-label hover:bg-brand-deep transition-colors disabled:opacity-50"
      >
        {dict.newsletter.confirmButton}
      </button>
      {(status === "error" || !token) && (
        <FormMessage type="error">{dict.newsletter.confirmInvalid}</FormMessage>
      )}
    </div>
  );
}
