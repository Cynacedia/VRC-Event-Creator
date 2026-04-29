/**
 * Convert a VRChat recurrence object into an RFC 5545 RRULE string.
 *
 * Input shape (matches VRChat API):
 * {
 *   frequency: "daily" | "weekly" | "monthly" | "yearly",
 *   interval: number (>= 1),
 *   timezone: string (IANA, e.g. "America/Chicago"),
 *   daysOfWeek?: ["MO","TU","WE","TH","FR","SA","SU"]  // weekly only
 *   end?: {
 *     type: "afterOccurrences" | "afterDate",
 *     count?: number,            // for afterOccurrences
 *     date?: string              // for afterDate, "YYYY-MM-DDTHH:MM:SS" (no offset)
 *   }
 * }
 *
 * Output: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE;COUNT=10"
 * Returns null if input is invalid.
 */
function recurrenceToRRule(recurrence) {
  if (!recurrence || typeof recurrence !== "object") return null;
  const freqMap = {
    daily: "DAILY",
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    yearly: "YEARLY"
  };
  const freq = freqMap[recurrence.frequency];
  if (!freq) return null;

  const parts = [`FREQ=${freq}`];
  const interval = Number.isFinite(recurrence.interval) ? Math.floor(recurrence.interval) : 1;
  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  if (Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length > 0) {
    const validDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    const days = recurrence.daysOfWeek.filter(d => validDays.includes(d));
    if (days.length) {
      parts.push(`BYDAY=${days.join(",")}`);
    }
  }

  if (recurrence.end && typeof recurrence.end === "object") {
    if (recurrence.end.type === "afterOccurrences" && Number.isFinite(recurrence.end.count) && recurrence.end.count >= 1) {
      parts.push(`COUNT=${Math.floor(recurrence.end.count)}`);
    } else if (recurrence.end.type === "afterDate" && typeof recurrence.end.date === "string") {
      // Convert "2026-12-31T23:59:00" to RFC 5545 UTC format "20261231T235900Z"
      const isoDate = new Date(recurrence.end.date);
      if (!Number.isNaN(isoDate.getTime())) {
        const yyyy = isoDate.getUTCFullYear().toString().padStart(4, "0");
        const mm = (isoDate.getUTCMonth() + 1).toString().padStart(2, "0");
        const dd = isoDate.getUTCDate().toString().padStart(2, "0");
        const hh = isoDate.getUTCHours().toString().padStart(2, "0");
        const mi = isoDate.getUTCMinutes().toString().padStart(2, "0");
        const ss = isoDate.getUTCSeconds().toString().padStart(2, "0");
        parts.push(`UNTIL=${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`);
      }
    }
  }

  return parts.join(";");
}

module.exports = {
  recurrenceToRRule
};
