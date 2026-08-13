import { supabaseAdmin } from "./supabase";

/**
 * Wraps template content in a consistent branded shell — logo header,
 * card-style content area, small footer — so every email (order
 * confirmations, status updates, the newsletter welcome, etc.) looks
 * like it comes from the same place, without each template needing its
 * own header/footer markup.
 *
 * Table-based layout with inline styles throughout — email clients
 * don't reliably support modern CSS (flexbox, external stylesheets,
 * custom web fonts), so this deliberately stays simple and old-school
 * for the widest possible compatibility.
 */
function wrapEmailHtml(bodyHtml: string): string {
  const siteUrl = process.env.SITE_URL || "";
  const logoUrl = `${siteUrl}/email-logo.png`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#e3e2dc; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e3e2dc; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#eeeeea;">
            <tr>
              <td align="center" style="padding: 32px 24px 20px;">
                <img src="${logoUrl}" alt="Artiza Studio" height="52" style="display:block; height:52px; width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 0 24px;">
                <div style="border-top: 1px solid #d8d6cf;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 8px; color:#161412; font-size:15px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px 32px;">
                <div style="border-top: 1px solid #d8d6cf; padding-top: 16px; color:#55524c; font-size:12px; line-height:1.6;">
                  Artiza Studio &middot; Hinterbergstr. 17, 65207 Wiesbaden &middot;
                  <a href="mailto:info@artizastudio.de" style="color:#55524c;">info@artizastudio.de</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type EmailTemplateKey =
  | "order_confirmation"
  | "order_status_changed"
  | "abandoned_cart"
  | "newsletter_welcome";

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
  replyTo: replyToOverride,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[]; // content = base64
  replyTo?: string; // overrides the default EMAIL_REPLY_TO — e.g. a contact-form sender's own address
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  // Where a customer's "Reply" lands — separate from the "from" address,
  // since EMAIL_FROM (orders@...) is sending-only with no real inbox.
  const replyTo = replyToOverride || process.env.EMAIL_REPLY_TO || undefined;

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
      body: JSON.stringify({
        from,
        to,
        subject,
        html: wrapEmailHtml(html),
        reply_to: replyTo,
        attachments,
      }),
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
