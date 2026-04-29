# Installatiehandleiding kalenderintegratie

Deze handleiding begeleidt je bij het instellen van kalenderbestand (.ics) generatie, Discord-webhook-berichten en Discord geplande evenementen in VRC Event Creator. Deze drie functies zijn volledig onafhankelijk — schakel elke combinatie in die bij je workflow past.

---

## Overzicht

VRC Event Creator biedt drie acties na het aanmaken wanneer je een VRChat-evenement aanmaakt of automatiseert. Elk kan onafhankelijk per sjabloon en per evenement worden in- of uitgeschakeld:

- **".ics kalenderuitnodiging maken"** — Genereert een standaard `.ics`-kalenderbestand met optionele herinneringen, automatisch opgeslagen in een lokale map
- **"Discord-Webhook posten"** — Plaatst een aankondiging in een Discord-kanaal via webhook (met optionele `.ics`-bijlage als kalender ook is ingeschakeld)
- **"Discord-evenement maken"** — Maakt een gepland evenement aan op je Discord-server via bot

Wanneer meerdere functies zijn ingeschakeld, werken ze automatisch samen:

| Discord-evenement | Webhook | Kalender (.ics) | Wat er gebeurt |
|---|---|---|---|
| AAN | UIT | UIT | Alleen Discord gepland evenement aangemaakt |
| UIT | AAN | UIT | Webhook plaatst embed met evenementdetails |
| UIT | UIT | AAN | `.ics`-bestand automatisch opgeslagen in lokale map |
| AAN | AAN | UIT | Discord-evenement aangemaakt + webhook plaatst evenementlink |
| AAN | UIT | AAN | Discord-evenement aangemaakt + `.ics` opgeslagen |
| UIT | AAN | AAN | Webhook plaatst embed + `.ics` bijgevoegd, ook opgeslagen |
| AAN | AAN | AAN | Discord-evenement + webhook met evenementlink + `.ics` bijgevoegd + opgeslagen |

---

## Stap 1: Kalenderbestand generatie inschakelen

1. Open **Instellingen** > **Geavanceerde instellingen**
2. Vink **"Kalenderbestand generatie inschakelen"** aan

Hierdoor wordt de schakelaar **".ics kalenderuitnodiging maken"** beschikbaar in sjablonen en bij het aanmaken van evenementen.

### Opslagmap

Wanneer kalenderbestand generatie is ingeschakeld, worden `.ics`-bestanden altijd opgeslagen in een lokale map. De standaardlocatie is `Documents/VRC Event Creator .ics/` en wordt aangemaakt bij de eerste opslag.

Bestanden worden opgeslagen als `{map}/{Groepsnaam}/{Evenementnaam - Datum}.ics`. Om de locatie te wijzigen, gebruik de knop **Wijzigen** naast **Kalender opslagmap** in **Instellingen** > **Applicatie-informatie**.

---

## Stap 2: Discord-webhook configureren (optioneel)

Een webhook plaatst aankondigingen in een specifiek Discord-kanaal. Dit is onafhankelijk van kalenderbestanden en Discord-evenementen — je kunt het met of zonder beide gebruiken.

1. Klik in Discord met de rechtermuisknop op het kanaal waar je aankondigingen wilt plaatsen
2. Klik op **Kanaal bewerken** > **Integraties** > **Webhooks** > **Nieuwe webhook**
3. Kopieer de webhook-URL
4. Ga in VRC Event Creator naar **Instellingen** > **Discord-integratie** > selecteer je groep
5. Vink **"Webhook inschakelen"** aan en plak de webhook-URL
6. Klik op **Webhook Testen** om te verifiëren, en vervolgens op **Opslaan**

Wanneer zowel webhook als kalender zijn ingeschakeld voor een evenement, wordt het `.ics`-bestand bijgevoegd aan het webhook-bericht. Wanneer alleen de webhook is ingeschakeld (geen kalender), plaatst de webhook een embed met evenementdetails zonder `.ics`-bijlage.

Als er ook een Discord gepland evenement is aangemaakt, bevat het webhook-bericht de Discord-evenementlink in plaats van een embed.

---

## Stap 3: Sjablonen configureren

1. Ga naar **Sjablonen beheren** en bewerk (of maak) een sjabloon
2. In het tabblad **Basis** zie je maximaal drie publicatieschakelaars (afhankelijk van de configuratie):
   - **".ics kalenderuitnodiging maken"** — zichtbaar wanneer kalenderbestand generatie is ingeschakeld
   - **"Discord-evenement maken"** — zichtbaar wanneer een Discord-bot is geconfigureerd voor de groep
   - **"Discord-Webhook posten"** — zichtbaar wanneer een webhook-URL is geconfigureerd voor de groep
