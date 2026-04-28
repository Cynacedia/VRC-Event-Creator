# Einrichtungsanleitung für die Kalender-Integration

Diese Anleitung führt dich durch die Einrichtung der Kalenderdatei-Erstellung (.ics) und der Discord-Webhook-Zustellung für VRC Event Creator. Nach der Konfiguration kann beim Erstellen eines VRChat-Events automatisch eine Kalendereinladung generiert und optional in einen Discord-Kanal gepostet werden.

---

## Überblick

Die Kalender-Integration erstellt standardkonforme `.ics`-Kalenderdateien, die in Outlook, Apple Calendar, Google Calendar und andere Kalender-Apps importiert werden können. Diese Dateien enthalten die Eventdetails und optionale Erinnerungen.

Es gibt zwei Zustellmethoden (pro Event nur eine möglich):

- **Discord-Webhook** — Postet die `.ics`-Datei in einen Discord-Kanal mit einem Event-Embed oder einem Discord-Event-Link
- **Automatisches Speichern** — Speichert die `.ics`-Datei automatisch in ein lokales Verzeichnis

Wenn ein Discord-Webhook konfiguriert ist und das Event an Discord gesendet werden soll, wird der Webhook verwendet. Andernfalls werden Dateien im konfigurierten lokalen Verzeichnis gespeichert.

---

## Schritt 1: Kalenderdatei-Erstellung aktivieren

1. Öffne **Einstellungen** > **Allgemein**
2. Aktiviere **„Kalenderdatei-Erstellung aktivieren"**

Dadurch werden Kalenderoptionen in Vorlagen und bei der Event-Erstellung verfügbar.

## Schritt 2: Zustellmethode konfigurieren

### Option A: Discord-Webhook (empfohlen)

Ein Webhook postet die Kalenderdatei in einen bestimmten Discord-Kanal. Für den Webhook selbst ist kein Bot erforderlich.

1. Klicke in Discord mit der rechten Maustaste auf den Kanal, in den Kalenderdateien gepostet werden sollen
2. Klicke auf **Kanal bearbeiten** > **Integrationen** > **Webhooks** > **Neuer Webhook**
3. Kopiere die Webhook-URL
4. Gehe in VRC Event Creator zu **Einstellungen** > **Discord-Integration** > wähle deine Gruppe aus
5. Aktiviere **„.ics an Discord senden"** und füge die Webhook-URL ein
6. Klicke auf **„Webhook testen"**, um die Verbindung zu überprüfen, dann auf **„Speichern"**

Wenn du auch die Discord-Event-Erstellung eingerichtet hast (Bot-Token), postet der Webhook einen Link zum Discord-Event anstelle eines eigenständigen Embeds. Die `.ics`-Datei wird in beiden Fällen angehängt.

### Option B: Automatisches Speichern in ein lokales Verzeichnis

1. Gehe in **Einstellungen** > **Anwendungsinfo** und suche **Kalender-Speicherverzeichnis**
2. Klicke auf **„Standard erstellen"** (erstellt `Documents/VRC Event Creator .ics/`) oder **„Durchsuchen"**, um einen eigenen Speicherort zu wählen
3. Dateien werden automatisch unter `{Verzeichnis}/{Gruppenname}/{Eventname - Datum}.ics` gespeichert

---

## Schritt 3: Vorlagen konfigurieren

1. Gehe zu **Vorlagen verwalten** und bearbeite (oder erstelle) eine Vorlage
2. Aktiviere im Reiter **Grundlagen** die Option **„.ics-Kalendereinladung erstellen"**
3. Im Reiter **Zeitplan** erscheint eine neue Karte **„.ics-Kalendererinnerungen"**
4. Aktiviere **„.ics-Kalendererinnerungen aktivieren"** und füge deine bevorzugten Erinnerungsintervalle hinzu
5. Speichere die Vorlage

Erinnerungen verwenden voreingestellte Intervalle, die mit allen gängigen Kalender-Apps kompatibel sind: 5 Min., 10 Min., 15 Min., 30 Min., 1 Stunde, 2 Stunden, 4 Stunden, 8 Stunden, 12 Stunden, 1 Tag, 2 Tage, 1 Woche.

