# Demo App (Translation Sandbox)

This demo runs a fully mocked version of the app for translation review and edge-case QA. It resets on every launch and never calls the VRChat API.

## Launch
- `npm run start:demo`

## Build Demo EXE
- `npm run dist:demo`
- Output goes to `dist-demo/` and is labeled `DEMO`.

## Notes
- Login is mocked. Any credentials work. Use a username containing `2fa` to trigger the 2FA flow.
- Settings > Demo Controls lets you toggle "Force Update Required" to preview update-gating strings.
- Gallery upload cycles through success + error cases on each attempt.

## Groups
- Default Showcase: published event + pending cards (missed, queued, pending).
- Conflict Lab: always triggers conflict warnings; includes a pre-existing event.
- Rate Limit Lab: always returns a 429 on event creation.
- Automation (Before/After/Monthly): pre-seeded pending automations.
- Custom Sandbox: profiles and events are editable for free-form testing.
