/**
 * Inline SVG pictograms for the product safety box.
 * - NotUnder3: the usual "not suitable for children under 3 years" symbol (crossed-out
 *   child's face with "0-3").
 * - WarningTriangle: generic caution sign.
 * - CeMark: simplified CE mark. For printed packaging use the official artwork
 *   (proportions are fixed by EU Decision 768/2008).
 */
export function NotUnder3({ className = "w-14 h-14", label }: { className?: string; label: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <circle cx="50" cy="50" r="45" fill="#fff" stroke="#d6001c" strokeWidth="7" />
      <circle cx="50" cy="38" r="17" fill="none" stroke="#111" strokeWidth="4" />
      <circle cx="44" cy="35" r="2.4" fill="#111" />
      <circle cx="56" cy="35" r="2.4" fill="#111" />
      <path d="M43 44 Q50 50 57 44" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <text x="50" y="80" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="19" fill="#111">0-3</text>
      <line x1="18" y1="18" x2="82" y2="82" stroke="#d6001c" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function WarningTriangle({ className = "w-14 h-14", label }: { className?: string; label: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <path d="M50 8 L94 87 H6 Z" fill="#ffd400" stroke="#111" strokeWidth="6" strokeLinejoin="round" />
      <rect x="45.5" y="33" width="9" height="30" rx="3" fill="#111" />
      <circle cx="50" cy="74" r="5.2" fill="#111" />
    </svg>
  );
}

export function CeMark({ className = "h-9 w-auto", label = "CE" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 130 90" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      {/* C */}
      <path d="M58 14 A31 31 0 1 0 58 76" fill="none" stroke="#111" strokeWidth="14" />
      {/* E */}
      <rect x="75" y="14" width="14" height="62" fill="#111" />
      <rect x="75" y="14" width="46" height="14" fill="#111" />
      <rect x="75" y="38" width="38" height="14" fill="#111" />
      <rect x="75" y="62" width="46" height="14" fill="#111" />
    </svg>
  );
}
