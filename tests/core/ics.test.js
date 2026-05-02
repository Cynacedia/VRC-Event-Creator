import { describe, it, expect } from "vitest";
import { generateIcsString } from "../../electron/core/ics.js";

// Common base inputs reused across tests; spread + override per case.
const baseInput = {
  title: "Hangout",
  description: "Casual hang in VRChat",
  startTime: "2026-05-15T19:00:00.000Z",
  endTime: "2026-05-15T21:00:00.000Z",
  uid: "evt_abc123@vrc-event-creator",
};

function lines(ics) {
  return ics.split("\r\n");
}

describe("generateIcsString", () => {
  it("emits a well-formed VCALENDAR/VEVENT envelope", () => {
    const ics = generateIcsString(baseInput);
    const ls = lines(ics);
    expect(ls[0]).toBe("BEGIN:VCALENDAR");
    expect(ls).toContain("VERSION:2.0");
    expect(ls).toContain("PRODID:-//VRC Event Creator//EN");
    expect(ls).toContain("CALSCALE:GREGORIAN");
    expect(ls).toContain("METHOD:PUBLISH");
    expect(ls.indexOf("BEGIN:VEVENT")).toBeGreaterThan(0);
    expect(ls.indexOf("END:VEVENT")).toBeGreaterThan(ls.indexOf("BEGIN:VEVENT"));
    expect(ls[ls.length - 2]).toBe("END:VCALENDAR"); // last is empty after trailing CRLF
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("converts ISO timestamps to ICS-compact UTC form", () => {
    const ics = generateIcsString(baseInput);
    expect(ics).toContain("DTSTART:20260515T190000Z");
    expect(ics).toContain("DTEND:20260515T210000Z");
  });

  it("uses the supplied UID and SUMMARY verbatim", () => {
    const ics = generateIcsString(baseInput);
    expect(ics).toContain("UID:evt_abc123@vrc-event-creator");
    expect(ics).toContain("SUMMARY:Hangout");
  });

  it("defaults LOCATION to 'VRChat' when not provided", () => {
    const ics = generateIcsString(baseInput);
    expect(ics).toContain("LOCATION:VRChat");
  });

  it("respects a custom LOCATION", () => {
    const ics = generateIcsString({ ...baseInput, location: "The Black Cat" });
    expect(ics).toContain("LOCATION:The Black Cat");
  });

  it("defaults SUMMARY to 'VRChat Event' when title is empty", () => {
    const ics = generateIcsString({ ...baseInput, title: "" });
    expect(ics).toContain("SUMMARY:VRChat Event");
  });

  it("omits DESCRIPTION when description is empty/falsy", () => {
    const ics = generateIcsString({ ...baseInput, description: "" });
    expect(ics).not.toMatch(/DESCRIPTION:/);
  });

  it("includes DESCRIPTION when provided", () => {
    const ics = generateIcsString(baseInput);
    expect(ics).toContain("DESCRIPTION:Casual hang in VRChat");
  });

  it("emits SEQUENCE:0 by default and the supplied value when given", () => {
    expect(generateIcsString(baseInput)).toContain("SEQUENCE:0");
    expect(generateIcsString({ ...baseInput, sequence: 3 })).toContain("SEQUENCE:3");
  });

  it("escapes commas, semicolons, backslashes, and newlines in text fields", () => {
    const ics = generateIcsString({
      ...baseInput,
      title: "Karaoke; sing-along, please",
      description: "Line 1\nLine 2\\backslash",
    });
    expect(ics).toContain("SUMMARY:Karaoke\\; sing-along\\, please");
    expect(ics).toContain("DESCRIPTION:Line 1\\nLine 2\\\\backslash");
  });
});

describe("RRULE handling", () => {
  it("includes RRULE when provided", () => {
    const ics = generateIcsString({
      ...baseInput,
      rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE",
    });
    expect(ics).toContain("RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE");
  });

  it("omits RRULE when missing or non-string", () => {
    expect(generateIcsString(baseInput)).not.toMatch(/RRULE:/);
    expect(generateIcsString({ ...baseInput, rrule: null })).not.toMatch(/RRULE:/);
    expect(generateIcsString({ ...baseInput, rrule: 123 })).not.toMatch(/RRULE:/);
  });
});

describe("VALARM reminders", () => {
  it("emits no VALARM block when reminders is empty/missing", () => {
    expect(generateIcsString(baseInput)).not.toMatch(/BEGIN:VALARM/);
    expect(generateIcsString({ ...baseInput, reminders: [] })).not.toMatch(/BEGIN:VALARM/);
  });

  it("emits one VALARM per reminder, sorted longest-trigger first", () => {
    const ics = generateIcsString({
      ...baseInput,
      reminders: [
        { value: 30, unit: "minutes" },  // 30m
        { value: 1, unit: "days" },      // 1440m
        { value: 2, unit: "hours" },     // 120m
      ],
    });
    const triggers = lines(ics).filter(l => l.startsWith("TRIGGER:"));
    expect(triggers).toEqual([
      "TRIGGER:-P1D",
      "TRIGGER:-PT2H",
      "TRIGGER:-PT30M",
    ]);
  });

  it("formats triggers per unit (minutes default)", () => {
    const ics = generateIcsString({
      ...baseInput,
      reminders: [{ value: 15 }], // unit defaults to minutes
    });
    expect(ics).toContain("TRIGGER:-PT15M");
  });

  it("drops zero/negative/non-numeric reminders", () => {
    const ics = generateIcsString({
      ...baseInput,
      reminders: [
        { value: 0, unit: "minutes" },
        { value: -5, unit: "minutes" },
        { value: "ten", unit: "minutes" },
        null,
        { value: 10, unit: "minutes" }, // only this survives
      ],
    });
    const triggers = lines(ics).filter(l => l.startsWith("TRIGGER:"));
    expect(triggers).toEqual(["TRIGGER:-PT10M"]);
  });
});

describe("RFC 5545 line folding", () => {
  it("folds lines longer than 75 octets, continuation prefixed with one space", () => {
    const longTitle = "x".repeat(120); // forces a fold inside SUMMARY:...
    const ics = generateIcsString({ ...baseInput, title: longTitle });
    const ls = lines(ics);
    // Find the SUMMARY line + its continuation
    const summaryIdx = ls.findIndex(l => l.startsWith("SUMMARY:"));
    expect(summaryIdx).toBeGreaterThan(-1);
    expect(ls[summaryIdx].length).toBeLessThanOrEqual(75);
    expect(ls[summaryIdx + 1].startsWith(" ")).toBe(true);
    // Reconstruction should yield the original full SUMMARY value
    const rebuilt = ls[summaryIdx] + ls[summaryIdx + 1].slice(1);
    expect(rebuilt).toBe(`SUMMARY:${longTitle}`);
  });

  it("does not fold lines at or under 75 octets", () => {
    const ics = generateIcsString(baseInput);
    for (const line of lines(ics)) {
      // Either a non-continuation line ≤75 or a continuation starting with " "
      if (line.startsWith(" ")) continue;
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });
});
