import type { Locale } from "@/lib/i18n";

export default function MadeInGermanyBadge({
  locale,
  className = "w-28 h-28",
}: {
  locale: Locale;
  className?: string;
}) {
  const mainText = locale === "de" ? "HANDGEFERTIGT" : "HANDMADE";
  const subText = locale === "de" ? "IN DEUTSCHLAND" : "IN GERMANY";

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={locale === "de" ? "Handgefertigt in Deutschland" : "Handmade in Germany"}
    >
      <circle cx="100" cy="100" r="95" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="var(--brass)" strokeWidth="1" />

      {/* True German flag colors — this is the one place authenticity beats palette-matching */}
      <rect x="72" y="44" width="56" height="5" fill="#000000" />
      <rect x="72" y="51" width="56" height="5" fill="#DD0000" />
      <rect x="72" y="58" width="56" height="5" fill="#FFCE00" />

      <text
        x="100"
        y="112"
        textAnchor="middle"
        fill="var(--ink)"
        style={{
          fontFamily: "var(--font-body), Arial, sans-serif",
          fontSize: "18px",
          fontWeight: 700,
          letterSpacing: "0.03em",
        }}
      >
        {mainText}
      </text>

      <line x1="78" y1="124" x2="122" y2="124" stroke="var(--brass)" strokeWidth="1" />

      <text
        x="100"
        y="142"
        textAnchor="middle"
        fill="var(--ink-soft)"
        style={{
          fontFamily: "var(--font-body), Arial, sans-serif",
          fontSize: "13px",
          letterSpacing: "0.08em",
        }}
      >
        {subText}
      </text>
    </svg>
  );
}
