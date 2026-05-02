import { describe, it, expect } from "vitest";
import { recurrenceToRRule } from "../../electron/core/rrule.js";

describe("recurrenceToRRule", () => {
  it("returns null for invalid input", () => {
    expect(recurrenceToRRule(null)).toBeNull();
    expect(recurrenceToRRule(undefined)).toBeNull();
    expect(recurrenceToRRule("FREQ=DAILY")).toBeNull();
    expect(recurrenceToRRule(42)).toBeNull();
  });

  it("returns null when frequency is missing or invalid", () => {
    expect(recurrenceToRRule({})).toBeNull();
    expect(recurrenceToRRule({ frequency: "biweekly" })).toBeNull();
    expect(recurrenceToRRule({ frequency: "DAILY" })).toBeNull(); // case sensitive
  });

  it("emits FREQ for the four supported frequencies", () => {
    expect(recurrenceToRRule({ frequency: "daily" })).toBe("FREQ=DAILY");
    expect(recurrenceToRRule({ frequency: "weekly" })).toBe("FREQ=WEEKLY");
    expect(recurrenceToRRule({ frequency: "monthly" })).toBe("FREQ=MONTHLY");
    expect(recurrenceToRRule({ frequency: "yearly" })).toBe("FREQ=YEARLY");
  });

  it("omits INTERVAL when it is 1 (or missing/invalid)", () => {
    expect(recurrenceToRRule({ frequency: "daily" })).toBe("FREQ=DAILY");
    expect(recurrenceToRRule({ frequency: "daily", interval: 1 })).toBe("FREQ=DAILY");
    expect(recurrenceToRRule({ frequency: "daily", interval: "two" })).toBe("FREQ=DAILY");
    expect(recurrenceToRRule({ frequency: "daily", interval: NaN })).toBe("FREQ=DAILY");
  });

  it("includes INTERVAL when greater than 1", () => {
    expect(recurrenceToRRule({ frequency: "weekly", interval: 2 })).toBe("FREQ=WEEKLY;INTERVAL=2");
    // Floors fractional intervals (VRChat API contract — caller should send ints)
    expect(recurrenceToRRule({ frequency: "weekly", interval: 2.7 })).toBe("FREQ=WEEKLY;INTERVAL=2");
  });

  it("emits BYDAY in input order, filtering invalid day codes", () => {
    expect(
      recurrenceToRRule({ frequency: "weekly", daysOfWeek: ["MO", "WE", "FR"] })
    ).toBe("FREQ=WEEKLY;BYDAY=MO,WE,FR");
    // Bad codes filtered out, valid ones preserved
    expect(
      recurrenceToRRule({ frequency: "weekly", daysOfWeek: ["MO", "XX", "TU"] })
    ).toBe("FREQ=WEEKLY;BYDAY=MO,TU");
  });

  it("omits BYDAY when daysOfWeek is empty or all-invalid", () => {
    expect(recurrenceToRRule({ frequency: "weekly", daysOfWeek: [] })).toBe("FREQ=WEEKLY");
    expect(
      recurrenceToRRule({ frequency: "weekly", daysOfWeek: ["XX", "YY"] })
    ).toBe("FREQ=WEEKLY");
  });

  it("emits COUNT for afterOccurrences end-condition", () => {
    expect(
      recurrenceToRRule({
        frequency: "weekly",
        end: { type: "afterOccurrences", count: 10 },
      })
    ).toBe("FREQ=WEEKLY;COUNT=10");
  });

  it("rejects COUNT with non-finite or zero/negative count", () => {
    const r = (count) =>
      recurrenceToRRule({
        frequency: "weekly",
        end: { type: "afterOccurrences", count },
      });
    expect(r(0)).toBe("FREQ=WEEKLY");
    expect(r(-1)).toBe("FREQ=WEEKLY");
    expect(r(NaN)).toBe("FREQ=WEEKLY");
    expect(r("ten")).toBe("FREQ=WEEKLY");
  });

  it("emits UNTIL in UTC compact form for afterDate end-condition", () => {
    // Input "2026-12-31T23:59:00" is parsed as local — result depends on TZ.
    // Using a UTC-suffixed input gives a deterministic check across machines.
    expect(
      recurrenceToRRule({
        frequency: "weekly",
        end: { type: "afterDate", date: "2026-12-31T23:59:00Z" },
      })
    ).toBe("FREQ=WEEKLY;UNTIL=20261231T235900Z");
  });

  it("ignores afterDate when the date is unparseable", () => {
    expect(
      recurrenceToRRule({
        frequency: "weekly",
        end: { type: "afterDate", date: "not-a-date" },
      })
    ).toBe("FREQ=WEEKLY");
  });

  it("composes all parts in the documented order: FREQ;INTERVAL;BYDAY;COUNT", () => {
    expect(
      recurrenceToRRule({
        frequency: "weekly",
        interval: 2,
        daysOfWeek: ["MO", "WE"],
        end: { type: "afterOccurrences", count: 8 },
      })
    ).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=8");
  });
});
