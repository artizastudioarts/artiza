import type { ProductBadge } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";

// Distinct, muted tones per badge — drawn from the site's existing
// restrained palette (plus two harmonizing additions) rather than bright
// generic colors, so ribbons still feel like part of the same gallery.
const BADGE_COLORS: Record<ProductBadge, string> = {
  best_seller: "bg-oxblood",
  artists_pick: "bg-brass",
  trending: "bg-navy",
  customer_favorite: "bg-forest",
  new_creations: "bg-ink",
};

export default function ProductBadgeRibbon({
  badge,
  dict,
}: {
  badge: ProductBadge | null;
  dict: Dictionary;
}) {
  if (!badge) return null;

  const label = dict.productCard.badges[badge];
  const words = label.split(" ");
  const firstLine = words[0];
  const secondLine = words.slice(1).join(" ");

  return (
    <div
      className={`absolute top-[20px] left-[-40px] w-[145px] py-2 shadow-sm z-10 ${BADGE_COLORS[badge]}`}
      style={{
        transform: "rotate(-45deg)",
        // Rotated text renders blurry in most browsers unless promoted to
        // its own crisp compositing layer — these three properties fix it.
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        willChange: "transform",
      }}
    >
      <p className="placard-label text-paper text-center text-[10.5px] leading-tight tracking-wide whitespace-nowrap">
        {firstLine}
        {secondLine && (
          <>
            <br />
            {secondLine}
          </>
        )}
      </p>
    </div>
  );
}
