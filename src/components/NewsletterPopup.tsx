"use client";

import { useEffect, useState } from "react";
import NewsletterSignup from "@/components/NewsletterSignup";

const DISMISS_KEY = "artshop_newsletter_popup_dismissed";
const SHOW_DELAY_MS = 1200;

export default function NewsletterPopup({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible]);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-5"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-heading"
        onClick={(e) => e.stopPropagation()}
        className="bg-paper border border-ink max-w-sm w-full px-8 py-9 text-center relative"
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3.5 right-4 text-ink-soft hover:text-ink text-xl leading-none"
        >
          ×
        </button>
        <div className="w-10 h-px bg-brass mx-auto mb-4" />
        <h2
          id="newsletter-popup-heading"
          className="font-display text-2xl italic mb-2"
        >
          {heading}
        </h2>
        <p className="text-ink-soft text-sm mb-6">{body}</p>
        <NewsletterSignup stacked />
      </div>
    </div>
  );
}
