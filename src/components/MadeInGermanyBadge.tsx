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

      {/* A quiet nod to the German flag, in the site's own palette rather than bright flag colors */}
      <rect x="74" y="46" width="52" height="4" fill="var(--ink)" />
      <rect x="74" y="52" width="52" height="4" fill="var(--oxblood)" />
      <rect x="74" y="58" width="52" height="4" fill="var(--brass)" />

      <text
        x="100"
        y="106"
        textAnchor="middle"
        fill="var(--ink)"
        style={{
          fontFamily: "var(--font-body), Arial, sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        {mainText}
      </text>

      <line x1="80" y1="118" x2="120" y2="118" stroke="var(--brass)" strokeWidth="1" />

      <text
        x="100"
        y="134"
        textAnchor="middle"
        fill="var(--ink-soft)"
        style={{
          fontFamily: "var(--font-body), Arial, sans-serif",
          fontSize: "10.5px",
          letterSpacing: "0.1em",
        }}
      >
        {subText}
      </text>
    </svg>
  );
}
