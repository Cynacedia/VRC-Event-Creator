const { DateTime } = require("luxon");

function safeZone(timezone) {
  const zone = timezone || "UTC";
  const test = DateTime.now().setZone(zone);
  return test.isValid ? zone : "UTC";
}

function getNthWeekdayOfMonth(baseDate, weekday, occurrence) {
  const firstOfMonth = baseDate.startOf("month");
  const firstWeekday = firstOfMonth.set({ weekday });
  let targetDate = firstWeekday < firstOfMonth
    ? firstWeekday.plus({ weeks: 1 })
    : firstWeekday;
  targetDate = targetDate.plus({ weeks: occurrence - 1 });
  return targetDate;
}

function getLastWeekdayOfMonth(baseDate, weekday) {
  const lastOfMonth = baseDate.endOf("month");
  const lastWeekday = lastOfMonth.set({ weekday });
  if (lastWeekday > lastOfMonth) {
    return lastWeekday.minus({ weeks: 1 });
  }
  return lastWeekday;
}

function countWeekdayInMonth(baseDate, weekday) {
  let count = 0;
  const firstOccurrence = getNthWeekdayOfMonth(baseDate, weekday, 1);
  let current = firstOccurrence;
  while (current.month === baseDate.month) {
    count += 1;
    current = current.plus({ weeks: 1 });
  }
  return count;
}

function generateDateOptionsFromPatterns(patterns, monthsAhead = 6, timezone = "UTC") {
  const zone = safeZone(timezone);
  const now = DateTime.now().setZone(zone);
  const options = [];
  const seenDates = new Set();
  const weekdays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ];

  // First, handle annual patterns separately (they're year-based, not month-based)
  for (const pattern of patterns) {
    if (pattern.type === "annual") {
      // Check current year and next year for the annual date
      for (let y = now.year; y <= now.year + 1; y++) {
        // Handle leap year for Feb 29
        const maxDay = pattern.month === 2 && pattern.day === 29
          ? (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28)
          : pattern.day;
        const actualDay = Math.min(pattern.day, maxDay);

        const date = DateTime.fromObject({
          year: y,
          month: pattern.month,
          day: actualDay,
          hour: pattern.hour,
          minute: pattern.minute,
          second: 0,
          millisecond: 0
        }, { zone });

        if (!date.isValid) continue;
        if (date <= now) continue;
        if (date > now.plus({ months: monthsAhead })) continue;

        const dateKey = date.toISO();
        if (seenDates.has(dateKey)) continue;
        seenDates.add(dateKey);

        options.push({
          iso: date.toISO(),
          weekday: null,
          occurrence: null,
          isLast: false,
          isAnnual: true,
          sortKey: date.toMillis()
        });
      }
    }
  }

  // Handle weekday-based patterns
  for (let m = 0; m <= monthsAhead; m += 1) {
    const targetMonth = now.plus({ months: m });

    for (const pattern of patterns) {
      // Skip annual patterns (already handled above)
      if (pattern.type === "annual") continue;

      const weekdayNum = weekdays.indexOf(pattern.weekday?.toLowerCase()) + 1;
      if (weekdayNum <= 0) {
        continue;
      }

      let dates = [];
      if (pattern.type === "every" || pattern.type === "every-other") {
        for (let i = 1; i <= 5; i += 1) {
          const date = getNthWeekdayOfMonth(targetMonth, weekdayNum, i);
          if (date.month === targetMonth.month) {
            dates.push({ date, occurrence: i });
          }
        }
      } else if (pattern.type === "nth") {
        const date = getNthWeekdayOfMonth(targetMonth, weekdayNum, pattern.occurrence);
        if (date.month === targetMonth.month) {
          dates.push({ date, occurrence: pattern.occurrence });
        }
      } else if (pattern.type === "last") {
        const date = getLastWeekdayOfMonth(targetMonth, weekdayNum);
        dates.push({ date, occurrence: "last" });
      }

      for (const { date, occurrence } of dates) {
        const dateWithTime = date.set({
          hour: pattern.hour,
          minute: pattern.minute,
          second: 0,
          millisecond: 0
        });

        if (dateWithTime <= now) {
          continue;
        }

        const dateKey = dateWithTime.toISO();
        if (seenDates.has(dateKey)) {
          continue;
        }
        seenDates.add(dateKey);

        const totalOccurrences = countWeekdayInMonth(dateWithTime, weekdayNum);
        const occurrenceNum = occurrence === "last" ? totalOccurrences : occurrence;
        const isLast = occurrenceNum === totalOccurrences;

        options.push({
          iso: dateWithTime.toISO(),
          weekday: weekdays[weekdayNum - 1],
          occurrence: occurrenceNum,
          isLast,
          sortKey: dateWithTime.toMillis()
        });
      }
    }
  }

  return options
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ iso, weekday, occurrence, isLast, isAnnual }) => ({
      iso,
      weekday,
      occurrence,
      isLast,
      isAnnual: isAnnual || false
    }));
}

module.exports = {
  generateDateOptionsFromPatterns,
  safeZone
};
