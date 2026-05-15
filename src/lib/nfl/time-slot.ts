// Map a kickoff timestamp to the time_slot enum in public.games.
//
// Slot windows (all times Eastern, spec §2.3):
//   thursday      — Thu/Fri/Sat kickoffs (TNF + Black Friday / Saturday doubleheaders)
//   intl          — Sun kickoffs before 12:00 ET (London, Germany, etc.)
//   sunday_early  — Sun 12:00-15:59 ET
//   sunday_late   — Sun 16:00-19:59 ET
//   sunday_night  — Sun 20:00 ET onwards
//   monday        — Mon kickoffs

export type TimeSlot =
  | "thursday"
  | "intl"
  | "sunday_early"
  | "sunday_late"
  | "sunday_night"
  | "monday";

type EasternParts = { weekday: string; hour: number };

function easternParts(d: Date): EasternParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hourRaw = parts.find((p) => p.type === "hour")?.value ?? "0";
  // `hour12: false` can still emit "24" for midnight in some runtimes.
  const hour = parseInt(hourRaw, 10) % 24;
  return { weekday, hour };
}

export function timeSlotFor(kickoff: Date): TimeSlot {
  const { weekday, hour } = easternParts(kickoff);
  switch (weekday) {
    case "Wed":
    case "Thu":
    case "Fri":
    case "Sat":
      return "thursday";
    case "Sun":
      if (hour < 12) return "intl";
      if (hour < 16) return "sunday_early";
      if (hour < 20) return "sunday_late";
      return "sunday_night";
    case "Mon":
      return "monday";
    default:
      throw new Error(`Unexpected kickoff weekday (ET): ${weekday}`);
  }
}
