// Client-safe half of league email: audiences, limits, and recipient
// selection. Shared by the Commissioner panel (live counts) and the send route.

export const AUDIENCES = ["all", "unpaid", "unpicked"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const SUBJECT_MAX = 150;
export const BODY_MAX = 5000;
/** Sends allowed per league in a rolling 24 hours. */
export const SENDS_PER_DAY = 5;

export function isAudience(v: unknown): v is Audience {
  return typeof v === "string" && (AUDIENCES as readonly string[]).includes(v);
}

export const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Everyone",
  unpaid: "Unpaid",
  unpicked: "Haven't picked",
};

export type EmailMember = {
  memberId: string;
  userId: string;
  email: string;
  displayName: string;
  isPaid: boolean;
  emailOptOut: boolean;
  /** Still owes picks on a game that hasn't locked this week. */
  hasUnpicked: boolean;
};

export function matchesAudience(m: Pick<EmailMember, "isPaid" | "hasUnpicked">, audience: Audience): boolean {
  if (audience === "unpaid") return !m.isPaid;
  if (audience === "unpicked") return m.hasUnpicked;
  return true;
}

/**
 * Who a send reaches. The sender is never in `recipients` (they get a copy
 * separately); members who unsubscribed are counted but skipped.
 */
export function selectRecipients<M extends EmailMember>(
  members: M[],
  audience: Audience,
  senderUserId: string,
): { recipients: M[]; optedOut: number } {
  let optedOut = 0;
  const recipients: M[] = [];
  for (const m of members) {
    if (m.userId === senderUserId || !matchesAudience(m, audience)) continue;
    if (m.emailOptOut) { optedOut++; continue; }
    if (!m.email) continue;
    recipients.push(m);
  }
  return { recipients, optedOut };
}
