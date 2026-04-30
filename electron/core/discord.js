/**
 * Discord Events integration module.
 * Creates Discord Events via the Discord REST API.
 * No external dependencies — uses Node.js built-in fetch.
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Create a Discord Event (EXTERNAL type).
 * @param {object} options
 * @param {string} options.botToken - Discord bot token
 * @param {string} options.guildId - Discord guild (server) ID
 * @param {string} options.name - Event name (truncated to 100 chars)
 * @param {string} options.description - Event description (truncated to 1000 chars)
 * @param {string} options.startTime - ISO8601 start time
 * @param {string} options.endTime - ISO8601 end time
 * @param {string} [options.imageBase64] - Optional base64 data URI for event image
 * @param {object} [options.recurrence] - Optional VRChat-shaped recurrence object to mirror
 * @returns {Promise<{ok: boolean, eventId?: string, error?: string}>}
 */
async function createDiscordScheduledEvent({ botToken, guildId, name, description, startTime, endTime, imageBase64, recurrence }) {
  if (!botToken || !guildId) {
    return { ok: false, error: "Missing bot token or guild ID." };
  }

  const body = {
    name: truncate(name, 100),
    description: truncate(description || "", 1000),
    scheduled_start_time: startTime,
    scheduled_end_time: endTime,
    entity_type: 3, // EXTERNAL
    entity_metadata: { location: "VRChat" },
    privacy_level: 2 // GUILD_ONLY
  };

  if (imageBase64) {
    body.image = imageBase64;
  }

  // Mirror a VRChat-style recurrence into Discord's recurrence_rule format if provided
  if (recurrence) {
    const rule = vrchatRecurrenceToDiscordRule(recurrence, startTime, endTime);
    if (rule) {
      body.recurrence_rule = rule;
    }
  }

  try {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/scheduled-events`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = formatDiscordError(response.status, errorData);
      return { ok: false, error: errorMessage };
    }

    const data = await response.json();
    return { ok: true, eventId: data.id };
  } catch (err) {
    return { ok: false, error: `Could not reach Discord API: ${err.message}` };
  }
}

/**
 * Test a bot token by fetching the bot's user info.
 * @param {string} botToken - Discord bot token
 * @returns {Promise<{ok: boolean, botName?: string, error?: string}>}
 */
async function testBotConnection(botToken) {
  if (!botToken) {
    return { ok: false, error: "No bot token provided." };
  }

  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: { "Authorization": `Bot ${botToken}` }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { ok: false, error: formatDiscordError(response.status, errorData) };
    }

    const data = await response.json();
    return { ok: true, botName: data.username };
  } catch (err) {
    return { ok: false, error: `Could not reach Discord API: ${err.message}` };
  }
}

/**
 * Convert a VRChat-shaped recurrence object into Discord's recurrence_rule.
 * VRChat recurrence shape:
 *   { frequency: "daily|weekly|monthly|yearly", interval: number, daysOfWeek?: ["MO","TU",...],
 *     end?: { type: "afterOccurrences" | "afterDate", count?, date? } }
 * Discord recurrence_rule shape:
 *   { start, end (nullable), frequency: 0|1|2|3, interval, by_weekday?, by_n_weekday?,
 *     by_month?, by_month_day?, by_year_day?, count? }
 *
 * Discord constraints (from API docs at time of writing):
 *  - DAILY frequency requires by_weekday=[MO,TU,WE,TH,FR] (only weekday-only daily allowed)
 *  - WEEKLY: interval must be 1 or 2
 *  - MONTHLY/YEARLY: interval must be 1
 * Returns null if the recurrence cannot be expressed in Discord's model.
 */
function vrchatRecurrenceToDiscordRule(recurrence, startTime, endTime) {
  if (!recurrence) return null;
  const freqMap = { yearly: 0, monthly: 1, weekly: 2, daily: 3 };
  const dayMap = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
  const freq = freqMap[recurrence.frequency];
  if (freq === undefined) return null;
  const interval = Number.isFinite(recurrence.interval) && recurrence.interval >= 1
    ? Math.floor(recurrence.interval)
    : 1;

  const rule = {
    start: startTime,
    end: null,
    frequency: freq,
    interval,
    by_weekday: null,
    by_n_weekday: null,
    by_month: null,
    by_month_day: null,
    by_year_day: null,
    count: null
  };

  if (Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length) {
    rule.by_weekday = recurrence.daysOfWeek
      .map(d => dayMap[d])
      .filter(n => Number.isInteger(n));
  }

  if (recurrence.end) {
    if (recurrence.end.type === "afterOccurrences" && Number.isFinite(recurrence.end.count)) {
      rule.count = Math.floor(recurrence.end.count);
    } else if (recurrence.end.type === "afterDate" && typeof recurrence.end.date === "string") {
      // Convert "YYYY-MM-DDTHH:MM:SS" (no offset) to ISO8601 by appending Z
      const dateStr = recurrence.end.date;
      try {
        rule.end = new Date(dateStr).toISOString();
      } catch {
        // ignore
      }
    }
  }

  // Discord enforces specific constraints — gracefully bail if we can't satisfy them
  if (freq === 3) { // DAILY
    // Discord only accepts daily with by_weekday=[0,1,2,3,4] (weekdays)
    const weekdays = [0, 1, 2, 3, 4].sort().join(",");
    const got = (rule.by_weekday || []).slice().sort().join(",");
    if (got !== weekdays) return null;
  }
  if (freq === 2 && interval > 2) return null; // WEEKLY interval must be 1 or 2
  if ((freq === 1 || freq === 0) && interval !== 1) return null;

  return rule;
}

/**
 * Truncate a string to a maximum length, appending "..." if truncated.
 */
function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str || "";
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Format a Discord API error into a user-friendly message.
 */
function formatDiscordError(status, errorData) {
  const detail = errorData?.message || "";
  switch (status) {
    case 401:
      return "Invalid bot token.";
    case 403:
      return "Bot lacks permission to create events in this server.";
    case 429:
      return "Discord rate limit hit. Try again later.";
    case 404:
      return "Discord server not found. Check the Server ID.";
    default:
      return `Discord API error ${status}${detail ? `: ${detail}` : ""}`;
  }
}

module.exports = {
  createDiscordScheduledEvent,
  testBotConnection,
  vrchatRecurrenceToDiscordRule
};
