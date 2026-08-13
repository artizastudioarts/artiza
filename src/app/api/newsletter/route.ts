import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { getPageContent } from "@/lib/getPageContent";
import type { Locale } from "@/lib/i18n";

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

  const resolvedLocale: Locale = locale === "en" ? "en" : "de";
  const cleanEmail = email.trim().toLowerCase();
  const db = supabaseAdmin();

  const { data: inserted, error } = await db
    .from("newsletter_subscribers")
    .insert({ email: cleanEmail, locale: resolvedLocale })
    .select("id")
    .single();

  let subscriberId = inserted?.id as string | undefined;

  // A duplicate email isn't really an error from the visitor's
  // perspective — they're already subscribed, so still show success and
  // still send the reminder below. Just need their existing id instead.
  if (error) {
    if (!error.message.includes("duplicate")) {
      console.error("Newsletter signup failed", error);
      return NextResponse.json({ error: "Could not sign up" }, { status: 500 });
    }
    const { data: existing } = await db
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", cleanEmail)
      .single();
    subscriberId = existing?.id;
  }

  const content = await getPageContent("home", resolvedLocale);
  const code = content.newsletterCode ?? "";

  if (code && subscriberId) {
    const unsubscribeUrl = `${process.env.SITE_URL}/api/newsletter/unsubscribe?id=${subscriberId}`;
    const template = await getEmailTemplate("newsletter_welcome");
    if (template) {
      const vars = { code, unsubscribe_url: unsubscribeUrl };
      await sendEmail({
        to: email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.body, vars),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
