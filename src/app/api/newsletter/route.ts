import { NextRequest, NextResponse } from "next/server";
import { startNewsletterSignup } from "@/lib/newsletterSignup";
import type { Locale } from "@/lib/i18n";

// Double opt-in, step 1 (see startNewsletterSignup): the address is saved as
// unconfirmed and gets one confirmation email.
export async function POST(req: NextRequest) {
  const { email, locale, website } = (await req.json()) as {
    email?: string;
    locale?: Locale;
    website?: string; // honeypot
  };

  // Honeypot — real visitors never fill this hidden field in.
  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const ok = await startNewsletterSignup(email, locale === "en" ? "en" : "de");
  if (!ok) return NextResponse.json({ error: "Could not sign up" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
