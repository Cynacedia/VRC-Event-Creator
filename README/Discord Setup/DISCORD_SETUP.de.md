# Einrichtungsanleitung für die Discord-Integration

Diese Anleitung führt dich durch die Einrichtung der Discord-Integration für VRC Event Creator. Sobald alles konfiguriert ist, wird beim Erstellen eines VRChat-Events automatisch ein passendes **Discord-Event** auf deinem Server erstellt.

---

## Überblick

Die Integration nutzt einen **Discord-Bot**, den du selbst erstellst und kontrollierst. Er benötigt nur eine einzige Berechtigung: **Events erstellen**. Er liest keine Nachrichten, betritt keine Sprachkanäle und tut auch sonst nichts. Dein Bot-Token wird verschlüsselt und lokal gespeichert — es wird ausschließlich an die Discord-API gesendet, um Events zu erstellen.

Jede VRChat-Gruppe kann mit einem Discord-Server verknüpft werden. Du kannst denselben Bot für mehrere Gruppen/Server verwenden oder separate Bots nutzen.

---

## Schritt 1: Discord-Anwendung erstellen

1. Öffne das [Discord Developer Portal](https://discord.com/developers/applications)
2. Klicke oben rechts auf **„New Application"**
3. Vergib einen Namen und klicke auf **Create**

## Schritt 2: Bot erstellen

1. Klicke in der linken Seitenleiste auf **„Bot"**
2. Klicke auf **„Reset Token"** (oder **„Copy"**, falls der Token noch sichtbar ist)
3. **Kopiere den Token sofort** — du kannst ihn danach nicht mehr einsehen
4. Lass die Privileged Gateway Intents deaktiviert — der Bot benötigt keine

> **Halte deinen Bot-Token geheim.** Jeder, der den Token hat, kann in deinem Namen handeln. Solltest du ihn versehentlich teilen, setze ihn sofort im Developer Portal zurück.

## Schritt 3: Bot auf deinen Server einladen

1. Klicke in der linken Seitenleiste auf **„OAuth2"**
2. Scrolle zu **„OAuth2 URL Generator"**
3. Aktiviere unter **Scopes** das Kontrollkästchen **`bot`**
4. Aktiviere unter **Bot Permissions** das Kontrollkästchen **`Create Events`**
5. Kopiere die generierte URL unten, öffne sie im Browser, wähle deinen Server aus und autorisiere den Bot

Der Bot erscheint in deiner Mitgliederliste, bleibt aber offline — er muss nicht „laufen." Die App kommuniziert direkt über den Token mit der Discord-API.

## Schritt 4: Server-ID herausfinden

1. Gehe in Discord zu **Benutzereinstellungen** > **Erweitert** und aktiviere den **Entwicklermodus**
2. Rechtsklicke auf deinen Servernamen und wähle **„Server-ID kopieren"**

## Schritt 5: In VRC Event Creator konfigurieren

1. Öffne **Einstellungen** > **Erweiterte Optionen** > aktiviere **„Discord-Integration aktivieren"**
2. Wähle die VRChat-Gruppe aus, die du verknüpfen möchtest, gib deinen Bot-Token und die Server-ID ein und speichere
3. Nutze **„Bot-Token überprüfen"**, um sicherzustellen, dass der Token funktioniert

Jede Event-Vorlage hat im Reiter „Basics" einen **„Mit Discord synchronisieren"**-Schalter. Dieser ist standardmäßig aktiviert, wenn die Discord-Integration aktiv ist. Du kannst ihn für Events deaktivieren, die nicht auf Discord gepostet werden sollen.

**Die Discord-Synchronisierung blockiert niemals die VRChat-Event-Erstellung.** Sollte auf der Discord-Seite etwas schiefgehen, wird dein VRChat-Event trotzdem ganz normal erstellt.

---

## FAQ

### Kann ich einen bereits vorhandenen Bot verwenden?

Ja, solange er die Berechtigung **Events erstellen** auf dem Zielserver hat.

### Was, wenn mehrere Teammitglieder Events erstellen?

Jede Person, die Events erstellt, braucht den Bot-Token auf ihrem Rechner. Möglichkeiten:
- **Token mit vertrauenswürdigen Teammitgliedern teilen**
- **Eine Person verwaltet die Discord-Synchronisierung**, während andere „Mit Discord synchronisieren" deaktivieren
- **Separate Bots** pro Teammitglied erstellen

### Ist mein Bot-Token sicher?

Dein Bot-Token wird über den sicheren Speicher deines Betriebssystems verschlüsselt (Windows DPAPI / macOS Keychain / Linux Secret Service) und lokal gespeichert. Er wird ausschließlich an die Discord-API gesendet.

### Kann ich Discord-Events über die App löschen?

Nein, die App erstellt sie nur. Verwalte Discord-Events direkt in Discord.

---

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| „Ungültiger Bot-Token" | Setze den Token im Developer Portal zurück und füge den neuen ein |
| „Bot hat keine Berechtigung, Events zu erstellen" | Lade den Bot erneut mit der Berechtigung „Events erstellen" ein, oder füge sie über Servereinstellungen > Rollen hinzu |
| „Discord-Server nicht gefunden" | Überprüfe die Server-ID (Rechtsklick auf Server > Server-ID kopieren) |
| „Discord-Ratenlimit erreicht" | Warte eine Minute und versuche es erneut |
| Events wurden in VRChat erstellt, aber nicht in Discord | Prüfe, ob „Mit Discord synchronisieren" aktiviert ist und die Gruppe einen gültigen Bot-Token + Server-ID hat |
