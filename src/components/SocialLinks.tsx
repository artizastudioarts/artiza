import { SOCIAL_LINKS } from "@/lib/social";

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap justify-center gap-4 ${className}`}>
      {SOCIAL_LINKS.map((s) => (
        <li key={s.key}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border border-line bg-paper px-5 py-3 hover:border-brand transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill={s.color}
              role="img"
              aria-label={s.name}
            >
              <path d={s.path} />
            </svg>
            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold">{s.name}</span>
              <span className="block text-xs text-ink-soft">{s.handle}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
