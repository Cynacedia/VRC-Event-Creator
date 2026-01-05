<h1 align="center">
  <img src="electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://img.shields.io/github/downloads/Cynacedia/VRC-Event-Creator/total?style=plastic&labelColor=555&color=blue" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="README.md">English</a> |
  <a href="README/README.fr.md">Français</a> |
  <a href="README/README.es.md">Español</a> |
  <a href="README/README.de.md">Deutsch</a> |
  <a href="README/README.ja.md">日本語</a> |
  <a href="README/README.zh.md">中文（简体）</a> |
  <a href="README/README.pt.md">Português</a> |
  <a href="README/README.ko.md">한국어</a> |
  <a href="README/README.ru.md">Русский</a>
</p>

An all-in-one event creation tool for VRChat that eliminates repetitive setup.
Create and save per-group event templates, generate upcoming event dates from simple recurring patterns, and auto-fill details instantly - perfect for quickly scheduling weekly meetups, watch parties, and community events.


<p align="center">
  <img src="README/.imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="Event creation flow (profile to publish)" />
</p>


## Features
- Profiles/templates that auto-fill event details per group.
- Recurring pattern generator with upcoming date lists and manual date/time fallback.
- Event creation wizard for group calendar events.
- Modify Events view for upcoming events (grid + edit modal).
- Theme Studio with presets and full UI color control (supports #RRGGBBAA).
- Gallery picker and upload for image IDs.
- Localization with first-run language selection (en, fr, es, de, ja, zh, pt, ko, ru).

## Download
- Releases: https://github.com/Cynacedia/VRC-Event-Creator/releases
- The Windows portable `.exe` runs standalone.

## Privacy & Data storage
Your password is not stored. Only session tokens are cached.
The app stores its files in the Electron user data directory (shown in the Settings > Application Info section):

- `profiles.json` (profile templates)
- `cache.json` (session tokens)
- `settings.json` (app settings)
- `themes.json` (theme presets and custom colors)

You can override the data directory with the `VRC_EVENT_DATA_DIR` environment variable.
On first launch, the app will try to import an existing `profiles.json` from the project folder.

__**Do not share cache files or application data folders.**__

## Usage notes
- Profiles require a Profile Name, Event Name, and Description before you can continue.
- Private groups can only use Access Type = Group.
- Duration uses DD:HH:MM and caps at 31 days.
- Tags are limited to 5 and languages are limited to 3.
- Gallery uploads are limited to PNG/JPG, 64-2048 px, under 10 MB, and 64 images per account.
- VRChat currently only allows up to 10 upcoming events at a time.

## Troubleshooting
- Login issues: delete `cache.json` and sign in again (use the data folder from About).
- Missing groups: your account must have calendar access in the target group.
- Rate limiting: VRChat may rate limit event creation. Wait and retry, and stop if several attempts fail. Do not spam refresh or event creation buttons.
- Updates: Some features are blocked when updates are pending. Download and run the latest release.

## Disclaimer
- This project is not affiliated with or endorsed by VRChat. Use at your own risk.
- Languages are machine translated and may be inaccurate, please contribute corrections.

## Requirements (building from source)
- Node.js 20+ (22.21.1 recommended)
- npm
- A VRChat account with permission to create events for at least one group


