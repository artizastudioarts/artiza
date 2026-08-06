import { supabaseAdmin } from "./supabase";

export type EmailTemplateKey =
  | "order_confirmation"
  | "order_status_changed"
  | "abandoned_cart";

export type EmailTemplate = {
  key: EmailTemplateKey;
  subject: string;
  body: string;
};

/**
 * Sends an email via Resend's API. Never throws — a failed or
 * unconfigured email should never break checkout or an admin action, so
 * this just logs the problem and returns.
 */
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[]; // content = base64
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  // Where a customer's "Reply" lands — separate from the "from" address,
  // since EMAIL_FROM (orders@...) is sending-only with no real inbox.
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  if (!apiKey || !from) {
    console.error(
      "Email not sent — RESEND_API_KEY or EMAIL_FROM is not configured."
    );
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, reply_to: replyTo, attachments }),
    });
    if (!res.ok) {
      console.error("Resend API error:", await res.text());
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export async function getEmailTemplate(
  key: EmailTemplateKey
): Promise<EmailTemplate | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("email_templates")
    .select("key, subject, body")
    .eq("key", key)
    .single();
  return data as EmailTemplate | null;
}

/** Fills in {{placeholders}} in a template string. */
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in vars ? vars[key] : match
  );
}
