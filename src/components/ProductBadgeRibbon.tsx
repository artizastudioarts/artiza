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
    <div className="absolute top-[18px] left-[-38px] w-[150px] -rotate-45 bg-oxblood py-1 shadow-sm z-10">
      <p className="placard-label text-paper text-center text-[10px] tracking-wider">
        {dict.productCard.badges[badge]}
      </p>
    </div>
  );
}