3. Schakel de gewenste opties in voor dit sjabloon
4. Als kalender is ingeschakeld, toont het tabblad **Schema** een kaart **".ics kalenderherinneringen"**
5. Vink **".ics kalenderherinneringen inschakelen"** aan en voeg je gewenste herinneringsintervallen toe
6. Sla het sjabloon op

Herinneringen gebruiken vooraf ingestelde intervallen die compatibel zijn met alle grote agenda-apps: 5 min, 10 min, 15 min, 30 min, 1 uur, 2 uur, 4 uur, 8 uur, 12 uur, 1 dag, 2 dagen, 1 week.

> **Let op:** Sommige agenda-apps (zoals Outlook) gebruiken alleen de eerste herinnering. De langste herinnering wordt als eerste geplaatst voor de beste compatibiliteit. Google Calendar negeert aangepaste herinneringen bij het importeren en gebruikt in plaats daarvan je standaard meldingsinstellingen.

---

## Stap 4: Evenementen aanmaken

Bij het aanmaken van een evenement (handmatig of via automatisering):

- De stap **Datum** toont **".ics kalenderuitnodiging maken"** (overgenomen van het sjabloon, overschrijfbaar)
- Daaronder kun je met **".ics kalenderherinneringen inschakelen"** de herinneringen per evenement aanpassen
- De stap **Details** toont **"Discord-evenement maken"** en **"Discord-Webhook posten"** als afzonderlijke schakelaars
- Alle instellingen van het sjabloon kunnen per evenement worden overschreven

---

## Veelgestelde vragen

### Welke agenda-apps ondersteunen .ics-bestanden?

Alle grote agenda-apps: Outlook, Apple Calendar, Google Calendar, Thunderbird en elke app die de iCalendar-standaard ondersteunt.

### Werken herinneringen in alle agenda-apps?

Meerdere herinneringen werken in Apple Calendar en Thunderbird. Outlook gebruikt alleen de eerste herinnering. Google Calendar negeert herinneringen bij het importeren volledig.

### Kan ik webhooks gebruiken zonder kalenderbestanden?

Ja. De webhook plaatst een embed met evenementdetails zelfs wanneer kalenderbestand generatie is uitgeschakeld. Schakel "Discord-Webhook posten" in bij je sjabloon zonder ".ics kalenderuitnodiging maken" in te schakelen.

### Kan ik webhooks gebruiken zonder Discord-evenement aanmaak?

Ja. De webhook, Discord-evenementen en kalenderbestanden zijn volledig onafhankelijk. Elke combinatie werkt.

### Is de webhook-URL vertrouwelijk?

Ja — iedereen met de webhook-URL kan berichten in dat kanaal plaatsen. Behandel het als een wachtwoord. Het wordt versleuteld en lokaal opgeslagen via de beveiligde opslag van je besturingssysteem.

---

## Probleemoplossing

| Probleem | Oplossing |
|---|---|
| Geen .ics-bestand gegenereerd | Controleer of "Kalenderbestand generatie inschakelen" is ingeschakeld in de Geavanceerde instellingen, en of ".ics kalenderuitnodiging maken" is aangevinkt in het sjabloon of evenement |
| Webhook plaatst niet | Verifieer de webhook-URL met "Webhook Testen" in de Discord-instellingen. Controleer of "Webhook inschakelen" is ingeschakeld voor de groep en "Discord-Webhook posten" is aangevinkt in het sjabloon |
| Webhook plaatst maar zonder .ics bijlage | ".ics kalenderuitnodiging maken" moet ook zijn ingeschakeld voor het evenement. Zonder dit plaatst de webhook alleen een embed of evenementlink |
| Herinneringen werken niet in Outlook | Outlook ondersteunt alleen de eerste herinnering. De app sorteert de langste als eerste voor compatibiliteit |
| Herinneringen werken niet in Google Calendar | Google Calendar negeert aangepaste herinneringen bij .ics-import. Stel herinneringen handmatig in na het importeren |
| Bestanden worden op de verkeerde locatie opgeslagen | Bestanden worden opgeslagen in `{opslagmap}/{Groepsnaam}/`. Standaard is `Documents/VRC Event Creator .ics/`. Wijzigbaar via Instellingen > Applicatie-informatie |
