import type { TimeSlot } from "./db-types";

/**
 * Slot locking rules from §2.3 of the product spec.
 * Each slot locks 5 minutes before its earliest kickoff.
 */
export const LOCK_LEAD_MS = 5 * 60 * 1000;

export const SLOT_ORDER: TimeSlot[] = [
  "thursday",
  "intl",
  "sunday_early",
  "sunday_late",
  "sunday_night",
  "monday",
];

export const SLOT_LABELS: Record<TimeSlot, string> = {
  thursday: "thursday night",
  intl: "international (london)",
  sunday_early: "sunday 1:00 PM ET",
  sunday_late: "sunday 4:05 PM ET",
  sunday_night: "sunday night",
  monday: "monday night",
};

/**
 * Infer time slot from an ET kickoff. Takes a UTC Date.
 * Day of week / hour boundaries align with the spec table.
 */
export function classifySlot(kickoffUtc: Date): TimeSlot {
  const et = new Date(
    kickoffUtc.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const day = et.getDay(); // 0 Sun ... 6 Sat
  const hour = et.getHours();
  const minute = et.getMinutes();
  const hm = hour * 60 + minute;

  if (day === 4) return "thursday"; // Thursday
  if (day === 1) return "monday"; // Monday
  if (day === 0) {
    if (hm < 12 * 60) return "intl"; // 9:30 AM ET
    if (hm < 15 * 60 + 30) return "sunday_early"; // 1:00 PM ET
    if (hm < 19 * 60) return "sunday_late"; // 4:05/4:25 PM ET
    return "sunday_night"; // 8:20 PM ET
  }
  // Saturday late-season games also treated as "sunday_early" for scoring.
  return "sunday_early";
}
