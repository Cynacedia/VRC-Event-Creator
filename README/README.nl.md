<h1 align="center">
  <img src="electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://gist.githubusercontent.com/Cynacedia/30c5da7160619ca08933e7e3e92afcc3/raw/downloads-badge.svg" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文（简体）</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.nl.md">Nederlands</a>
</p>

Een alles-in-één tool voor VRChat-evenementen die tijdrovend instelwerk overbodig maakt.
Maak en bewaar per-groep event-sjablonen, genereer aankomende eventdatums op basis van eenvoudige herhalingspatronen, en vul details automatisch in — ideaal om snel wekelijkse meetups, watch parties en community-evenementen te plannen.

<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="Event creation flow (profile to publish)" />
</p>

## Functies
- Profielen/sjablonen die eventdetails per groep automatisch invullen.
- Generator voor herhalingspatronen met lijsten van aankomende datums en een handmatige datum-/tijd-terugvaloptie.
- Evenement-automatiseringssysteem (experimenteel) — plaatst automatisch evenementen op basis van profielpatronen.
- Wizard voor het aanmaken van evenementen voor groepskalenders.
- Weergave “Modify Events” voor aankomende evenementen (raster + bewerkvenster/modaal).
- Theme Studio met presets en volledige controle over UI-kleuren (ondersteunt #RRGGBBAA).
- Gallerij-kiezer en uploadfunctie voor afbeelding-IDs.
- Minimaliseren naar het systeemvak.
- Lokalisatie met taalkeuze bij eerste start (en, fr, es, de, ja, zh, pt, ko, ru, nl).

## Download
- Releases: https://github.com/Cynacedia/VRC-Event-Creator/releases

## Privacy & gegevensopslag
Je wachtwoord wordt niet opgeslagen. Alleen sessietokens worden in de cache opgeslagen.
De app slaat zijn bestanden op in de Electron user data directory (te zien in Settings > Application Info):

- `profiles.json` (profielsjablonen)
- `cache.json` (sessietokens)
- `settings.json` (app-instellingen)
- `themes.json` (thema-presets en aangepaste kleuren)
- `pending-events.json` (automatiseringswachtrij)
- `automation-state.json` (automatiseringstracking)

Je kunt de data directory overschrijven met de `VRC_EVENT_DATA_DIR` environment variable.
Bij de eerste start probeert de app een bestaande `profiles.json` uit de projectmap te importeren.

__**Deel geen cachebestanden of applicatiedatamappen.**__

## Gebruiksnotities
- Profielen vereisen een Profielnaam, Event naam en Omschrijving voordat je verder kunt.
- Privégroepen kunnen alleen Toegangstype = Groep gebruiken.
- Tijdsduur gebruikt **DD:HH:MM** en heeft een maximum van 31 dagen.
- Tags zijn beperkt tot 5 en talen zijn beperkt tot 3.
- Gallery-uploads zijn beperkt tot PNG/JPG, 64–2048 px, onder 10 MB, en 64 afbeeldingen per account.
- VRChat beperkt het aanmaken van events tot 10 events per uur per persoon per groep.
- Event-automatisering vereist dat de app draait. Gemiste automations kun je beheren in Evenementen wijzigen.

## Probleemoplossing
- Loginproblemen: verwijder `cache.json` en log opnieuw in (gebruik de datamap die wordt getoond in Instellingen > Applicatie Info).
- Ontbrekende groepen: je account moet kalender-toegang hebben in de doelgroep.
- Rate limiting: VRChat kan het aanmaken van events beperken. Wacht en probeer opnieuw, en stop als meerdere pogingen mislukken. Spam niet met refreshen of op event creation-knoppen drukken.
- Updates: Sommige functies zijn geblokkeerd wanneer er updates klaarstaan. Download en start de nieuwste release.

## Disclaimer
- Dit project is niet gelieerd aan of onderschreven door VRChat. Gebruik op eigen risico.
- Talen zijn machinaal vertaald en kunnen onnauwkeurig zijn; draag gerust correcties bij.

## Vereisten (bouwen vanaf broncode)
- Node.js 20+ (22.21.1 aanbevolen)
- npm
- Een VRChat-account met toestemming om events aan te maken voor minstens één groep
