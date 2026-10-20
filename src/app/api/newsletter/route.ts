import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import type { Locale } from "@/lib/i18n";

// Double opt-in, step 1: save the address as UNCONFIRMED and send one
// confirmation email. The welcome email with the discount code is only sent
// after the person confirms (see /api/newsletter/confirm).
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

  // Housekeeping: unconfirmed signups older than 7 days are deleted, so we
  // never keep addresses nobody agreed to.
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  await db
    .from("newsletter_subscribers")
    .delete()
    .is("confirmed_at", null)
    .lt("subscribed_at", cutoff);

  const { data: existing } = await db
    .from("newsletter_subscribers")
    .select("id, confirmed_at, confirm_token, confirmation_sent_at")
    .eq("email", cleanEmail)
    .maybeSingle();

  // Already confirmed: do nothing (no second discount code, no extra email),
  // but answer the same way so nobody can probe who is subscribed.
  if (existing?.confirmed_at) {
    return NextResponse.json({ ok: true });
  }

  let token = existing?.confirm_token as string | undefined;

  if (!existing) {
    const { data: inserted, error } = await db
      .from("newsletter_subscribers")
      .insert({
        email: cleanEmail,
        locale: resolvedLocale,
        confirmation_sent_at: new Date().toISOString(),
      })
      .select("confirm_token")
      .single();
    if (error || !inserted) {
      console.error("Newsletter signup failed", error);
      return NextResponse.json({ error: "Could not sign up" }, { status: 500 });
    }
    token = inserted.confirm_token as string;
  } else {
    // Unconfirmed and signing up again: resend, but at most every 10 minutes.
    const last = existing.confirmation_sent_at
      ? new Date(existing.confirmation_sent_at).getTime()
      : 0;
    if (Date.now() - last < 10 * 60 * 1000) {
      return NextResponse.json({ ok: true });
    }
    await db
      .from("newsletter_subscribers")
      .update({ confirmation_sent_at: new Date().toISOString(), locale: resolvedLocale })
      .eq("id", existing.id);
  }

  const template = await getEmailTemplate("newsletter_confirm");
  if (template && token) {
    const confirmUrl = `${process.env.SITE_URL}/newsletter/confirm?token=${token}`;
    const vars = { confirm_url: confirmUrl };
    await sendEmail({
      to: cleanEmail,
      subject: renderTemplate(template.subject, vars),
      html: renderTemplate(template.body, vars),
    });
  }

  return NextResponse.json({ ok: true });
}
