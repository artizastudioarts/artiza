"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";

export default function NewsletterSignup({ stacked = false }: { stacked?: boolean }) {
  const { locale, dict } = useLocale();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, website }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <p className="text-ink-soft">{dict.newsletter.successMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className={`flex gap-3 ${stacked ? "flex-col" : "flex-col sm:flex-row"}`}
      >
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />
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
          className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === "sending" ? dict.newsletter.submitting : dict.newsletter.submitButton}
        </button>
      </form>
      {status === "error" && (
        <p className="text-oxblood text-sm mt-3 text-center">{dict.newsletter.errorMessage}</p>
      )}
    </div>
  );
}
