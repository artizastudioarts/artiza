import { getPageContent } from "./getPageContent";
import { getDictionary } from "./dictionaries";

// The AGB as HTML for the order confirmation email. Uses the same editable
// text as the /terms page (Admin -> Content -> Terms), falling back to the
// built-in default wording for sections that were never customised.
export async function getTermsEmailHtml(): Promise<string> {
  const content = await getPageContent("terms", "de");
  const dict = getDictionary("de");
  const keys = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"] as const;

  return keys
    .map((key, i) => {
      const n = i + 1;
      const heading = content[`s${n}_heading`] ?? dict.terms[key].heading;
      const body =
        content[`s${n}_body`] ??
        (n === 5
          ? `${dict.terms.s5.before}<strong>${dict.terms.s5.bold}</strong>${dict.terms.s5.after}`
          : n === 10
            ? `${dict.terms.s10.before}<a href="mailto:info@artizastudio.de">info@artizastudio.de</a>${dict.terms.s10.after}`
            : "");
      return heading && body ? `<p><strong>${heading}</strong></p><p>${body}</p>` : "";
    })
    .join("");
}
