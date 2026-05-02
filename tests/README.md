# Tests

Unit and integration tests for VRC Event Creator. Run with:

```bash
npm test          # one-shot
npm run test:watch # re-run on save
```

## Structure

- `tests/core/` — pure-logic tests for `electron/core/*` modules (no I/O,
  no Electron, no network).
- `tests/fixtures/` — deterministic test data (sample events, sample
  recurrence rules, signed `.eckit` files generated from a test-only
  Ed25519 keypair).
- `tests/integration/` — IPC handler tests (no window required) — to come.

## Conventions

- **No real APIs, no real credentials, ever.** Mock the fetch/network
  boundary; assert on the payload that *would* have been sent. Same for
  VRChat SDK (stub the client) and Discord (stub the bot). See
  [feedback memory](../../.dev/i18n-audit/README.md) — same rule applies
  here.
- **Pure-logic first.** If a test needs to hit Electron's `app` module,
  filesystem outside `os.tmpdir()`, or real fs paths, it doesn't belong
  in `tests/core/` — move it to `tests/integration/`.
- **Golden tests over snapshot tests** for output formats (ICS strings,
  RRULE strings, webhook payloads). They're easier to review than
  snapshot diffs and self-document the expected output.

## Coverage targets (Phase 2)

- `core/ics.js` — ICS string output, escapes, reminders, recurrence
- `core/rrule.js` — VRChat recurrence → RFC 5545 RRULE conversion
- `core/date-utils.js` — pattern date generation, weekday math
- `core/webhook.js` — payload building (mock fetch boundary)
- `core/eckit.js` — Ed25519 verify (test-only keypair, fixture .eckit)
- `core/automation-engine.js` — `resolveEventDetails()` profile→event merging
- `electron/main.js` `normalizeSettings()` — type coercion, unknown-field rejection
- Series recurrence math in `electron/renderer/series.js`
