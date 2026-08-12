"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "artshop_newsletter_bar_dismissed";

export default function NewsletterBar({ text }: { text: string }) {
  const [dismissed, setDismissed] = useState(true); // default hidden until we confirm it hasn't been dismissed — avoids a flash on first paint

  useEffect(() => {
    const stored = window.localStorage.getItem(DISMISS_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage is client-only and can't happen during SSR
    setDismissed(stored === "1");
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  function handleClick() {
    document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth" });
  }

  if (dismissed) return null;

  return (
    <div className="bg-ink text-paper">
      <div className="max-w-6xl mx-auto pl-4 pr-10 py-2.5 flex items-center justify-center relative">
        <button
          onClick={handleClick}
          className="placard-label text-center hover:underline underline-offset-4"
        >
          {text}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-3 text-paper/70 hover:text-paper text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
