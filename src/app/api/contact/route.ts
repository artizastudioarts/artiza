import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { name, email, message, website } = await req.json();

  // Honeypot — a hidden field real visitors never fill in. If it has a
  // value, it was a bot; silently pretend success rather than tipping
  // the bot off that it got caught.
  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const destination = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
  if (!destination) {
    console.error("Contact form: no destination email configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  await sendEmail({
    to: destination,
    subject: `Kontaktformular: Nachricht von ${name}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>E-Mail:</strong> ${email}</p>
      <p><strong>Nachricht:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `,
    replyTo: email,
  });

  return NextResponse.json({ ok: true });
}
