"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useCookieConsent } from "@/context/CookieConsentContext";

export default function CookieConsentBanner() {
  const { dict } = useLocale();
  const { bannerOpen, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!bannerOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-paper border-t border-ink shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="max-w-4xl mx-auto px-6 py-5">
        {!expanded ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sm text-ink-soft flex-1">
              {dict.cookies.bannerMessage}{" "}
              <Link href="/cookies" className="underline hover:text-ink">
                {dict.cookies.policyLinkText}
              </Link>
            </p>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setExpanded(true)}
                className="placard-label border border-line px-4 py-2 hover:bg-paper-dim transition-colors"
              >
                {dict.cookies.customize}
              </button>
              <button
                onClick={rejectNonEssential}
                className="placard-label border border-line px-4 py-2 hover:bg-paper-dim transition-colors"
              >
                {dict.cookies.necessaryOnly}
              </button>
              <button
                onClick={acceptAll}
                className="placard-label bg-ink text-paper px-4 py-2 hover:bg-oxblood transition-colors"
              >
                {dict.cookies.acceptAll}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-4 mb-5">
              <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
                <div>
                  <p className="font-display text-base">{dict.cookies.necessaryTitle}</p>
                  <p className="text-sm text-ink-soft mt-0.5">{dict.cookies.necessaryDesc}</p>
                </div>
                <span className="placard-label text-ink-soft shrink-0 mt-1">
                  {dict.cookies.alwaysOn}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
                <div>
                  <p className="font-display text-base">{dict.cookies.analyticsTitle}</p>
                  <p className="text-sm text-ink-soft mt-0.5">{dict.cookies.analyticsDesc}</p>
                </div>
                <label className="shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-base">{dict.cookies.marketingTitle}</p>
                  <p className="text-sm text-ink-soft mt-0.5">{dict.cookies.marketingDesc}</p>
                </div>
                <label className="shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => savePreferences({ analytics, marketing })}
                className="placard-label bg-ink text-paper px-4 py-2 hover:bg-oxblood transition-colors"
              >
                {dict.cookies.save}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="placard-label border border-line px-4 py-2 hover:bg-paper-dim transition-colors"
              >
                ←
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
