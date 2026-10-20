import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, getEmailTemplate, renderTemplate } from "@/lib/email";
import { getPageContent } from "@/lib/getPageContent";
import type { Locale } from "@/lib/i18n";

// Double opt-in, step 2: called when the person presses the confirm button on
// /newsletter/confirm. Marks the signup as confirmed (the consent proof) and
// sends the welcome email with the discount code, once.
export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  const uuid = /^[0-9a-f-]{36}$/i;
  if (typeof token !== "string" || !uuid.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: sub } = await db
    .from("newsletter_subscribers")
    .select("id, email, locale, confirmed_at")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!sub) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // Pressing the button twice (or reopening the email) must not send a
  // second discount code.
  if (sub.confirmed_at) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await db
    .from("newsletter_subscribers")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", sub.id)
    .is("confirmed_at", null);
  if (error) {
    return NextResponse.json({ error: "Could not confirm" }, { status: 500 });
  }

  const locale: Locale = sub.locale === "en" ? "en" : "de";
  const content = await getPageContent("home", locale);
  const code = content.newsletterCode ?? "";
  if (code) {
    const template = await getEmailTemplate("newsletter_welcome");
    if (template) {
      const unsubscribeUrl = `${process.env.SITE_URL}/api/newsletter/unsubscribe?id=${sub.id}`;
      const vars = { code, unsubscribe_url: unsubscribeUrl };
      await sendEmail({
        to: sub.email,
        subject: renderTemplate(template.subject, vars),
        html: renderTemplate(template.body, vars),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
