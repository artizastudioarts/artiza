"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { supabasePublic } from "@/lib/supabase";

// "Handmade, ships within 2 working days" note. Text is editable in
// Admin -> Content -> "Shipping time note". Pass `text` when it is already
// known on the server (product page); without it the note loads itself
// (cart page, which is a client component). Empty text = nothing shown.
export default function ShippingNote({ text, className = "" }: { text?: string; className?: string }) {
  const { locale } = useLocale();
  const [loaded, setLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (text !== undefined) return;
    let cancelled = false;
    supabasePublic
      .from("site_content")
      .select("value_de, value_en")
      .eq("page_key", "shipping_note")
      .eq("field_key", "text")
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setLoaded((locale === "de" ? data?.value_de : data?.value_en) ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [text, locale]);

  const value = text ?? loaded;
  if (!value) return null;

  return (
    <p className={`border-l-4 border-brand bg-paper-dim px-4 py-3 text-sm leading-relaxed ${className}`}>
      {value}
    </p>
  );
}
