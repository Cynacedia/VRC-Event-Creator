/**
 * Discord Webhook delivery module.
 * Sends ICS calendar files with rich embeds via Discord webhooks.
 * No external dependencies — uses Node.js built-in fetch with manual multipart/form-data.
 */

const WEBHOOK_URL_PATTERN = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//;

/**
 * Send an ICS file with a rich embed to a Discord webhook.
 * @param {object} options
 * @param {string} options.webhookUrl - Discord webhook URL
 * @param {string} options.icsContent - ICS file content string
 * @param {string} options.filename - Filename for the ICS attachment (e.g., "event.ics")
 * @param {object} options.embed - Discord embed object
 * @param {Buffer|null} [options.imageBuffer] - Optional banner image as Buffer
 * @param {string} [options.imageFilename] - Image filename (e.g., "banner.png")
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function sendWebhookWithIcs({ webhookUrl, icsContent, filename, embed, imageBuffer, imageFilename, iconBuffer, iconFilename, avatarUrl }) {
  if (!webhookUrl || !WEBHOOK_URL_PATTERN.test(webhookUrl)) {
    return { ok: false, error: "Invalid webhook URL." };
  }
  if (!icsContent) {
    return { ok: false, error: "No ICS content provided." };
  }

  const boundary = `----WebhookBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;

  const payload = {
    embeds: [embed],
    username: "VRC Event Creator",
    ...(avatarUrl ? { avatar_url: avatarUrl } : {})
  };

  // Build multipart body as array of Buffer chunks for binary safety
  const chunks = [];
  const str = s => Buffer.from(s, "utf8");

  // Part 1: JSON payload
  chunks.push(str(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="payload_json"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(payload)}\r\n`
  ));

  // Part 2: ICS file
  chunks.push(str(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files[0]"; filename="${sanitizeFilename(filename)}"\r\n` +
    `Content-Type: text/calendar; charset=utf-8\r\n\r\n` +
    `${icsContent}\r\n`
  ));

  // Part 3: Banner image (optional)
  let fileIndex = 1;
  if (imageBuffer && imageFilename) {
    chunks.push(str(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="files[${fileIndex}]"; filename="${sanitizeFilename(imageFilename)}"\r\n` +
      `Content-Type: image/png\r\n\r\n`
    ));
    chunks.push(imageBuffer);
    chunks.push(str("\r\n"));
    fileIndex++;
  }

  // Part 4: Group icon (optional)
  if (iconBuffer && iconFilename) {
    chunks.push(str(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="files[${fileIndex}]"; filename="${sanitizeFilename(iconFilename)}"\r\n` +
      `Content-Type: image/png\r\n\r\n`
    ));
    chunks.push(iconBuffer);
    chunks.push(str("\r\n"));
  }

  chunks.push(str(`--${boundary}--\r\n`));

  const body = Buffer.concat(chunks);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { ok: false, error: formatWebhookError(response.status, errorData) };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Could not reach Discord webhook: ${err.message}` };
  }
}

/**
 * Test a webhook URL by fetching its info (GET request).
 * @param {string} webhookUrl - Discord webhook URL
 * @returns {Promise<{ok: boolean, webhookName?: string, error?: string}>}
 */
async function testWebhook(webhookUrl) {
  if (!webhookUrl) {
    return { ok: false, error: "No webhook URL provided." };
  }
  if (!WEBHOOK_URL_PATTERN.test(webhookUrl)) {
    return { ok: false, error: "Invalid webhook URL format. Must be a Discord webhook URL." };
  }

  try {
    const response = await fetch(webhookUrl, { method: "GET" });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { ok: false, error: formatWebhookError(response.status, errorData) };
    }

    const data = await response.json();
    return { ok: true, webhookName: data.name || "Unknown" };
  } catch (err) {
    return { ok: false, error: `Could not reach Discord webhook: ${err.message}` };
  }
}

/**
 * Sanitize a filename for use in Content-Disposition headers.
 */
function sanitizeFilename(name) {
  if (!name) return "file";
  return name.replace(/["\\\r\n]/g, "_");
}

/**
 * Format a Discord webhook error into a user-friendly message.
 */
function formatWebhookError(status, errorData) {
  const detail = errorData?.message || "";
  switch (status) {
    case 401: return "Webhook token is invalid.";
    case 403: return "Webhook lacks permission to post in this channel.";
    case 404: return "Webhook not found. It may have been deleted.";
    case 429: return "Discord rate limit hit. Try again later.";
    default: return `Discord webhook error ${status}${detail ? `: ${detail}` : ""}`;
  }
}

module.exports = {
  sendWebhookWithIcs,
  testWebhook
};
