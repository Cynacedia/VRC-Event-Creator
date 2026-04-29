# Einrichtungsanleitung für die Kalender-Integration

Diese Anleitung führt dich durch die Einrichtung der Kalenderdatei-Erstellung (.ics), der Discord-Webhook-Zustellung und der Discord-Events in VRC Event Creator. Diese drei Funktionen sind vollständig unabhängig — aktiviere jede beliebige Kombination, die zu deinem Workflow passt.

---

## Überblick

VRC Event Creator bietet drei Aktionen nach der Erstellung, wenn du ein VRChat-Event erstellst oder automatisierst. Jede kann unabhängig pro Vorlage und pro Event ein- oder ausgeschaltet werden:

- **„.ics-Kalendereinladung erstellen"** — Erstellt eine standardkonforme `.ics`-Kalenderdatei mit optionalen Erinnerungen, automatisch in ein lokales Verzeichnis gespeichert
- **„Discord-Webhook senden"** — Postet eine Ankündigung in einen Discord-Kanal via Webhook (mit optionalem `.ics`-Anhang, wenn Kalender ebenfalls aktiviert ist)
- **„Discord-Event erstellen"** — Erstellt ein geplantes Event auf deinem Discord-Server via Bot

Wenn mehrere Funktionen aktiviert sind, ergänzen sie sich automatisch:

| Discord-Event | Webhook | Kalender (.ics) | Was passiert |
|---|---|---|---|
| AN | AUS | AUS | Nur Discord-Event wird erstellt |
| AUS | AN | AUS | Webhook postet Embed mit Eventdetails |
| AUS | AUS | AN | `.ics`-Datei wird im lokalen Verzeichnis gespeichert |
| AN | AN | AUS | Discord-Event erstellt + Webhook postet Event-Link |
| AN | AUS | AN | Discord-Event erstellt + `.ics` gespeichert |
| AUS | AN | AN | Webhook postet Embed + `.ics` angehängt, ebenfalls gespeichert |
| AN | AN | AN | Discord-Event + Webhook mit Event-Link + `.ics` angehängt + gespeichert |

---

## Schritt 1: Kalenderdatei-Erstellung aktivieren

1. Öffne **Einstellungen** > **Erweiterte Einstellungen**
2. Aktiviere **„Kalenderdatei-Erstellung aktivieren"**

Dadurch wird der Schalter **„.ics-Kalendereinladung erstellen"** in Vorlagen und bei der Event-Erstellung verfügbar.

### Speicherverzeichnis

Wenn die Kalenderdatei-Erstellung aktiviert ist, werden `.ics`-Dateien immer in einem lokalen Verzeichnis gespeichert. Der Standardspeicherort ist `Documents/VRC Event Creator .ics/` und wird beim ersten Speichern erstellt.

Dateien werden als `{Verzeichnis}/{Gruppenname}/{Eventname - Datum}.ics` gespeichert. Um den Speicherort zu ändern, verwende die Schaltfläche **Ändern** neben **Kalender-Speicherverzeichnis** unter **Einstellungen** > **Anwendungsinfo**.

---

## Schritt 2: Discord-Webhook konfigurieren (optional)

Ein Webhook postet Ankündigungen in einen bestimmten Discord-Kanal. Dies ist unabhängig von Kalenderdateien und Discord-Events — du kannst es mit oder ohne beide verwenden.

1. Klicke in Discord mit der rechten Maustaste auf den Kanal, in den Ankündigungen gepostet werden sollen
2. Klicke auf **Kanal bearbeiten** > **Integrationen** > **Webhooks** > **Neuer Webhook**
3. Kopiere die Webhook-URL
4. Gehe in VRC Event Creator zu **Einstellungen** > **Discord-Integration** > wähle deine Gruppe aus
5. Aktiviere **„Webhook aktivieren"** und füge die Webhook-URL ein
6. Klicke auf **Webhook testen**, um die Verbindung zu überprüfen, dann auf **Speichern**

Wenn sowohl Webhook als auch Kalender für ein Event aktiviert sind, wird die `.ics`-Datei an den Webhook-Post angehängt. Wenn nur der Webhook aktiviert ist (ohne Kalender), postet der Webhook ein Embed mit Eventdetails ohne `.ics`-Anhang.

Wenn auch ein Discord-Event erstellt wurde, enthält die Webhook-Nachricht den Discord-Event-Link anstelle eines Embeds.

---

## Schritt 3: Vorlagen konfigurieren

1. Gehe zu **Vorlagen verwalten** und bearbeite (oder erstelle) eine Vorlage
2. Im Reiter **Grundlagen** siehst du bis zu drei Posting-Schalter (abhängig von der Konfiguration):
   - **„.ics-Kalendereinladung erstellen"** — sichtbar, wenn die Kalenderdatei-Erstellung aktiviert ist
   - **„Discord-Event erstellen"** — sichtbar, wenn ein Discord-Bot für die Gruppe konfiguriert ist
   - **„Discord-Webhook senden"** — sichtbar, wenn eine Webhook-URL für die Gruppe konfiguriert ist
