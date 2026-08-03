import type { ProductBadge } from "@/lib/types";
import type { Dictionary } from "@/lib/dictionaries";

export default function ProductBadgeRibbon({
  badge,
  dict,
}: {
  badge: ProductBadge | null;
  dict: Dictionary;
}) {
  if (!badge) return null;

  return (
    <div
      className="absolute top-[22px] left-[-42px] w-[180px] py-1.5 bg-oxblood shadow-sm z-10"
      style={{
        transform: "rotate(-45deg)",
        // Rotated text renders blurry in most browsers unless promoted to
        // its own crisp compositing layer — these three properties fix it.
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        willChange: "transform",
      }}
    >
      <p className="placard-label text-paper text-center text-[11px] tracking-wide whitespace-nowrap">
        {dict.productCard.badges[badge]}
      </p>
    </div>
  );
}
