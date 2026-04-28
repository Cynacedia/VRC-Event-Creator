# Installatiehandleiding kalenderintegratie

Deze handleiding begeleidt je bij het instellen van kalenderbestand (.ics) generatie en Discord-webhook-bezorging voor VRC Event Creator. Na configuratie kan het aanmaken van een VRChat-evenement automatisch een kalenderuitnodiging genereren en deze optioneel naar een Discord-kanaal sturen.

---

## Overzicht

De kalenderintegratie maakt standaard `.ics`-kalenderbestanden aan die geïmporteerd kunnen worden in Outlook, Apple Calendar, Google Calendar en andere agenda-apps. Deze bestanden bevatten de evenementdetails en optionele herinneringen.

Er zijn twee bezorgmethoden (per evenement slechts één mogelijk):

- **Discord-webhook** — Plaatst het `.ics`-bestand in een Discord-kanaal met een evenement-embed of Discord-evenementlink
- **Automatisch opslaan** — Slaat het `.ics`-bestand automatisch op in een lokale map

Als een Discord-webhook is geconfigureerd en het evenement is ingesteld om naar Discord te posten, wordt de webhook gebruikt. Anders worden bestanden opgeslagen in de geconfigureerde lokale map.

---

## Stap 1: Kalenderbestand generatie inschakelen

1. Open **Instellingen** > **Algemeen**
2. Vink **"Kalenderbestand generatie inschakelen"** aan

Hierdoor worden kalenderopties beschikbaar in sjablonen en bij het aanmaken van evenementen.

## Stap 2: Bezorgmethode configureren

### Optie A: Discord-webhook (aanbevolen)

Een webhook plaatst het kalenderbestand in een specifiek Discord-kanaal. Voor de webhook zelf is geen bot vereist.

1. Klik in Discord met de rechtermuisknop op het kanaal waar je kalenderbestanden wilt plaatsen
2. Klik op **Kanaal bewerken** > **Integraties** > **Webhooks** > **Nieuwe webhook**
3. Kopieer de webhook-URL
4. Ga in VRC Event Creator naar **Instellingen** > **Discord-integratie** > selecteer je groep
5. Vink **".ics naar Discord posten"** aan en plak de webhook-URL
6. Klik op **"Webhook Testen"** om te verifiëren, en vervolgens op **"Opslaan"**

Als je ook Discord-evenement aanmaak hebt ingesteld (bot-token), plaatst de webhook een link naar het Discord-evenement in plaats van een zelfstandige embed. Het `.ics`-bestand wordt in beide gevallen bijgevoegd.

### Optie B: Automatisch opslaan naar lokale map

Wanneer er geen webhook is geconfigureerd, worden `.ics`-bestanden automatisch opgeslagen in een lokale map. De standaardlocatie is `Documents/VRC Event Creator .ics/` en wordt aangemaakt bij de eerste opslag.

Bestanden worden opgeslagen als `{map}/{Groepsnaam}/{Evenementnaam - Datum}.ics`. Om de locatie te wijzigen, gebruik de knop **Wijzigen** naast **Kalender opslagmap** in **Instellingen** > **Applicatie-informatie**.

---

## Stap 3: Sjablonen configureren

1. Ga naar **Sjablonen beheren** en bewerk (of maak) een sjabloon
2. Vink in het tabblad **Basis** het vakje **".ics kalenderuitnodiging maken"** aan
3. In het tabblad **Schema** verschijnt een nieuwe kaart **".ics kalenderherinneringen"**
4. Vink **".ics kalenderherinneringen inschakelen"** aan en voeg je gewenste herinneringsintervallen toe
5. Sla het sjabloon op

Herinneringen gebruiken vooraf ingestelde intervallen die compatibel zijn met alle grote agenda-apps: 5 min, 10 min, 15 min, 30 min, 1 uur, 2 uur, 4 uur, 8 uur, 12 uur, 1 dag, 2 dagen, 1 week.

> **Let op:** Sommige agenda-apps (zoals Outlook) gebruiken alleen de eerste herinnering. De langste herinnering wordt als eerste geplaatst voor de beste compatibiliteit. Google Calendar negeert aangepaste herinneringen bij het importeren en gebruikt in plaats daarvan je standaard meldingsinstellingen.

---

## Stap 4: Evenementen aanmaken

Bij het aanmaken van een evenement (handmatig of via automatisering):

- De stap **Datum** toont een **".ics kalenderuitnodiging maken"**-schakelaar (overgenomen van het geselecteerde sjabloon, of handmatig instelbaar)
- Daaronder kun je met **".ics kalenderherinneringen inschakelen"** de herinneringen per evenement aanpassen
- De stap **Details** toont **"Publiceren op Discord"** die zowel het Discord-evenement als de webhook-bezorging bestuurt

Alle instellingen van het sjabloon kunnen per evenement worden overschreven.

---

## Hoe het samenwerkt

| Discord-evenementen | Webhook | Kalender | Wat er gebeurt bij het aanmaken van een evenement |
|---|---|---|---|
| Ingeschakeld + geconfigureerd | Geconfigureerd | Ingeschakeld | Discord-evenement aangemaakt, webhook plaatst evenementlink + .ics |
| Uitgeschakeld of niet geconfigureerd | Geconfigureerd | Ingeschakeld | Webhook plaatst embed met evenementdetails + .ics |
| Willekeurig | Niet geconfigureerd | Ingeschakeld | .ics-bestand automatisch opgeslagen in lokale map |

---

## Veelgestelde vragen

### Welke agenda-apps ondersteunen .ics-bestanden?

Alle grote agenda-apps: Outlook, Apple Calendar, Google Calendar, Thunderbird en elke app die de iCalendar-standaard ondersteunt.

### Werken herinneringen in alle agenda-apps?

Meerdere herinneringen werken in Apple Calendar en Thunderbird. Outlook gebruikt alleen de eerste herinnering. Google Calendar negeert herinneringen bij het importeren volledig.

### Kan ik webhooks gebruiken zonder Discord-evenement aanmaak?

Ja. De webhook en het bot-token zijn onafhankelijke functies. Je kunt webhooks gebruiken voor kalenderbezorging zonder een Discord-bot in te stellen.

### Is de webhook-URL vertrouwelijk?

Ja — iedereen met de webhook-URL kan berichten in dat kanaal plaatsen. Behandel het als een wachtwoord. Het wordt versleuteld en lokaal opgeslagen via de beveiligde opslag van je besturingssysteem.

---

## Probleemoplossing

| Probleem | Oplossing |
|---|---|
| Geen .ics-bestand gegenereerd | Controleer of "Kalenderbestand generatie inschakelen" is ingeschakeld in Instellingen > Algemeen, en of ".ics kalenderuitnodiging maken" is aangevinkt in het sjabloon of evenement |
| Webhook plaatst niet | Verifieer de webhook-URL met "Webhook Testen" in de Discord-instellingen. Controleer of ".ics naar Discord posten" is ingeschakeld voor de groep |
| Herinneringen werken niet in Outlook | Outlook ondersteunt alleen de eerste herinnering. De app sorteert de langste als eerste voor compatibiliteit |
| Herinneringen werken niet in Google Calendar | Google Calendar negeert aangepaste herinneringen bij .ics-import. Stel herinneringen handmatig in na het importeren |
| Bestanden worden op de verkeerde locatie opgeslagen | Bestanden worden opgeslagen in `{opslagmap}/{Groepsnaam}/`. Standaard is `Documents/VRC Event Creator .ics/`. Wijzigbaar via Instellingen > Applicatie-informatie |
