# Discord Integration Setup Guide

This guide walks you through setting up the Discord integration for VRC Event Creator. Once configured, creating a VRChat event will automatically create a matching **Discord Event** in your server.

---

## Overview

The integration uses a **Discord bot** that you create and control. It only needs one permission: **Create Events**. It does not read messages, join voice channels, or do anything else. Your bot token is encrypted and stored locally — it is never sent anywhere except to Discord's API when creating events.

Each VRChat group can be linked to one Discord server. You can reuse the same bot across multiple groups/servers, or use separate bots.

---

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** in the top right
3. Give it a name and click **Create**

## Step 2: Create the Bot

1. Click **"Bot"** in the left sidebar
2. Click **"Reset Token"** (or **"Copy"** if the token is still visible)
3. **Copy the token immediately** - you won't be able to see it again
4. Leave Privileged Gateway Intents off - the bot doesn't need any

> **Keep your bot token private.** Anyone with the token can act as your bot. If you accidentally share it, reset it immediately in the Developer Portal.

## Step 3: Invite the Bot to Your Server

1. Click **"OAuth2"** in the left sidebar
2. Scroll to **"OAuth2 URL Generator"**
3. Under **Scopes**, check **`bot`**
4. Under **Bot Permissions**, check **`Create Events`**
5. Copy the generated URL at the bottom, open it in your browser, select your server, and authorize

The bot will appear in your member list but will stay offline - it doesn't need to be "running." The app calls Discord's API directly using the token.

## Step 4: Get Your Server ID

1. In Discord, go to **User Settings** > **Advanced** and enable **Developer Mode**
2. Right-click your server name and click **"Copy Server ID"**

## Step 5: Configure in VRC Event Creator

1. Open **Settings** > **Advanced Options** > check **"Enable Discord integration"**
2. Select the VRChat group you want to link, enter your bot token and server ID, then save
3. Use **"Verify Bot Token"** to confirm the token works

Each event template has a **"Sync to Discord"** toggle in the Basics tab. This is enabled by default when Discord integration is active. You can then toggle it to disable it for events you don't want to post to Discord.

**Discord sync never blocks VRChat event creation.** If anything goes wrong on the Discord side, your VRChat event still gets created normally.

---

## FAQ

### Can I use a bot I already have?

Yes, as long as it has the **Create Events** permission in the target server.

### What if I share event creation duties with other staff?

Each person who creates events needs the bot token on their machine. Options:
- **Share the token** with trusted staff
- **Have one person manage Discord sync** while others disable "Sync to Discord"
- **Create separate bots** per staff member

### Is my bot token safe?

Your bot token is encrypted using your OS's secure storage (Windows DPAPI / macOS Keychain / Linux Secret Service) and stored locally. It is never sent anywhere except Discord's API.

### Can I delete Discord events from the app?

No, the app only creates them. Manage Discord Events directly in Discord.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Invalid bot token" | Reset the token in the Developer Portal and paste the new one |
| "Bot lacks permission to create events" | Reinvite the bot with Create Events permission, or add it via Server Settings > Roles |
| "Discord server not found" | Double-check the Server ID (right-click server > Copy Server ID) |
| "Discord rate limit hit" | Wait a minute and try again |
| Events created in VRChat but not in Discord | Check that "Sync to Discord" is enabled and the group has a valid bot token + server ID |
