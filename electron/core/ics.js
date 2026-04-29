/**
 * ICS (iCalendar) file generation module.
 * Generates RFC 5545 compliant .ics calendar strings.
 * No external dependencies — ICS is a plain text format.
 */

/**
 * Generate an ICS calendar string for a single event.
 * @param {object} options
 * @param {string} options.title - Event title (SUMMARY)
 * @param {string} options.description - Event description (DESCRIPTION)
 * @param {string} options.startTime - ISO 8601 UTC start time
 * @param {string} options.endTime - ISO 8601 UTC end time
 * @param {string} [options.location] - Event location (LOCATION), defaults to "VRChat"
 * @param {string} options.uid - Deterministic UID for this event
 * @param {number} [options.sequence] - SEQUENCE number for updates (default 0)
 * @param {Array<{value: number, unit: string}>} [options.reminders] - VALARM reminders
 * @returns {string} Complete ICS file content
 */
function generateIcsString({ title, description, startTime, endTime, location, uid, sequence, reminders }) {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VRC Event Creator//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(uid)}`,
    `DTSTAMP:${toIcsTimestamp(now.toISOString())}`,
    `DTSTART:${toIcsTimestamp(startTime)}`,
    `DTEND:${toIcsTimestamp(endTime)}`,
    `SEQUENCE:${sequence || 0}`,
    `SUMMARY:${escapeText(title || "VRChat Event")}`,
    `LOCATION:${escapeText(location || "VRChat")}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeText(description)}`);
  }

  // Add VALARM blocks for each reminder (longest first — some clients only use the first)
  if (Array.isArray(reminders)) {
    const sorted = [...reminders].filter(r => r && typeof r.value === "number" && r.value > 0).sort((a, b) => {
      const toMin = r => r.value * (r.unit === "days" ? 1440 : r.unit === "hours" ? 60 : 1);
      return toMin(b) - toMin(a);
    });
    for (const reminder of sorted) {
      if (!reminder || typeof reminder.value !== "number" || reminder.value <= 0) continue;
      const trigger = toDuration(reminder.value, reminder.unit || "minutes");
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(title || "VRChat Event")}`,
        `TRIGGER:-${trigger}`,
        "END:VALARM"
      );
    }
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  // Fold long lines and join
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/**
 * Convert an ISO 8601 string to ICS timestamp format.
 * "2026-05-15T19:00:00.000Z" → "20260515T190000Z"
 */
function toIcsTimestamp(isoString) {
  return isoString.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace(/Z$/, "Z");
}

/**
 * Convert a value + unit to an ICS duration string.
 * e.g., (30, "minutes") → "PT30M", (5, "hours") → "PT5H", (1, "days") → "P1D"
 */
function toDuration(value, unit) {
  switch (unit) {
    case "hours": return `PT${value}H`;
    case "days": return `P${value}D`;
    case "minutes":
    default: return `PT${value}M`;
  }
}

/**
 * Escape text for ICS fields.
 * Backslash, semicolon, comma, and newlines must be escaped.
 */
function escapeText(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Fold a line to comply with RFC 5545 (max 75 octets per line).
 * Continuation lines start with a single space.
 */
function foldLine(line) {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;

  const parts = [];
  let remaining = line;
  let isFirst = true;

  while (Buffer.byteLength(remaining, "utf8") > (isFirst ? 75 : 74)) {
    const maxBytes = isFirst ? 75 : 74;
    let cutIndex = 0;
    let byteCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const charBytes = Buffer.byteLength(remaining[i], "utf8");
      if (byteCount + charBytes > maxBytes) break;
      byteCount += charBytes;
      cutIndex = i + 1;
    }

    parts.push((isFirst ? "" : " ") + remaining.slice(0, cutIndex));
    remaining = remaining.slice(cutIndex);
    isFirst = false;
  }

  if (remaining) {
    parts.push((isFirst ? "" : " ") + remaining);
  }

  return parts.join("\r\n");
}

module.exports = {
  generateIcsString
};
