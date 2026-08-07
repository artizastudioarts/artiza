"use client";

import { useState } from "react";

export default function FaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-display text-lg">{item.question}</span>
              <span className="text-ink-soft shrink-0">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <p className="text-ink-soft text-sm leading-relaxed pb-4">{item.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
