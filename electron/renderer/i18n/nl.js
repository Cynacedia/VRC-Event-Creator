// Nederlandse vertalingen voor VRChat Event Creator

export const nl = {
  nav: {
    create: "Evenement maken",
    modify: "Evenementen wijzigen",
    settings: "Instellingen",
    schedules: "Planningen beheren"
  },
  auth: {
    title: "Toegangsknooppunt",
    subtitle: "VRChat-inloggegevens vereist",
    username: "Gebruikersnaam",
    password: "Wachtwoord",
    signIn: "Inloggen",
    logout: "Uitloggen",
    sessionHint: "Sessie wordt lokaal gecachet. Houd je cachebestand privé.",
    loggingIn: "Bezig met inloggen...",
    loginFailed: "Inloggen mislukt.",
    sessionChecking: "Sessie controleren...",
    loginRequired: "Inloggen vereist.",
    loggedInAs: "Ingelogd als {name}.",
    loggedOut: "Uitgelogd."
  },
  twoFactor: {
    title: "Twee-factorcode",
    subtitle: "Voer je authenticatiecode in",
    codeLabel: "Code",
    submit: "Verzenden"
  },
  languageSetup: {
    title: "Taal kiezen",
    subtitle: "Selecteer je taal om te beginnen.",
    hint: "Je kunt dit altijd wijzigen in Instellingen.",
    continue: "Doorgaan"
  },
  gallery: {
    title: "Galerij",
    subtitle: "Selecteer een galerijafbeelding om de bestands-ID te gebruiken.",
    empty: "Geen galerijafbeeldingen gevonden.",
    loading: "Galerij laden...",
    useButton: "Afbeeldings-ID gebruiken",
    chooseButton: "Selecteren",
    uploadButton: "Uploaden",
    uploadSuccess: "Galerijafbeelding geüpload.",
    uploadFailed: "Kon afbeelding niet uploaden.",
    uploadLimitReached: "Galerij is vol (64 afbeeldingen). Verwijder er één om te uploaden.",
    uploadTypeError: "Alleen PNG- of JPG-afbeeldingen worden ondersteund.",
    uploadSizeError: "Afbeelding moet kleiner zijn dan 10 MB.",
    uploadMinDimensions: "Afbeelding moet groter zijn dan 64x64.",
    uploadMaxDimensions: "Afbeelding moet kleiner zijn dan 2048x2048.",
    loadMore: "Meer laden",
    loadFailed: "Kon galerij niet laden."
  },
  settings: {
    theme: {
      title: "Thema",
      description: "Pas het uiterlijk van de app aan. Selecteer een preset of stel handmatig in.",
      presetLabel: "Huidig thema",
      nameLabel: "Themanaam",
      namePlaceholder: "Nieuwe themanaam",
      saveButton: "Thema opslaan",
      deleteButton: "Thema verwijderen",
      resetButton: "Terugzetten naar standaard",
      savedLabel: "Opgeslagen thema's",
      customGroupLabel: "Aangepast",
      customUnsaved: "Aangepast (niet opgeslagen)",
      importButton: "Thema importeren",
      exportButton: "Thema exporteren",
      openStudio: "Thema-studio openen",
      studio: {
        title: "Thema-studio",
        subtitle: "Bekijk een voorbeeld en verfijn het uiterlijk van de app. Ondersteunt #RRGGBBAA voor aangepaste transparantie.",
        header: "Kop",
        statusLabels: "Status en labels",
        accent: "Accent",
        panel: "Paneel",
        mutedText: "Gedempte tekst",
        primary: "Primair",
        ghost: "Ghost",
        inputField: "Invoerveld",
        dropdown: "Keuzelijst",
        dropdownOptionA: "Keuzeoptie A",
        dropdownOptionB: "Keuzeoptie B",
        dropdownOptionC: "Keuzeoptie C",
        dropdownOptionD: "Keuzeoptie D",
        previewLink: "Voorbeeldlink",
        toastPreview: "Toast-voorbeeld gebruikt Panel Alt",
        previewHint: "Voorbeeld wordt live bijgewerkt terwijl je kleuren aanpast."
      },
      fields: {
        accent: "Accent",
        bg: "Achtergrond 1",
        bgDeep: "Achtergrond 2",
        backdrop: "Achtergrond 3",
        panel: "Paneel",
        panelAlt: "Paneel alt",
        headerBg: "Kop",
        overlay: "Overlay",
        text: "Tekst",
        textMuted: "Tekst gedempt",
        link: "Link",
        linkHover: "Link hover",
        button: "Knop 1",
        button2: "Knop 2",
        buttonText: "Knoptekst",
        border: "Rand",
        shadow: "Schaduw",
        inputBg: "Invoerachtergrond",
        inputBgStrong: "Invoerachtergrond 2",
        inputText: "Invoertekst",
        selectOptionBg: "Selectie-optie",
        selectOptionHighlight: "Selectie-highlight",
        backdropOverlay: "Achtergrondgloed",
        backdropGrid: "Achtergrondraster",
        scanline: "Scanline"
      }
    },
    appInfo: {
      title: "Applicatie-informatie",
      language: "Taal",
      version: "App-versie",
      dataFolder: "Huidige gegevensmap",
      changeButton: "Wijzigen",
      openButton: "Openen",
      session: "Sessie",
      githubLabel: "GitHub-repository:",
      disclaimerLabel: "Disclaimer:",
      disclaimerText: "De ontwikkelaars zijn niet verantwoordelijk voor problemen die worden veroorzaakt door het gebruik van deze tool."
    },
    general: {
      title: "Algemeen",
      minimizeToTray: "Minimaliseren naar systeemvak",
      startOnStartup: "Starten bij opstarten systeem",
      enableAdvanced: "Geavanceerde instellingen inschakelen",
      enableImportExport: "Evenementen importeren/exporteren",
      autoUploadImages: "Galerij-afbeeldingen automatisch uploaden van geïmporteerde evenementen/sjablonen"
    },
    discord: {
      enable: "Discord-integratie inschakelen",
      description: "Maakt automatisch Discord-evenementen aan bij het aanmaken van VRChat-evenementen.",
      tokenLabel: "Bot-token",
      tokenPlaceholder: "Plak het bot-token",
      guildLabel: "Server-ID",
      guildPlaceholder: "bijv. 123456789012345678",
      testButton: "Bot-token verifiëren",
      testSuccess: "Verbonden als {botName}",
      testFailed: "Verbinding mislukt. Controleer het bot-token.",
      tokenMissing: "Voer eerst een bot-token in.",
      selectGroup: "Selecteer een groep...",
      saveButton: "Opslaan",
      saved: "Discord-instellingen opgeslagen.",
      eventLabel: "Discord-evenement maken",
      syncSuccess: "Discord-evenement aangemaakt voor \"{title}\"",
      syncFailed: "Discord-synchronisatie mislukt voor \"{title}\": {error}"
    },
    webhook: {
      postLabel: "Discord-Webhook posten",
      enableLabel: "Webhook inschakelen",
      syncSuccess: "Webhook verzonden voor \"{title}\"",
      syncFailed: "Webhook-levering mislukt voor \"{title}\": {error}"
    },
    calendar: {
      enable: "Kalenderbestand generatie inschakelen",
      createInvite: ".ics kalenderuitnodiging maken",
      enableReminders: ".ics kalenderherinneringen inschakelen",
      addReminder: "Herinnering Toevoegen",
      unit: {
        minutes: "minuten",
        hours: "uren",
        days: "dagen"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Webhook Testen",
      webhookTestSuccess: "Webhook geverifieerd: {webhookName}",
      webhookTestFailed: "Webhook test mislukt. Controleer de URL.",
      webhookMissing: "Voer eerst een webhook URL in.",
      remindersHint: "Sommige kalender-apps gebruiken mogelijk alleen de eerste herinnering.",
      saveDirLabel: "Kalender opslagmap",
      autoSaved: "Kalenderbestand opgeslagen: {filePath}",
      inviteTitle: "Agenda-uitnodiging"
    },
    eckit: {
      importButton: "Kit Importeren",
      webhookName: "Webhook Weergavenaam",
      webhookNamePlaceholder: "Mijn Groep Evenementen",
      embedColor: "Embed Kleur",
      avatarUrl: "Avatar URL",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "Aangepast webhook bericht bijvoegen",
      messageTitle: "Aangepast Webhook Bericht",
      messagePlaceholder: "Schrijf een aangepast bericht om bij de webhook post te voegen...",
      attachImage: "Afbeelding bijvoegen",
      noImage: "Geen afbeelding geselecteerd",
      selectImage: "Selecteren"
    },
    saveButton: "Instellingen opslaan",
    saved: "Instellingen opgeslagen.",
    featuredVerification: {
      permissionDenied: "Deze groep mag geen uitgelichte evenementen aanmaken."
    }
  },
  demo: {
    controls: {
      title: "Demo Controls",
      updateGateLabel: "Force Update Required",
      updateGateHint: "Blocks event creation/modification and shows update-required toasts."
    }
  },
  trayPrompt: {
    title: "Minimaliseren naar systeemvak?",
    message: "Je kunt dit later wijzigen in Instellingen.",
    yes: "Ja",
    no: "Nee"
  },
  categories: {
    hangout: "Hangout",
    exploration: "Verkenning",
    roleplaying: "Rollenspel",
    film: "Film en media",
    gaming: "Gamen",
    music: "Muziek",
    dance: "Dans",
    performance: "Optreden",
    arts: "Kunst",
    avatars: "Avatars",
    education: "Educatie",
    wellness: "Welzijn",
    other: "Overig"
  },
  platforms: {
    pcWindows: "PC (Windows)",
    android: "Android (Quest, mobiel, enz.)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "Groep",
      date: "Datum",
      details: "Details",
      create: "Aanmaken"
    },
    section: {
      groupProfile: "Groep + sjabloon",
      dateSelection: "Datumselectie",
      details: "Evenementdetails",
      readyTitle: "Klaar om aan te maken?",
      readyHint: "Controleer je keuzes en maak dan het evenement aan."
    },
    labels: {
      groupRequired: "Groep (verplicht)",
      profileOptional: "Sjabloon (optioneel)",
      advanced: "Geavanceerd",
      patternDates: "Patroondatums",
      manualDate: "Handmatige datum",
      manualTime: "Handmatige tijd",
      dateSourceManual: "Handmatig",
      dateSource: "Gebruik",
      dateSourcePattern: "Patroon"
    },
    hints: {
      profileDefaults: "Kies een sjabloon met standaardinstellingen, of laat leeg om handmatig aan te maken.",
    },
    dateHints: {
      default: "Handmatige modus is klaar. Sjablonen met patronen ontgrendelen datumopties.",
      noProfile: "Geen sjabloon geselecteerd. Gebruik handmatige datum/tijd.",
      manualReady: "Handmatige modus klaar.",
      chooseGenerated: "Kies een gegenereerde datum of gebruik handmatig.",
      noUpcoming: "Geen aankomende datums gevonden.",
      loadFailed: "Kon patroondatums niet laden."
    },
    profileHint: "Sjablonen zijn optioneel. Gebruik er één met standaardinstellingen, of maak alles handmatig.",
    loadProfile: "Sjabloon laden (optioneel)",
    clearProfile: "Sjabloon wissen",
    importSuccess: "Eventgegevens geïmporteerd uit JSON.",
    importWrongType: "Dit lijkt een sjabloon-JSON te zijn. Gebruik in plaats daarvan Sjabloon importeren.",
    exportSuccess: "Eventgegevens geëxporteerd naar JSON.",
    dateOption: "Datum kiezen",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "Rolbeperkingen",
      hint: "Optioneel - indien ingeschakeld, mogen alleen de geselecteerde groepsrollen deelnemen.",
      optional: "Bijvoorbeeld moderators: alle rollen op of boven de laagst geselecteerde moderatorrol mogen deelnemen.",
      allAccess: "Geen (iedereen kan deelnemen)",
      managementRoles: "Beheerrollen",
      roles: "Rollen",
      noRoles: "Geen rollen beschikbaar voor deze groep."
    },
    manualProfileOption: "Handmatig (geen sjabloon)",
    pastDateError: "Je kunt geen datum in het verleden selecteren.",
    futureDateError: "Evenementen kunnen slechts tot 1 jaar vooruit worden gepland.",
    upcomingLimitNotice: "VRChat verhindert momenteel dat we meer dan 10 evenementen per groep per uur aanmaken.",
    upcomingCountGroupFallback: "Deze groep",
    upcomingCountStatus: "Evenementen aangemaakt voor {group} dit uur: {count}/{limit}.",
    upcomingCountUnknown: "Teller voor het aanmaken van evenementen niet beschikbaar.",
    upcomingCountToast: "Evenementen aangemaakt voor {group} dit uur: {count}/{limit}.",
    upcomingLimitReached: "Het aanmaken van evenementen is tijdelijk beperkt. Wacht even en probeer het later opnieuw.",
    upcomingLimitError: "Aanmaken van evenement mislukt. Wacht even en probeer het opnieuw.",
    crossPlatformRateLimit: "Rate-limiet bereikt. Niet-getraceerde evenementen die op een ander platform zijn aangemaakt kunnen meetellen voor je limiet. Probeer het opnieuw over {minutes} minuten.",
    unknownRateLimit: "Rate-limiet bereikt. Probeer het later opnieuw.",
    upcomingCountRefresh: "Vernieuwen",
    createButton: "Evenement maken",
    create: {
      warnConflicts: "Waarschuw me voor conflicterende evenementen",
      alreadyCreating: "Er wordt al een evenement aangemaakt, even geduld..."
    },
    created: "Evenement aangemaakt.",
    failed: "Kon evenement niet aanmaken.",
    selectDateError: "Selecteer een datum.",
    updateRequired: "Update beschikbaar. Werk bij voordat je evenementen aanmaakt.",
    featuredPermissionRevoked: "Deze groep heeft geen toestemming meer om uitgelichte evenementen te maken.",
    groupFairPermissionRevoked: "Deze groep heeft geen toestemming meer om evenementen op te nemen in de Groepsbeurs."
  },
  modify: {
    subtitle: "Bewerk of verwijder aankomende groepsevenementen.",
    countEmpty: "Aankomende evenementen niet beschikbaar.",
    countGroupFallback: "Deze groep",
    countStatus: "Aankomende evenementen voor {group}: {count}.",
    empty: "Geen aankomende evenementen.",
    dateUnknown: "Datum niet beschikbaar",
    eventImage: "Evenementafbeelding",
    noImage: "Geen afbeelding",
    untitled: "Naamloos evenement",
    profileLoad: "Laden",
    profileSelectError: "Selecteer een sjabloon om te laden.",
    profileLoadFailed: "Kon sjabloon-standaardwaarden niet laden.",
    profileLoaded: "Sjabloon-standaardwaarden geladen.",
    manualDate: "Datum wijzigen",
    manualTime: "Tijd wijzigen",
    modal: {
      title: "Evenement bewerken",
      subtitle: "Wijzigingen worden pas toegepast wanneer je op Opslaan drukt."
    },
    updateRequired: "Update beschikbaar. Werk bij voordat je evenementen wijzigt.",
    selectEventError: "Selecteer een evenement om te bewerken.",
    selectDateError: "Selecteer een datum en tijd.",
    saveFailed: "Kon evenement niet bijwerken.",
    saved: "Evenement bijgewerkt.",
    deleteFailed: "Kon evenement niet verwijderen.",
    deleted: "Evenement verwijderd.",
    loadFailed: "Kon evenementen niet laden.",
    missedAutomationNoticeSingular: "1 evenement kon niet op het geplande automatische tijdstip worden geplaatst.",
    missedAutomationNoticePlural: "{count} evenementen konden niet op hun geplande automatische tijdstip worden geplaatst.",
    queuedAutomationNoticeSingular: "Rate-limiet bereikt: 1 evenement in afwachting staat in de wachtrij, wachtend tot de limiet is opgeheven.",
    queuedAutomationNoticePlural: "Rate-limiet bereikt: {count} evenementen in afwachting staan in de wachtrij, wachtend tot de limiet is opgeheven.",
    pending: {
      postNow: "Nu plaatsen",
      edit: "Bewerken",
      cancel: "Annuleren",
      publishAt: "Wordt gepubliceerd op: {time}",
      missedHint: "Deze automatisering is gemist. Plaats nu of verwijder.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "Evenement succesvol geplaatst.",
      postFailed: "Kon evenement niet plaatsen.",
      cancelled: "Evenement in afwachting geannuleerd.",
      cancelFailed: "Kon evenement in afwachting niet annuleren.",
      editSaved: "Evenement in afwachting bijgewerkt.",
      editFailed: "Kon evenement in afwachting niet bijwerken."
    },
    postingOptions: "Publicatieopties",
    badge: {
      modified: "Gewijzigd"
    },
    filters: {
      heading: "Tonen",
      modified: "Gewijzigde voorvallen",
      pending: "Wachtende evenementen",
      standalone: "Losstaande evenementen"
    },
    filtersButton: "Filters",
    timeRange: {
      "1month": "1 maand",
      "1week": "1 week",
      "1year": "1 jaar",
      "2weeks": "2 weken",
      "3months": "3 maanden",
      "6months": "6 maanden",
      label: "Tijdsbereik"
    }
  },
  profiles: {
    steps: {
      select: "Selecteren",
      basics: "Basis",
      schedule: "Schema",
      audience: "Publiek"
    },
    section: {
      basics: "Sjabloonbasis",
      audience: "Publiek"
    },
    labels: {
    },
    buttons: {
      new: "Nieuw"
    },
    importSuccess: "Sjabloongegevens geïmporteerd uit JSON.",
    importWrongType: "Dit lijkt een evenement-JSON te zijn. Gebruik in plaats daarvan Evenement importeren.",
    exportSuccess: "Sjabloongegevens geëxporteerd naar JSON.",
    hints: {
      groupAccess: "Kies een groep met kalendertoegang.",
      patternsInfo: "Patronen worden gebruikt om aankomende datums vooraf te genereren."
    },
    existingProfilePlaceholder: "Selecteer een sjabloon",
    displayName: "Sjabloonnaam",
    displayNamePlaceholder: "Community hangout-sjabloon",
    durationDefault: "Standaardtijdsduur (DD:HH:MM)",
    dateMode: "Datummodus",
    dateModePattern: "Patroon gebaseerd",
    dateModeManual: "Alleen handmatig",
    dateModeBoth: "Patronen + handmatig",
    sendNotificationDefault: "Stuur melding standaard",
    patterns: {
      addButton: "Patroon toevoegen",
      clearButton: "Patronen wissen",
      noPatterns: "Nog geen patronen.",
      removeButton: "Verwijderen",
      patternType: "Patroontype",
      weekday: "Weekdag",
      time: "Tijd",
      confirmClear: "Alle patronen wissen?",
      selectAll: "Selecteer patroontype, weekdag en tijd.",
      selectPattern: "Selecteer een patroon",
      selectWeekday: "Selecteer een weekdag",
      date: "Datum",
      selectMonth: "Selecteer een maand",
      types: {
        every: "Elke [weekday]",
        everyOther: "Om de week op [weekday]",
        nth1: "Elke 1e [weekday] van de maand",
        nth2: "Elke 2e [weekday] van de maand",
        nth3: "Elke 3e [weekday] van de maand",
        nth4: "Elke 4e [weekday] van de maand",
        last: "Elke laatste [weekday] van de maand",
        annual: "Elk jaar op [date]"
      },
      format: {
        every: "Elke {weekday} om {time}",
        everyOther: "Om de week {weekday} om {time}",
        last: "Laatste {weekday} om {time}",
        nth: "{ordinal} {weekday} om {time}",
        annual: "Elk jaar op {month} {day} om {time}"
      },
      ordinal1: "1e",
      ordinal2: "2e",
      ordinal3: "3e",
      ordinal4: "4e"
    },
    automation: {
      title: "Automatisering (experimenteel)",
      description: "Plaats automatisch evenementen op basis van je patronen. Evenementen verschijnen als \"In afwachting\" in Evenementen wijzigen.",
      enableLabel: "Automatisering inschakelen",
      timingLabel: "Planningsregel",
      frequencyLabel: "Timing (DD:HH:MM)",
      timingModes: {
        before: "Vóór start van evenement",
        after: "Nadat het vorige evenement eindigt",
        monthly: "Maandelijks op specifieke dag"
      },
      monthlyDay: "Dag van de maand",
      monthlyTime: "Tijd",
      repeatMode: "Herhalen",
      repeatModes: {
        indefinite: "Onbeperkt",
        count: "Vast aantal"
      },
      repeatCount: "Aantal evenementen om aan te maken",
      patternsRequired: "Minstens één patroon is vereist voor automatisering",
      confirmTitle: "Automatisering inschakelen?",
      confirmEnable: "Automatiseringen vereisen dat de app actief is om evenementen te plaatsen. Gemiste automatiseringen kunnen worden afgehandeld via het tabblad Evenementen wijzigen.",
      offsetCorrected: "Offset ({oldOffset} dagen) overschreed patroonfrequentie ({frequency} dagen). Overgeschakeld naar \"vooraf\"-modus met {newOffset}-dagen-offset.",
      offsetCapped: "Offset ({oldOffset} dagen) overschreed patroonfrequentie. Afgekapt op {newOffset} dagen.",
      prose: {
        day: "1 dag",
        days: "{count} dagen",
        hour: "1 uur",
        hours: "{count} uur",
        minute: "1 minuut",
        minutes: "{count} minuten",
        and: "en",
        noTime: "—",
        before: "Plaats het volgende evenement {time} voordat het begint.",
        after: "Plaats het volgende evenement {time} nadat het vorige evenement eindigt.",
        monthly: "Elke maand op de {day}{ordinal} om {time}"
      },
      helpers: {
      },
      offsetProse: "Plaats het volgende evenement 7 dagen voordat het begint.",
      monthlyProse: "Elke maand op de 1e om 18:00",
      restoreButton: "Herstellen",
      restoreSuccess: "{count} evenement(en) hersteld",
      restoreNone: "Geen evenementen om te herstellen",
      restoreFailed: "Evenementen herstellen mislukt",
      restoreNoProfile: "Geen sjabloon geselecteerd",
      restorableCount: "{count} verwijderde evenement(en) kunnen worden hersteld"
    },
    created: "Sjabloon aangemaakt.",
    updated: "Sjabloon bijgewerkt.",
    deleted: "Sjabloon verwijderd.",
    confirmDelete: "Sjabloon \"{name}\" verwijderen?",
  },
  common: {
    syncing: "Gegevens synchroniseren...",
    ready: "Gereed",
    error: "Fout",
    offline: "Offline",
    online: "Online",
    resync: "Hersynchroniseren",
    update: "Update",
    updating: "Bezig met bijwerken",
    updateReady: "Herstarten",
    updateDownloading: "Update downloaden...",
    save: "Opslaan",
    cancel: "Annuleren",
    enable: "Inschakelen",
    loading: "Laden...",
    refresh: "Vernieuwen",
    edit: "Bewerken",
    delete: "Verwijderen",
    rateLimitError: "Rate-limiet bereikt. Wacht even en probeer het later opnieuw.",
    featuredEvent: "Uitgelicht evenement",
    groupFairEvent: "Opnemen in Groepsbeurs",
    noMatches: "Geen overeenkomsten.",
    noGroupsAccess: "Geen groepen met kalendertoegang",
    selectGroupPlaceholder: "Kies een groep",
    accessTypes: {
      public: "Openbaar",
      group: "Groep"
    },
    durationUnits: {
      day: "d",
      hour: "u",
      minute: "min"
    },
    weekdays: {
      monday: "Maandag",
      tuesday: "Dinsdag",
      wednesday: "Woensdag",
      thursday: "Donderdag",
      friday: "Vrijdag",
      saturday: "Zaterdag",
      sunday: "Zondag"
    },
    months: {
      january: "januari",
      february: "februari",
      march: "maart",
      april: "april",
      may: "mei",
      june: "juni",
      july: "juli",
      august: "augustus",
      september: "september",
      october: "oktober",
      november: "november",
      december: "december"
    },
    fields: {
      eventName: "Evenementnaam",
      description: "Beschrijving",
      category: "Categorie",
      tags: "Tags (max 5)",
      accessType: "Toegangstype",
      imageId: "Afbeeldings-ID (optioneel)",
      imageIdPlaceholder: "ex. file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "Melding versturen",
      timezone: "Tijdzone",
      duration: "Tijdsduur (DD:HH:MM)",
      languages: "Talen (max 3)",
      languagesHint: "{count} geselecteerd",
      filterLanguages: "Talen filteren...",
      platforms: "Platformen",
    },
    errors: {
      durationError: "Tijdsduur moet een positief getal zijn.",
      maxLanguages: "Maximaal 3 talen toegestaan.",
      noGroup: "Selecteer een groep.",
      requiredMultiple: "{fields} zijn verplicht.",
      requiredSingle: "{field} is verplicht."
    },
    exportJson: "JSON exporteren",
    importJson: "JSON importeren",
    labels: {
      group: "Groep",
      schedule: "Planning",
      series: "Serie",
      templates: "Sjablonen"
    },
    section: {
      scheduleSelection: "Planningselectie"
    },
    selectTemplate: "Selecteer een sjabloon"
  },
  wizard: {
    back: "Terug",
    next: "Volgende"
  },
  conflict: {
    title: "Evenementconflict",
    message: "Een evenement \"{title}\" staat al gepland op dit tijdstip.",
    changeTime: "Tijd opnieuw kiezen",
    continue: "Toch aanmaken"
  },
  schedules: {
    announcements: {
      hint: "Schakel de acties in die uitgevoerd worden wanneer dit sjabloon een evenement plaatst.",
      hintSeries: "Schakel de acties in die uitgevoerd worden wanneer deze serie aangemaakt of gewijzigd wordt.",
      title: "Aankondigingen"
    },
    empty: {
      all: "Geen planningen voor deze groep.",
      series: "Geen series voor deze groep.",
      templates: "Geen sjablonen voor deze groep."
    },
    filter: {
      all: "Alles",
      label: "Tonen"
    },
    info: {
      series: {
        bullet1: "VRChat genereert alle voorvallen serverzijde vooraf op basis van een herhalingsregel.",
        bullet2: "Instellen en vergeten — geen app nodig na het aanmaken.",
        bullet3: "Beperkingen: geen aankondigingen per evenement; de herhalingsregel kan niet worden gewijzigd zonder alle voorvallen opnieuw te genereren (wijzigingen gaan verloren).",
        bullet4: "Geschikt voor stabiele, terugkerende evenementen zonder aankondigingen.",
        title: "Series"
      },
      template: {
        bullet1: "Elk evenement wordt geplaatst als een onafhankelijk agenda-item — per voorval aanpasbaar.",
        bullet2: "Kondig elk evenement optioneel aan via geplande Discord-evenementen, webhooks en .ics-agenda-uitnodigingen.",
        bullet3: "Combineer met automatisering en patroon-gebaseerde planning voor publicatie zonder tussenkomst.",
        bullet4: "Vereist dat de app actief is voor automatische publicatie.",
        title: "Sjablonen"
      }
    },
    modeBlurb: {
      moreInfo: "(meer info)",
      series: "Een serie is VRChat's eigen terugkerende plannen-tool. De server genereert alle voorvallen vooraf. Geen aankondigingen.",
      template: "Sjablonen vullen herhaalde evenementen automatisch in en plaatsen elk voorval afzonderlijk, met optionele aankondigingen."
    },
    saveButton: {
      seriesCreate: "Serie aanmaken",
      template: "Sjabloon opslaan"
    },
    subtitle: "Sjablonen voor planning met aankondigingen en native terugkerende VRChat-series.",
    types: {
      templateButton: "Sjabloon"
    }
  },
  series: {
    confirmDelete: "\"{label}\" verwijderen? Hiermee verwijder je de serie en al zijn voorvallen uit VRChat.",
    confirmDeleteTitle: "Serie verwijderen?",
    created: "Serie \"{label}\" aangemaakt.",
    days: {
      fr: "Vr",
      mo: "Ma",
      sa: "Za",
      su: "Zo",
      th: "Do",
      tu: "Di",
      we: "Wo"
    },
    deleted: "Serie \"{label}\" verwijderd.",
    disclaimer: "Een serie kan alleen vóór het eerste voorval opnieuw gepland worden. Eenmaal gestart, moet je hem verwijderen om datum of tijd te wijzigen. Evenementen kunnen tot een jaar vooruit gepland worden. Maximale duur van een evenement is 31 dagen.",
    end: {
      afterDateLabel: "Op een specifieke datum",
      afterOccurrencesLabel: "Na N voorvallen",
      never: "Nooit",
      occurrencesLabel: "voorvallen"
    },
    errors: {
      createFailed: "Kon serie niet aanmaken.",
      deleteFailed: "Kon serie niet verwijderen.",
      noDaysOfWeek: "Selecteer ten minste één dag van de week.",
      noEndDate: "Stel een einddatum in.",
      noLabel: "Serie-label is verplicht.",
      noSeries: "Geen serie geselecteerd.",
      noStartDate: "Datum en tijd van het eerste voorval zijn verplicht.",
      noTitle: "Evenementnaam is verplicht.",
      notFound: "Serie niet gevonden.",
      regenFailed: "Kon serie niet opnieuw genereren.",
      startInPast: "Het eerste voorval moet in de toekomst liggen. Werk de datum bij voor het opslaan.",
      updateFailed: "Kon serie niet bijwerken."
    },
    frequency: {
      custom: "Aangepast",
      daily: "Dagelijks",
      monthly: "Maandelijks",
      weekdays: "Doordeweeks",
      weekends: "Weekends",
      weekly: "Wekelijks",
      yearly: "Jaarlijks"
    },
    labels: {
      daysOfWeek: "Herhaalt op",
      endCondition: "Eindigt",
      frequency: "Frequentie",
      interval: "Herhalen elke",
      startDate: "Datum eerste voorval",
      startTime: "Starttijd"
    },
    lockedHint: "Deze serie is al begonnen. Datum, tijd en herhalingsregel zijn vergrendeld — maar je kunt nog wel aanpassen wanneer hij eindigt. Klik op Ontgrendelen om opnieuw te plannen — bij opslaan wordt deze serie vervangen door een nieuwe.",
    rasterize: {
      retryIn: "Opnieuw proberen over {wait}.",
      retryNow: "Nu opnieuw proberen",
      statusText: "{count} evenement(en) wachten op aanmaak.{wait}"
    },
    regen: {
      choiceMessage: "Deze serie heeft {count} gewijzigd(e) evenement(en). De huidige serie wordt vervangen door een nieuwe.\n\n• Wijzigingen behouden: overlapt dezelfde dag, dan werkt het de nieuwe serie bij; voorvallen zonder overlap worden losstaand.\n• Wijzigingen verwerpen: aanpassingen aan die voorvallen gaan verloren.",
      choiceTitle: "Serie vervangen?",
      confirmAction: "Serie vervangen",
      confirmMessage: "Hiermee wordt de huidige serie vervangen door een nieuwe. Doorgaan?",
      discard: "Wijzigingen verwerpen",
      keep: "Wijzigingen behouden",
      success: "Serie \"{label}\" vervangen.",
      successWithMods: "Serie \"{label}\" vervangen. {count} wijziging(en) in wachtrij."
    },
    regenWarning: "De herhalingsregel is ontgrendeld. Als je de herhalingsregel wijzigt, wordt de huidige serie vervangen door een nieuwe.",
    regenWarningWithMods: "De herhalingsregel is ontgrendeld. Als je de herhalingsregel wijzigt, wordt de huidige serie vervangen door een nieuwe en wordt gevraagd hoe om te gaan met de {count} gewijzigde evenementen.",
    unit: {
      days: "dagen",
      months: "maanden",
      weeks: "weken",
      years: "jaren"
    },
    unlockButton: "Ontgrendelen",
    updateRequired: "Update beschikbaar. Werk bij voordat je series wijzigt.",
    updated: "Serie \"{label}\" bijgewerkt.",
    warnings: {
      confirmUpdate: "Serie bijwerken"
    }
  }
};