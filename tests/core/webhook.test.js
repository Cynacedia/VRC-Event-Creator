// URL validation is the SSRF-prevention surface for webhook posts. Both
// sendWebhook and testWebhook reject non-Discord URLs *before* any fetch
// happens — these tests confirm that without touching the network.
//
// Payload-building tests mock `fetch` and assert on what *would* have been
// sent (per the project's no-real-APIs rule).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendWebhook, testWebhook } from "../../electron/core/webhook.js";

const VALID_URL =
  "https://discord.com/api/webhooks/123456789012345678/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("URL validation — SSRF prevention", () => {
  it("sendWebhook rejects empty/null/undefined", async () => {
    expect(await sendWebhook({ webhookUrl: "" })).toEqual({
      ok: false, error: "Invalid webhook URL.",
    });
    expect(await sendWebhook({ webhookUrl: null })).toEqual({
      ok: false, error: "Invalid webhook URL.",
    });
    expect(await sendWebhook({})).toEqual({
      ok: false, error: "Invalid webhook URL.",
    });
  });

  it("sendWebhook rejects non-Discord hosts", async () => {
    const bad = [
      "https://example.com/api/webhooks/1/abc",
      "https://discord.example.com/api/webhooks/1/abc",
      "https://evil.com/discord.com/api/webhooks/1/abc",
      "https://api.discord.com/webhooks/1/abc", // wrong subdomain
      "http://discord.com/api/webhooks/1/abc",  // not https
      "https://discord.com/webhooks/1/abc",      // missing /api
    ];
    for (const url of bad) {
      expect(await sendWebhook({ webhookUrl: url })).toEqual({
        ok: false, error: "Invalid webhook URL.",
      });
    }
  });

  it("sendWebhook accepts the canonical discord.com / discordapp.com forms", async () => {
    // Mock fetch so it doesn't actually go out.
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    try {
      const r1 = await sendWebhook({ webhookUrl: VALID_URL });
      const r2 = await sendWebhook({
        webhookUrl: VALID_URL.replace("discord.com", "discordapp.com"),
      });
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("testWebhook rejects empty and non-Discord URLs (with distinct error)", async () => {
    expect(await testWebhook("")).toEqual({
      ok: false, error: "No webhook URL provided.",
    });
    expect(await testWebhook("https://example.com/api/webhooks/1/abc")).toEqual({
      ok: false, error: "Invalid webhook URL format. Must be a Discord webhook URL.",
    });
  });
});

describe("payload building (mocked fetch)", () => {
  let fetchSpy;
  let lastCall;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url, init) => {
      lastCall = { url, init };
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    lastCall = null;
  });

  // Pull the JSON payload out of the multipart body so we can assert against it.
  function getPayload() {
    const body = lastCall.init.body.toString("utf8");
    const m = body.match(/Content-Type: application\/json\r\n\r\n([\s\S]*?)\r\n--/);
    return m ? JSON.parse(m[1]) : null;
  }

  it("posts to the supplied URL with multipart/form-data", async () => {
    await sendWebhook({ webhookUrl: VALID_URL, content: "hello" });
    expect(lastCall.url).toBe(VALID_URL);
    expect(lastCall.init.method).toBe("POST");
    expect(lastCall.init.headers["Content-Type"]).toMatch(
      /^multipart\/form-data; boundary=----WebhookBoundary/
    );
  });

  it("defaults username to 'VRC Event Creator'", async () => {
    await sendWebhook({ webhookUrl: VALID_URL, content: "hi" });
    expect(getPayload()).toMatchObject({ username: "VRC Event Creator", content: "hi" });
  });

  it("uses webhookName override when provided", async () => {
    await sendWebhook({ webhookUrl: VALID_URL, webhookName: "Custom Bot" });
    expect(getPayload().username).toBe("Custom Bot");
  });

  it("includes an embed when provided", async () => {
    const embed = { title: "Event!", description: "Tonight" };
    await sendWebhook({ webhookUrl: VALID_URL, embed });
    expect(getPayload().embeds).toEqual([embed]);
  });

  it("includes avatar_url when provided", async () => {
    await sendWebhook({
      webhookUrl: VALID_URL,
      avatarUrl: "https://cdn.example.com/avatar.png",
    });
    expect(getPayload().avatar_url).toBe("https://cdn.example.com/avatar.png");
  });

  it("omits content/embeds/avatar_url when not provided", async () => {
    await sendWebhook({ webhookUrl: VALID_URL });
    const payload = getPayload();
    expect(payload).not.toHaveProperty("content");
    expect(payload).not.toHaveProperty("embeds");
    expect(payload).not.toHaveProperty("avatar_url");
  });

  it("attaches an ICS file when icsContent + filename are provided", async () => {
    await sendWebhook({
      webhookUrl: VALID_URL,
      icsContent: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
      filename: "event.ics",
    });
    const body = lastCall.init.body.toString("utf8");
    expect(body).toMatch(/Content-Disposition: form-data; name="files\[0\]"; filename="event\.ics"/);
    expect(body).toContain("Content-Type: text/calendar; charset=utf-8");
    expect(body).toContain("BEGIN:VCALENDAR");
  });

  it("sanitizes dangerous characters out of attachment filenames", async () => {
    await sendWebhook({
      webhookUrl: VALID_URL,
      icsContent: "x",
      filename: 'evil"\\name\r\n.ics',
    });
    const body = lastCall.init.body.toString("utf8");
    // Quotes, backslashes, CR, LF must be neutralized to underscores
    expect(body).toMatch(/filename="evil_+name_+\.ics"/);
    expect(body).not.toMatch(/filename="evil"/); // no broken quote
  });
});

describe("error path mapping", () => {
  let fetchSpy;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => fetchSpy.mockRestore());

  it("formats a 401 as 'Webhook token is invalid.'", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    const result = await sendWebhook({ webhookUrl: VALID_URL });
    expect(result).toEqual({ ok: false, error: "Webhook token is invalid." });
  });

  it("formats a 404 as 'Webhook not found...'", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    const result = await sendWebhook({ webhookUrl: VALID_URL });
    expect(result.error).toMatch(/Webhook not found/);
  });

  it("formats a 429 as a rate-limit hint", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    const result = await sendWebhook({ webhookUrl: VALID_URL });
    expect(result.error).toMatch(/rate limit/i);
  });

  it("falls back to 'Could not reach' when fetch throws", async () => {
    fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await sendWebhook({ webhookUrl: VALID_URL });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Could not reach Discord webhook: ECONNREFUSED/);
  });
});