3. Aktiviere die gewünschten Optionen für diese Vorlage
4. Wenn Kalender aktiviert ist, zeigt der Reiter **Zeitplan** eine Karte **„.ics-Kalendererinnerungen"**
5. Aktiviere **„.ics-Kalendererinnerungen aktivieren"** und füge deine bevorzugten Erinnerungsintervalle hinzu
6. Speichere die Vorlage

Erinnerungen verwenden voreingestellte Intervalle, die mit allen gängigen Kalender-Apps kompatibel sind: 5 Min., 10 Min., 15 Min., 30 Min., 1 Stunde, 2 Stunden, 4 Stunden, 8 Stunden, 12 Stunden, 1 Tag, 2 Tage, 1 Woche.

> **Hinweis:** Einige Kalender-Apps (wie Outlook) verwenden nur die erste Erinnerung. Die längste Erinnerung wird für optimale Kompatibilität zuerst platziert. Google Calendar ignoriert benutzerdefinierte Erinnerungen beim Import und verwendet stattdessen deine Standard-Benachrichtigungseinstellungen.

---

## Schritt 4: Events erstellen

Beim Erstellen eines Events (manuell oder per Automatisierung):

- Im Schritt **Datum** gibt es den Schalter **„.ics-Kalendereinladung erstellen"** (übernommen aus der Vorlage, überschreibbar)
- Darunter kannst du mit **„.ics-Kalendererinnerungen aktivieren"** die Erinnerungen pro Event anpassen
- Im Schritt **Einzelheiten** gibt es **„Discord-Event erstellen"** und **„Discord-Webhook senden"** als separate Schalter
- Alle Einstellungen aus der Vorlage können pro Event überschrieben werden

---

## FAQ

### Welche Kalender-Apps unterstützen .ics-Dateien?

Alle gängigen Kalender-Apps: Outlook, Apple Calendar, Google Calendar, Thunderbird und jede App, die den iCalendar-Standard unterstützt.

### Funktionieren Erinnerungen in allen Kalender-Apps?

Mehrere Erinnerungen funktionieren in Apple Calendar und Thunderbird. Outlook verwendet nur die erste Erinnerung. Google Calendar ignoriert Erinnerungen beim Import vollständig.

### Kann ich Webhooks ohne Kalenderdateien verwenden?

Ja. Der Webhook postet ein Embed mit Eventdetails, auch wenn die Kalenderdatei-Erstellung deaktiviert ist. Aktiviere „Discord-Webhook senden" in deiner Vorlage, ohne „.ics-Kalendereinladung erstellen" zu aktivieren.

### Kann ich Webhooks ohne Discord-Event-Erstellung verwenden?

Ja. Der Webhook, Discord-Events und Kalenderdateien sind vollständig unabhängig. Jede Kombination funktioniert.

### Ist die Webhook-URL vertraulich?

Ja — jeder mit der Webhook-URL kann Nachrichten in diesen Kanal senden. Behandle sie wie ein Passwort. Sie wird verschlüsselt und über den sicheren Speicher deines Betriebssystems lokal gespeichert.

---

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| Keine .ics-Datei erstellt | Prüfe, ob „Kalenderdatei-Erstellung aktivieren" in den Erweiterten Einstellungen aktiviert ist und „.ics-Kalendereinladung erstellen" in der Vorlage oder im Event angehakt ist |
| Webhook postet nicht | Überprüfe die Webhook-URL mit „Webhook testen" in den Discord-Einstellungen. Stelle sicher, dass „Webhook aktivieren" für die Gruppe eingeschaltet und „Discord-Webhook senden" in der Vorlage angehakt ist |
| Webhook postet, aber ohne .ics-Anhang | „.ics-Kalendereinladung erstellen" muss ebenfalls für das Event aktiviert sein. Ohne diese Option postet der Webhook nur ein Embed oder einen Event-Link |
| Erinnerungen funktionieren nicht in Outlook | Outlook unterstützt nur die erste Erinnerung. Die App sortiert die längste zuerst für optimale Kompatibilität |
| Erinnerungen funktionieren nicht in Google Calendar | Google Calendar ignoriert benutzerdefinierte Erinnerungen beim .ics-Import. Stelle Erinnerungen nach dem Import manuell ein |
| Dateien werden am falschen Ort gespeichert | Dateien werden unter `{Speicherverz.}/{Gruppenname}/` gespeichert. Standard ist `Documents/VRC Event Creator .ics/`. Änderbar über Einstellungen > Anwendungsinfo |
