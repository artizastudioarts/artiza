"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import FormMessage from "@/components/FormMessage";

export default function ContactForm() {
  const { dict } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <FormMessage type="success">{dict.contact.successMessage}</FormMessage>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {/* Honeypot field — hidden from real visitors via CSS, bots often fill it anyway */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div>
        <label className="placard-label text-ink-soft block mb-1">
          {dict.contact.nameLabel}
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>
      <div>
        <label className="placard-label text-ink-soft block mb-1">
          {dict.contact.emailLabel}
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>
      <div>
        <label className="placard-label text-ink-soft block mb-1">
          {dict.contact.messageLabel}
        </label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-line px-3 py-2 bg-paper"
        />
      </div>

      {status === "error" && <FormMessage type="error">{dict.contact.errorMessage}</FormMessage>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors disabled:opacity-50"
      >
        {status === "sending" ? dict.contact.submitting : dict.contact.submitButton}
      </button>
    </form>
  );
}
