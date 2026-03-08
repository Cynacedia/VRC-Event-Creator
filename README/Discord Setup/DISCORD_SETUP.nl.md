# Installatiehandleiding Discord-integratie

Deze handleiding begeleidt je bij het instellen van de Discord-integratie voor VRC Event Creator. Na configuratie wordt er bij het aanmaken van een VRChat-evenement automatisch een bijbehorend **Discord-evenement** op je server aangemaakt.

---

## Overzicht

De integratie maakt gebruik van een **Discord-bot** die je zelf aanmaakt en beheert. De bot heeft slechts één machtiging nodig: **Evenementen aanmaken**. De bot leest geen berichten, neemt niet deel aan spraakkanalen en doet verder niets anders. Je bot-token wordt versleuteld en lokaal opgeslagen — het wordt nergens naartoe verstuurd, behalve naar de Discord-API bij het aanmaken van evenementen.

Elke VRChat-groep kan aan één Discord-server worden gekoppeld. Je kunt dezelfde bot hergebruiken voor meerdere groepen/servers, of aparte bots gebruiken.

---

## Stap 1: Een Discord-applicatie aanmaken

1. Ga naar het [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik rechtsboven op **"New Application"**
3. Geef het een naam en klik op **Create**

## Stap 2: De bot aanmaken

1. Klik op **"Bot"** in de linkerzijbalk
2. Klik op **"Reset Token"** (of **"Copy"** als het token nog zichtbaar is)
3. **Kopieer het token onmiddellijk** — je kunt het daarna niet meer inzien
4. Laat Privileged Gateway Intents uitgeschakeld — de bot heeft deze niet nodig

> **Houd je bot-token geheim.** Iedereen met het token kan handelen als jouw bot. Als je het per ongeluk deelt, reset het dan direct in het Developer Portal.

## Stap 3: De bot uitnodigen op je server

1. Klik op **"OAuth2"** in de linkerzijbalk
2. Scroll naar **"OAuth2 URL Generator"**
3. Vink onder **Scopes** het vakje **`bot`** aan
4. Vink onder **Bot Permissions** het vakje **`Create Events`** aan
5. Kopieer de gegenereerde URL onderaan, open deze in je browser, selecteer je server en autoriseer

De bot verschijnt in je ledenlijst maar blijft offline — de bot hoeft niet te "draaien." De app communiceert rechtstreeks met de Discord-API via het token.

## Stap 4: Je server-ID opzoeken

1. Ga in Discord naar **Gebruikersinstellingen** > **Geavanceerd** en schakel **Ontwikkelaarsmodus** in
2. Klik met de rechtermuisknop op je servernaam en klik op **"Server-ID kopiëren"**

## Stap 5: Configureren in VRC Event Creator

1. Open **Instellingen** > **Geavanceerde opties** > vink **"Discord-integratie inschakelen"** aan
2. Selecteer de VRChat-groep die je wilt koppelen, voer je bot-token en server-ID in en sla op
3. Gebruik **"Bot-token verifiëren"** om te bevestigen dat het token werkt

Elke evenementsjabloon heeft een **"Synchroniseren met Discord"**-schakelaar in het tabblad Basics. Deze is standaard ingeschakeld wanneer de Discord-integratie actief is. Je kunt de schakelaar uitschakelen voor evenementen die je niet op Discord wilt plaatsen.

**Discord-synchronisatie blokkeert nooit het aanmaken van VRChat-evenementen.** Als er iets misgaat aan de Discord-kant, wordt je VRChat-evenement gewoon normaal aangemaakt.

---

## Veelgestelde vragen

### Kan ik een bot gebruiken die ik al heb?

Ja, zolang de bot de machtiging **Evenementen aanmaken** heeft op de betreffende server.

### Wat als meerdere teamleden evenementen aanmaken?

Iedereen die evenementen aanmaakt, heeft het bot-token op zijn of haar computer nodig. Opties:
- **Deel het token** met vertrouwde teamleden
- **Laat één persoon de Discord-synchronisatie beheren** terwijl anderen "Synchroniseren met Discord" uitschakelen
- **Maak aparte bots** per teamlid

### Is mijn bot-token veilig?

Je bot-token wordt versleuteld via de beveiligde opslag van je besturingssysteem (Windows DPAPI / macOS Keychain / Linux Secret Service) en lokaal opgeslagen. Het wordt nergens naartoe verstuurd, behalve naar de Discord-API.

### Kan ik Discord-evenementen verwijderen vanuit de app?

Nee, de app maakt ze alleen aan. Beheer Discord-evenementen rechtstreeks in Discord.

---

## Probleemoplossing

| Probleem | Oplossing |
|---|---|
| "Ongeldig bot-token" | Reset het token in het Developer Portal en plak het nieuwe token |
| "Bot heeft geen machtiging om evenementen aan te maken" | Nodig de bot opnieuw uit met de machtiging Evenementen aanmaken, of voeg deze toe via Serverinstellingen > Rollen |
| "Discord-server niet gevonden" | Controleer de server-ID (rechtermuisknop op server > Server-ID kopiëren) |
| "Discord-snelheidslimiet bereikt" | Wacht een minuut en probeer het opnieuw |
| Evenementen aangemaakt in VRChat maar niet in Discord | Controleer of "Synchroniseren met Discord" is ingeschakeld en de groep een geldig bot-token + server-ID heeft |
