"use client";

import { useState, type ReactNode } from "react";
import { useProductVariant } from "@/components/ProductVariantProvider";
import type { Dictionary } from "@/lib/dictionaries";

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="placard-label">{title}</span>
        <span aria-hidden="true" className="text-brand text-xl leading-none">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="pb-5 text-ink-soft leading-relaxed">{children}</div>}
    </div>
  );
}

export default function ProductDetailsAccordions({
  description,
  materials,
  dict,
}: {
  description: string;
  materials: string;
  dict: Dictionary;
}) {
  const ctx = useProductVariant();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (k: string) => setOpenKey((cur) => (cur === k ? null : k));

  const box = ctx?.selected;
  const hasBox = !!box && !!(box.box_contents?.trim() || box.colors_included?.trim());

  return (
    <div className="border-t border-line mt-8">
      {description.trim() && (
        <Section
          title={dict.product.descriptionHeading}
          open={openKey === "desc"}
          onToggle={() => toggle("desc")}
        >
          <p className="whitespace-pre-line">{description}</p>
        </Section>
      )}
      {hasBox && box && (
        <Section
          title={dict.product.boxHeading}
          open={openKey === "box"}
          onToggle={() => toggle("box")}
        >
          {box.box_contents?.trim() && (
            <p className="whitespace-pre-line">{box.box_contents}</p>
          )}
          {box.colors_included?.trim() && (
            <div className="mt-3">
              <p className="placard-label text-ink mb-1">{dict.product.colorsIncluded}</p>
              <p className="whitespace-pre-line">{box.colors_included}</p>
            </div>
          )}
        </Section>
      )}
      {materials.trim() && (
        <Section
          title={dict.product.materialsHeading}
          open={openKey === "materials"}
          onToggle={() => toggle("materials")}
        >
          <p className="whitespace-pre-line">{materials}</p>
        </Section>
      )}
    </div>
  );
}
