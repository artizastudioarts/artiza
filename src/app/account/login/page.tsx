"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import FormMessage from "@/components/FormMessage";

const SIGNUP_REDIRECT_DELAY_MS = 2500;

function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  const { signIn, signUp } = useAuth();
  const { dict } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/account";

  // After signup, the message needs a moment to actually be read before
  // we take the person away from it.
  useEffect(() => {
    if (!signupComplete) return;
    const timer = setTimeout(() => {
      router.push("/");
      router.refresh();
    }, SIGNUP_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [signupComplete, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = mode === "login" ? await signIn(email, password) : await signUp(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "signup") {
      // If Supabase has "confirm email" turned on, there's no session yet
      // — send them off to browse rather than leaving them stranded here.
      setSignupComplete(true);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  if (signupComplete) {
    return (
      <main className="max-w-sm mx-auto px-6 py-24 flex-1 w-full">
        <FormMessage type="success">{dict.auth.confirmEmailInfo}</FormMessage>
      </main>
    );
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
        {error && <FormMessage type="error">{error}</FormMessage>}
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
