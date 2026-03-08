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
 * @returns {Promise<{ok: boolean, eventId?: string, error?: string}>}
 */
async function createDiscordScheduledEvent({ botToken, guildId, name, description, startTime, endTime, imageBase64 }) {
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
  testBotConnection
};
