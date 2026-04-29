# Calendar Integration Setup Guide

This guide walks you through setting up calendar file (.ics) generation, Discord webhook posting, and Discord scheduled events in VRC Event Creator. These three features are fully independent — enable any combination that fits your workflow.

---

## Overview

VRC Event Creator offers three post-creation actions when you create or automate a VRChat event. Each is independently toggled per template and per event:

- **Create .ics Calendar Invite** — Generates a standard `.ics` calendar file with optional reminders, auto-saved to a local directory
- **Post Discord Webhook** — Posts an announcement to a Discord channel via webhook (with optional `.ics` attachment if calendar is also enabled)
- **Create Discord Event** — Creates a scheduled event in your Discord server via bot

When multiple features are enabled, they compose naturally:

| Discord Event | Webhook | Calendar (.ics) | What happens |
|---|---|---|---|
| ON | OFF | OFF | Discord scheduled event created only |
| OFF | ON | OFF | Webhook posts embed with event details |
| OFF | OFF | ON | `.ics` file auto-saved to local directory |
| ON | ON | OFF | Discord event created + webhook posts event link |
| ON | OFF | ON | Discord event created + `.ics` auto-saved |
| OFF | ON | ON | Webhook posts embed + `.ics` attached, also auto-saved |
| ON | ON | ON | Discord event + webhook with event link + `.ics` attached + auto-saved |

---

## Step 1: Enable Calendar File Generation

1. Open **Settings** > **Advanced Options**
2. Check **"Enable calendar file generation"**

This makes the **"Create .ics Calendar Invite"** toggle available in templates and event creation.

### Auto-Save Directory

When calendar file generation is enabled, `.ics` files are always saved to a local directory. The default location is `Documents/VRC Event Creator .ics/` and is created on first save.

Files save as `{directory}/{Group Name}/{Event Name - Date}.ics`. To change the location, use the **Change** button next to **Calendar Save Directory** in **Settings** > **Application Info**.

---

## Step 2: Configure Discord Webhook (Optional)

A webhook posts announcements to a specific Discord channel. This is independent of calendar files and Discord events — you can use it with or without either.

1. In Discord, right-click the channel you want announcements posted to
2. Click **Edit Channel** > **Integrations** > **Webhooks** > **New Webhook**
3. Copy the webhook URL
4. In VRC Event Creator, go to **Settings** > **Discord Integration** > select your group
5. Check **"Enable Webhook"** and paste the webhook URL
6. Click **Test Webhook** to verify, then **Save**

When both webhook and calendar are enabled for an event, the `.ics` file is attached to the webhook post. When only webhook is enabled (no calendar), the webhook posts an embed with event details but no `.ics` attachment.

If a Discord scheduled event was also created, the webhook message includes the Discord event link instead of an embed.

---

## Step 3: Configure Templates

1. Go to **Templates** and edit (or create) a template
2. In the **Basics** tab, you'll see up to three posting toggles (depending on what's configured):
   - **Create .ics Calendar Invite** — visible when calendar file generation is enabled
   - **Create Discord Event** — visible when Discord bot is configured for the group
   - **Post Discord Webhook** — visible when a webhook URL is configured for the group
3. Enable the ones you want for this template
4. If calendar is enabled, the **Schedule** tab shows a **".ics Calendar Reminders"** card
5. Check **"Enable .ics Calendar Reminders"** and add your preferred reminder intervals
6. Save the template

Reminders use preset intervals compatible with all major calendar apps: 5 min, 10 min, 15 min, 30 min, 1 hour, 2 hours, 4 hours, 8 hours, 12 hours, 1 day, 2 days, 1 week.

> **Note:** Some calendar apps (like Outlook) only use the first reminder. The longest reminder is placed first for best compatibility. Google Calendar ignores custom reminders on import and uses your default notification settings instead.

---

## Step 4: Create Events

When creating an event (manually or via automation):

- The **Date** step shows **"Create .ics Calendar Invite"** (inherited from template, overridable)
- Below it, **"Enable .ics Calendar Reminders"** lets you customize reminders per event
- The **Details** step shows **"Create Discord Event"** and **"Post Discord Webhook"** as separate toggles
- All settings from the template can be overridden per event

---

## FAQ

### What calendar apps support .ics files?

All major calendar apps: Outlook, Apple Calendar, Google Calendar, Thunderbird, and any app that supports the iCalendar standard.

### Do reminders work in all calendar apps?

Multiple reminders work in Apple Calendar and Thunderbird. Outlook only uses the first reminder. Google Calendar ignores reminders on import entirely.

### Can I use webhooks without calendar files?

Yes. The webhook posts an embed with event details even when calendar file generation is disabled. Enable "Post Discord Webhook" in your template without enabling "Create .ics Calendar Invite."

### Can I use webhooks without Discord event creation?

Yes. The webhook, Discord events, and calendar files are fully independent. Any combination works.

### Is the webhook URL sensitive?

Yes — anyone with the webhook URL can post messages to that channel. Treat it like a password. It is encrypted and stored locally using your OS's secure storage.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| No .ics file generated | Check that "Enable calendar file generation" is on in Advanced Settings, and "Create .ics Calendar Invite" is checked in the template or event |
| Webhook not posting | Verify the webhook URL with "Test Webhook" in Discord settings. Check that "Enable Webhook" is on for the group and "Post Discord Webhook" is checked in the template |
| Webhook posts but no .ics attached | "Create .ics Calendar Invite" must also be enabled for the event. Without it, the webhook posts an embed or event link only |
| Reminders not working in Outlook | Outlook only supports the first reminder. The app sorts longest first for compatibility |
| Reminders not working in Google Calendar | Google Calendar ignores custom reminders on .ics import. Set reminders manually after importing |
| Files saving to wrong location | Files save to `{save dir}/{Group Name}/`. Default is `Documents/VRC Event Creator .ics/`. Change via Settings > Application Info |
