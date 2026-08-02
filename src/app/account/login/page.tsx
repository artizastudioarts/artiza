"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { dict } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/account";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const result = mode === "login" ? await signIn(email, password) : await signUp(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "signup") {
      // If Supabase has "confirm email" turned on, there's no session yet.
      setInfo(dict.auth.confirmEmailInfo);
      setMode("login");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-24 flex-1 w-full">
      <h1 className="font-display text-3xl italic mb-2">
        {mode === "login" ? dict.auth.loginTitle : dict.auth.signupTitle}
      </h1>
      <p className="text-ink-soft text-sm mb-8">
        {mode === "login" ? dict.auth.loginSubtitle : dict.auth.signupSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.auth.emailPlaceholder}
          required
          className="w-full border border-line px-4 py-3 bg-paper"
          autoFocus
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={dict.auth.passwordPlaceholder}
          required
          minLength={6}
          className="w-full border border-line px-4 py-3 bg-paper"
        />
        {error && <p className="text-oxblood text-sm">{error}</p>}
        {info && <p className="text-sm text-ink-soft">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper px-6 py-3 placard-label disabled:opacity-50"
        >
          {loading
            ? dict.auth.pleaseWait
            : mode === "login"
              ? dict.auth.loginButton
              : dict.auth.signupButton}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError("");
          setInfo("");
        }}
        className="placard-label text-ink-soft hover:text-ink mt-6"
      >
        {mode === "login" ? dict.auth.noAccount : dict.auth.haveAccount}
      </button>
    </main>
  );
}

export default function AccountLoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
