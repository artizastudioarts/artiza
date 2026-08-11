import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
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
    const isDe = resolvedLocale === "de";
    const unsubscribeUrl = `${process.env.SITE_URL}/api/newsletter/unsubscribe?id=${subscriberId}`;
    await sendEmail({
      to: email,
      subject: isDe ? "Willkommen bei Artiza Studio" : "Welcome to Artiza Studio",
      html: `
        <p>${isDe ? "Danke für deine Anmeldung!" : "Thanks for signing up!"}</p>
        <p>${
          isDe
            ? `Nutze den Code <strong>${code}</strong> für 10&nbsp;% Rabatt auf deine erste Bestellung.`
            : `Use the code <strong>${code}</strong> for 10% off your first order.`
        }</p>
        <p style="font-size:12px;color:#888;margin-top:24px;">
          ${
            isDe
              ? `Du möchtest keine weiteren E-Mails erhalten? <a href="${unsubscribeUrl}">Hier abmelden</a>.`
              : `Don't want to receive more emails? <a href="${unsubscribeUrl}">Unsubscribe here</a>.`
          }
        </p>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
