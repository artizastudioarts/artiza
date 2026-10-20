/**
 * Admin-editable safety notice shown on every product page (toy-safety /
 * GPSR information). All text comes from the "product_safety" page in
 * Admin -> Content; a field left empty there is simply not shown.
 * `contents` is the product's own "Size / kit contents" text.
 */
import { CeMark, NotUnder3, WarningTriangle } from "@/components/SafetyIcons";

export default function ProductSafetyNotice({
  content,
  contents,
}: {
  content: Record<string, string>;
  contents?: string | null;
}) {
  const c = content;
  const hasAnything =
    c.warning || c.age || c.supervision || c.material || c.dust || c.ce || c.manufacturer || contents;
  if (!hasAnything) return null;

  return (
    <section
      aria-label={c.heading || "Safety information"}
      className="mt-8 border border-ink/15 p-5 text-sm leading-relaxed"
    >
      {c.heading && <p className="placard-label text-ink-soft mb-3">{c.heading}</p>}
      {c.warning && (
        <div className="flex items-center gap-3 mb-3">
          <NotUnder3 label={c.warning} />
          <WarningTriangle label={c.heading || "Warning"} className="w-12 h-12" />
        </div>
      )}
      <div className="space-y-2">
        {c.warning && <p className="font-semibold">{c.warning}</p>}
        {c.age && <p>{c.age}</p>}
        {c.supervision && <p>{c.supervision}</p>}
        {contents && (
          <p>
            {c.contents_label ? <span className="font-semibold">{c.contents_label} </span> : null}
            {contents}
          </p>
        )}
        {c.material && <p>{c.material}</p>}
        {c.dust && <p>{c.dust}</p>}
        {c.ce && (
          <div className="flex items-center gap-3">
            <CeMark />
            <p>{c.ce}</p>
          </div>
        )}
        {c.manufacturer && <p className="text-ink-soft pt-2 border-t border-ink/10">{c.manufacturer}</p>}
      </div>
    </section>
  );
}
