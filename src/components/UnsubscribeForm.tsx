"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import FormMessage from "@/components/FormMessage";

export default function UnsubscribeForm() {
  const { dict } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <FormMessage type="success">{dict.newsletter.unsubDone}</FormMessage>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.newsletter.emailPlaceholder}
        className="flex-1 border border-line px-4 py-3 bg-paper"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-brand text-white px-6 py-3 placard-label hover:bg-brand-deep transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {dict.newsletter.unsubButton}
      </button>
      {status === "error" && (
        <div className="sm:basis-full">
          <FormMessage type="error">{dict.newsletter.errorMessage}</FormMessage>
        </div>
      )}
    </form>
  );
}
