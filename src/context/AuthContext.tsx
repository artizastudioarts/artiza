"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabasePublic } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loaded: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabasePublic.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoaded(true);
    });

    const { data: listener } = supabasePublic.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string) {
    const { error } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        // Send the confirmation link back to whatever site the person is
        // actually signing up on (localhost while testing, your real
        // domain in production) instead of relying only on Supabase's
        // "Site URL" setting.
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabasePublic.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loaded, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
