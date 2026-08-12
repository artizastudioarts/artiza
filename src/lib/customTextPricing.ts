/**
 * Counts only the characters that actually get charged for — letters and
 * digits. Spaces (and anything else) don't count toward price or toward
 * the min/max length limits; they're just visual separators.
 */
export function countBillableChars(text: string): number {
  return (text.match(/[a-zA-Z0-9]/g) ?? []).length;
}

/**
 * Strips out anything that isn't a letter, digit, or space — used to
 * filter input as the customer types, so they can't type symbols or
 * accented characters that were never part of the priced set.
 */
export function sanitizeCustomText(text: string): string {
  return text.replace(/[^a-zA-Z0-9 ]/g, "");
}

/**
 * True only if the text is entirely letters, digits, and spaces — no
 * German umlauts/ß, no symbols, no emoji. The client-side input already
 * filters as you type, but this is the server-side backstop: a request
 * that skips the browser entirely (a direct API call) still can't slip
 * disallowed characters through checkout.
 */
export function isValidCustomText(text: string): boolean {
  return /^[a-zA-Z0-9 ]*$/.test(text);
}

export function calcPerCharacterPriceCents(
  text: string,
  pricePerCharCents: number
): number {
  return countBillableChars(text) * pricePerCharCents;
}
