"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FormMessage from "@/components/FormMessage";

function SiteLockedForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/site-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
      router.refresh();
    } else {
      setError("Wrong password");
    }
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-24">
      <h1 className="font-display text-2xl italic mb-2">This site is being tested</h1>
      <p className="text-ink-soft text-sm mb-6">
        Enter the password to continue.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-line px-4 py-3 bg-paper"
          autoFocus
        />
        {error && <FormMessage type="error">{error}</FormMessage>}
        <button
          type="submit"
          className="w-full bg-ink text-paper px-6 py-3 placard-label"
        >
          Continue
        </button>
      </form>
    </main>
  );
}

export default function SiteLockedPage() {
  return (
    <Suspense fallback={null}>
      <SiteLockedForm />
    </Suspense>
  );
}