> **Hinweis:** Einige Kalender-Apps (wie Outlook) verwenden nur die erste Erinnerung. Die längste Erinnerung wird für optimale Kompatibilität zuerst platziert. Google Calendar ignoriert benutzerdefinierte Erinnerungen beim Import und verwendet stattdessen deine Standard-Benachrichtigungseinstellungen.

---

## Schritt 4: Events erstellen

Beim Erstellen eines Events (manuell oder per Automatisierung):

- Im Schritt **Datum** gibt es einen **„.ics-Kalendereinladung erstellen"**-Schalter (übernommen aus der ausgewählten Vorlage oder manuell konfigurierbar)
- Darunter kannst du mit **„.ics-Kalendererinnerungen aktivieren"** die Erinnerungen pro Event anpassen
- Im Schritt **Einzelheiten** steuert **„An Discord senden"** sowohl das Discord-Event als auch die Webhook-Zustellung

Alle Einstellungen aus der Vorlage können pro Event überschrieben werden.

---

## Zusammenspiel der Funktionen

| Discord-Events | Webhook | Kalender | Was passiert bei der Event-Erstellung |
|---|---|---|---|
| Aktiviert + konfiguriert | Konfiguriert | Aktiviert | Discord-Event wird erstellt, Webhook postet Event-Link + .ics |
| Deaktiviert oder nicht konfiguriert | Konfiguriert | Aktiviert | Webhook postet Embed mit Eventdetails + .ics |
| Beliebig | Nicht konfiguriert | Aktiviert + Speicherverz. gesetzt | .ics-Datei wird automatisch im lokalen Verzeichnis gespeichert |
| Beliebig | Nicht konfiguriert | Aktiviert + kein Speicherverz. | Keine .ics-Zustellung (nur manuelles Speichern) |

---

## FAQ

### Welche Kalender-Apps unterstützen .ics-Dateien?

Alle gängigen Kalender-Apps: Outlook, Apple Calendar, Google Calendar, Thunderbird und jede App, die den iCalendar-Standard unterstützt.

### Funktionieren Erinnerungen in allen Kalender-Apps?

Mehrere Erinnerungen funktionieren in Apple Calendar und Thunderbird. Outlook verwendet nur die erste Erinnerung. Google Calendar ignoriert Erinnerungen beim Import vollständig.

### Kann ich Webhooks ohne Discord-Event-Erstellung verwenden?

Ja. Der Webhook und der Bot-Token sind unabhängige Funktionen. Du kannst Webhooks für die Kalender-Zustellung verwenden, ohne einen Discord-Bot einzurichten.

### Ist die Webhook-URL vertraulich?

Ja — jeder mit der Webhook-URL kann Nachrichten in diesen Kanal senden. Behandle sie wie ein Passwort. Sie wird verschlüsselt und über den sicheren Speicher deines Betriebssystems lokal gespeichert.

---

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| Keine .ics-Datei erstellt | Prüfe, ob „Kalenderdatei-Erstellung aktivieren" in den Einstellungen unter Allgemein aktiviert ist und „.ics-Kalendereinladung erstellen" in der Vorlage oder im Event angehakt ist |
| Webhook postet nicht | Überprüfe die Webhook-URL mit „Webhook testen" in den Discord-Einstellungen. Stelle sicher, dass „.ics an Discord senden" für die Gruppe aktiviert ist |
| Erinnerungen funktionieren nicht in Outlook | Outlook unterstützt nur die erste Erinnerung. Die App sortiert die längste zuerst für optimale Kompatibilität |
| Erinnerungen funktionieren nicht in Google Calendar | Google Calendar ignoriert benutzerdefinierte Erinnerungen beim .ics-Import. Stelle Erinnerungen nach dem Import manuell ein |
| Automatisches Speichern funktioniert nicht | Prüfe, ob ein Speicherverzeichnis unter Einstellungen > Anwendungsinfo konfiguriert ist |
| Dateien werden am falschen Ort gespeichert | Dateien werden unter `{Speicherverz.}/{Gruppenname}/` gespeichert. Prüfe den Gruppennamen und den Verzeichnispfad |
