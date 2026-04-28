# Calendar Integration Setup Guide

This guide walks you through setting up calendar file (.ics) generation and Discord webhook delivery for VRC Event Creator. Once configured, creating a VRChat event can automatically generate a calendar invite file and optionally post it to a Discord channel.

---

## Overview

The calendar integration creates standard `.ics` calendar files that can be imported into Outlook, Apple Calendar, Google Calendar, and other calendar apps. These files include the event details and optional reminders.

There are two delivery methods (mutually exclusive per event):

- **Discord Webhook** — Posts the `.ics` file to a Discord channel with an event embed or Discord event link
- **Auto-Save** — Saves the `.ics` file to a local directory automatically

If a Discord webhook is configured and the event is set to post to Discord, the webhook is used. Otherwise, files save to the configured local directory.

---

## Step 1: Enable Calendar File Generation

1. Open **Settings** > **Advanced Options**
2. Check **"Enable calendar file generation"**

This makes calendar options available in templates and event creation.

## Step 2: Configure Delivery Method

### Option A: Discord Webhook (Recommended)

A webhook posts the calendar file to a specific Discord channel. No bot is required for the webhook itself.

1. In Discord, right-click the channel you want calendar files posted to
2. Click **Edit Channel** > **Integrations** > **Webhooks** > **New Webhook**
3. Copy the webhook URL
4. In VRC Event Creator, go to **Settings** > **Discord Integration** > select your group
5. Check **"Post .ics to Discord"** and paste the webhook URL
6. Click **Test Webhook** to verify, then **Save**

If you also have Discord event creation set up (bot token), the webhook will post a link to the Discord event instead of a standalone embed. The `.ics` file is attached either way.

### Option B: Auto-Save to Local Directory

When no webhook is configured, `.ics` files save automatically to a local directory. The default location is `Documents/VRC Event Creator .ics/` and is created on first save.

Files save as `{directory}/{Group Name}/{Event Name - Date}.ics`. To change the location, use the **Change** button next to **Calendar Save Directory** in **Settings** > **Application Info**.

---

## Step 3: Configure Templates

1. Go to **Templates** and edit (or create) a template
2. In the **Basics** tab, check **"Create .ics Calendar Invite"**
3. In the **Schedule** tab, a new **".ics Calendar Reminders"** card appears
4. Check **"Enable .ics Calendar Reminders"** and add your preferred reminder intervals
5. Save the template

Reminders use preset intervals compatible with all major calendar apps: 5 min, 10 min, 15 min, 30 min, 1 hour, 2 hours, 4 hours, 8 hours, 12 hours, 1 day, 2 days, 1 week.

> **Note:** Some calendar apps (like Outlook) only use the first reminder. The longest reminder is placed first for best compatibility. Google Calendar ignores custom reminders on import and uses your default notification settings instead.

---

## Step 4: Create Events

When creating an event (manually or via automation):

- The **Date** step shows a **"Create .ics Calendar Invite"** toggle (inherited from the selected template, or configurable manually)
- Below it, **"Enable .ics Calendar Reminders"** lets you customize reminders per event
- The **Details** step shows **"Post to Discord"** which controls both the Discord event and webhook delivery

All settings from the template can be overridden per event.

---

## How It Works Together

| Discord Events | Webhook | Calendar | What happens on event creation |
|---|---|---|---|
| Enabled + configured | Configured | Enabled | Discord event created, webhook posts event link + .ics |
| Disabled or not configured | Configured | Enabled | Webhook posts embed with event details + .ics |
| Any | Not configured | Enabled | .ics file auto-saved to local directory |

---

## FAQ

### What calendar apps support .ics files?

All major calendar apps: Outlook, Apple Calendar, Google Calendar, Thunderbird, and any app that supports the iCalendar standard.

### Do reminders work in all calendar apps?

Multiple reminders work in Apple Calendar and Thunderbird. Outlook only uses the first reminder. Google Calendar ignores reminders on import entirely.

### Can I use webhooks without Discord event creation?

Yes. The webhook and bot token are independent features. You can use webhooks for calendar delivery without setting up a Discord bot.

### Is the webhook URL sensitive?

Yes — anyone with the webhook URL can post messages to that channel. Treat it like a password. It is encrypted and stored locally using your OS's secure storage.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| No .ics file generated | Check that "Enable calendar file generation" is on in Advanced Settings, and "Create .ics Calendar Invite" is checked in the template or event |
| Webhook not posting | Verify the webhook URL with "Test Webhook" in Discord settings. Check that "Post .ics to Discord" is enabled for the group |
| Reminders not working in Outlook | Outlook only supports the first reminder. The app sorts longest first for compatibility |
| Reminders not working in Google Calendar | Google Calendar ignores custom reminders on .ics import. Set reminders manually after importing |
| Files saving to wrong location | Files save to `{save dir}/{Group Name}/`. Default is `Documents/VRC Event Creator .ics/`. Change via Settings > Application Info |
