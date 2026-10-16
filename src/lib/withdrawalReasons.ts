// Optional, voluntary reasons for a withdrawal. The customer never has to
// give one; the codes are stored so they can be counted later.
export const WITHDRAWAL_REASON_CODES = [
  "not_liked",
  "damaged",
  "mistake",
  "slow_delivery",
  "other",
] as const;

export type WithdrawalReasonCode = (typeof WITHDRAWAL_REASON_CODES)[number];

export const WITHDRAWAL_REASON_LABEL_DE: Record<WithdrawalReasonCode, string> = {
  not_liked: "Gefällt mir nicht",
  damaged: "Beschädigt angekommen",
  mistake: "Versehentlich bestellt",
  slow_delivery: "Lieferzeit zu lang",
  other: "Anderer Grund",
};

export function isReasonCode(v: unknown): v is WithdrawalReasonCode {
  return typeof v === "string" && (WITHDRAWAL_REASON_CODES as readonly string[]).includes(v);
}
