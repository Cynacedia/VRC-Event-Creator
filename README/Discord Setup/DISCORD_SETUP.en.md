# Discord Integration Setup Guide

This guide walks you through setting up the Discord integration for VRC Event Creator. Once configured, creating a VRChat event will automatically create a matching **Discord Event** in your server.

---

## Overview

The integration uses a **Discord bot** that you create and control. The bot only needs one permission: **Create Events**. It does not read messages, join voice channels, or do anything else. Your bot token is encrypted and stored locally on your machine — it is never sent anywhere except to Discord's API when creating events.

Each VRChat group can be linked to one Discord server. You can reuse the same bot across multiple groups/servers, or use separate bots — it's up to you.

---

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** in the top right
3. Give it a name and click **Create**

## Step 2: Create the Bot

1. In your new application, click **"Bot"** in the left sidebar
2. Under the **Token** section, click **"Reset Token"** (or **"Copy"** if the token is still visible)
3. **Copy the token immediately** — you won't be able to see it again. If you lose it, you'll need to reset it
4. (Optional) Under **Privileged Gateway Intents**, you can leave everything off — the bot doesn't need any intents

> **Keep your bot token private.** Anyone with the token can act as your bot. If you accidentally share it, reset it immediately in the Developer Portal.

## Step 3: Invite the Bot to Your Server

1. In the Developer Portal, click **"OAuth2"** in the left sidebar
2. Scroll down to **"OAuth2 URL Generator"**
3. Under **Scopes**, check **`bot`**
4. Under **Bot Permissions**, check **`Create Events`** — this is the only permission needed
5. Copy the generated URL at the bottom
6. Open the URL in your browser and select the Discord server you want to add the bot to
7. Click **Authorize**

The bot will appear in your server's member list but will remain offline (it doesn't need to be "running" — VRC Event Creator calls Discord's API directly using the bot token).

## Step 4: Get Your Server ID

1. In Discord, go to **User Settings** (gear icon near your username)
2. Go to **Advanced** and enable **Developer Mode**
3. Close settings, then **right-click your server name** in the server list
4. Click **"Copy Server ID"**

The Server ID is a long number like `123456789012345678`.

## Step 5: Configure in VRC Event Creator

1. Open VRC Event Creator and go to **Settings**
2. Scroll down to **Advanced Options**
3. Check **"Enable Discord integration"**
4. Select the **VRChat group** you want to link
5. Paste your **Bot Token** into the Bot Token field
6. Paste your **Server ID** into the Server ID field
7. Click **"Verify Bot Token"** to confirm the token is valid — this connects to Discord and verifies the bot exists
8. Click **"Save"**

## Step 6: Per-Template Sync Toggle

Each event template has a **"Sync to Discord"** toggle in the profile editor (Step 3 of the template wizard). This is enabled by default when Discord integration is active. Disable it for templates you don't want to post to Discord.

---

## How It Works

When you create a VRChat event (manually or via automation), the app:

1. Creates the VRChat event as normal
2. Checks if Discord integration is enabled for that group
3. Checks if the template has "Sync to Discord" enabled
4. Creates a Discord Event with:
   - **Title** from the VRChat event name
   - **Description** from the VRChat event description
   - **Start/End times** matching the VRChat event
   - **Location** set to "VRChat"
   - **Cover image** from the VRChat event (if available)
5. Shows a notification confirming the Discord event was created

**Discord sync never blocks VRChat event creation.** If the Discord API is down or the bot token is invalid, the VRChat event still gets created — you'll just see an error notification about the Discord side.

---

## FAQ

### Can I use a bot I already have?

Yes, as long as it has the **Create Events** permission in the target server. You can use the same bot token for multiple groups/servers.

### Can I use the same bot for multiple groups?

Yes. Just paste the same bot token for each group and set the appropriate Server ID. The Server ID is what tells the app which Discord server to post to.

### What if I share event creation duties with other staff?

Each person who creates events needs the bot token configured on their machine. Options:
- **Share the token** with trusted staff (they'll have the same bot permissions)
- **Have one person manage Discord sync** while others create events with "Sync to Discord" disabled
- **Create separate bots** for different staff members if you want to track who created what

### What permissions does the bot need?

Only **Create Events**. The bot doesn't need to read messages, manage the server, or have any other permissions.

### Is my bot token safe?

Your bot token is encrypted using your operating system's secure storage (Windows DPAPI / macOS Keychain / Linux Secret Service) and stored locally in your profiles data. It is never sent anywhere except directly to Discord's API.

### The bot shows as offline — is that normal?

Yes. The bot doesn't maintain a persistent connection to Discord. VRC Event Creator makes direct API calls using the bot token when needed. The bot will always appear offline and that's fine.

### What happens if Discord sync fails?

Your VRChat event is still created successfully. You'll see an error notification explaining what went wrong (invalid token, missing permissions, rate limit, etc.). You can then fix the issue and the next event will sync normally.

### Can I delete Discord events from the app?

No, the app only creates them. Discord Events can be managed directly in Discord. 

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Invalid bot token" | Reset the token in the Developer Portal and paste the new one |
| "Bot lacks permission to create events" | Reinvite the bot with the Create Events permission, or add the permission via Server Settings > Roles |
| "Discord server not found" | Double-check the Server ID (right-click server name > Copy Server ID) |
| "Discord rate limit hit" | Wait a minute and try again. This happens if too many events are created in quick succession |
| Bot token field says "Verify Bot Token" fails | Make sure you copied the full token with no extra spaces |
| Events created in VRChat but not in Discord | Check that "Sync to Discord" is enabled on the template and that the group has a valid bot token + server ID saved |
