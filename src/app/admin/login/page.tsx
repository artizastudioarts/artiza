"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Wrong password");
    }
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-24">
      <h1 className="font-display text-2xl italic mb-6">Admin login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-line px-4 py-3 bg-paper"
          autoFocus
        />
        {error && <p className="text-oxblood text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-ink text-paper px-6 py-3 placard-label"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
