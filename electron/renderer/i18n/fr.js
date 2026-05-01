// French translations for VRChat Event Creator

export const fr = {
  nav: {
    create: "Créer un événement",
    modify: "Modifier les événements",
    settings: "Paramètres",
    schedules: "Gérer les planifications"
  },
  auth: {
    title: "Connexion",
    subtitle: "Identifiants VRChat requis",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    signIn: "Se connecter",
    logout: "Se déconnecter",
    sessionHint: "La session est mise en cache localement. Gardez votre fichier de cache privé.",
    loggingIn: "Connexion...",
    loginFailed: "Échec de la connexion.",
    sessionChecking: "Vérification de la session...",
    loginRequired: "Connexion requise.",
    loggedInAs: "Connecté en tant que {name}.",
    loggedOut: "Déconnecté."
  },
  twoFactor: {
    title: "Code d'authentification à deux facteurs",
    subtitle: "Entrez votre code d'authentification",
    codeLabel: "Code de vérification",
    submit: "Envoyer"
  },
  languageSetup: {
    title: "Choisir la langue",
    subtitle: "Sélectionnez votre langue pour commencer.",
    hint: "Vous pouvez modifier cela à tout moment dans les paramètres.",
    continue: "Continuer"
  },
  gallery: {
    title: "Galerie",
    subtitle: "Sélectionnez une image de la galerie pour utiliser son ID de fichier.",
    empty: "Aucune image de galerie trouvée.",
    loading: "Chargement de la galerie...",
    useButton: "Utiliser l'ID d'image",
    chooseButton: "Sélectionner",
    uploadButton: "Importer",
    uploadSuccess: "Image de galerie importée.",
    uploadFailed: "Impossible d'importer l'image.",
    uploadLimitReached: "La galerie est pleine (64 images). Supprimez-en une pour importer.",
    uploadTypeError: "Seules les images PNG ou JPG sont prises en charge.",
    uploadSizeError: "L'image doit faire moins de 10 Mo.",
    uploadMinDimensions: "L'image doit être supérieure à 64x64.",
    uploadMaxDimensions: "L'image doit être inférieure à 2048x2048.",
    loadMore: "Charger plus",
    loadFailed: "Impossible de charger la galerie."
  },
  settings: {
    theme: {
      title: "Thème",
      description: "Personnalisez l'apparence de l'application. Sélectionnez un préréglage ou ajustez manuellement.",
      presetLabel: "Thème actuel",
      nameLabel: "Nom du thème",
      namePlaceholder: "Nouveau nom de thème",
      saveButton: "Enregistrer le thème",
      deleteButton: "Supprimer le thème",
      resetButton: "Réinitialiser par défaut",
      savedLabel: "Thèmes enregistrés",
      customGroupLabel: "Personnalisé",
      customUnsaved: "Personnalisé (non enregistré)",
      importButton: "Importer un thème",
      exportButton: "Exporter le thème",
      openStudio: "Ouvrir le studio de thèmes",
      studio: {
        title: "Studio de thème",
        subtitle: "Prévisualisez et ajustez l'apparence de l'application. Prend en charge #RRGGBBAA pour les transparences personnalisées.",
        header: "En-tête",
        statusLabels: "Statut et libellés",
        accent: "Accent",
        panel: "Panneau",
        mutedText: "Texte atténué",
        primary: "Principal",
        ghost: "Fantôme",
        inputField: "Champ de saisie",
        dropdown: "Menu déroulant",
        dropdownOptionA: "Option déroulante A",
        dropdownOptionB: "Option déroulante B",
        dropdownOptionC: "Option déroulante C",
        dropdownOptionD: "Option déroulante D",
        previewLink: "Lien d'aperçu",
        toastPreview: "L'aperçu de toast utilise Panneau Alt",
        previewHint: "L'aperçu se met à jour en direct pendant vos ajustements."
      },
      fields: {
        accent: "Accent",
        bg: "Arrière-plan 1",
        bgDeep: "Arrière-plan 2",
        backdrop: "Arrière-plan 3",
        panel: "Panneau",
        panelAlt: "Panneau Alt",
        headerBg: "En-tête",
        overlay: "Superposition",
        text: "Texte",
        textMuted: "Texte atténué",
        link: "Lien",
        linkHover: "Lien survolé",
        button: "Bouton 1",
        button2: "Bouton 2",
        buttonText: "Texte du bouton",
        border: "Bordure",
        shadow: "Ombre",
        inputBg: "Arrière-plan de saisie",
        inputBgStrong: "Arrière-plan de saisie 2",
        inputText: "Texte de saisie",
        selectOptionBg: "Option sélectionnée",
        selectOptionHighlight: "Surbrillance de sélection",
        backdropOverlay: "Lueur d'arrière-plan",
        backdropGrid: "Grille d'arrière-plan",
        scanline: "Ligne de balayage"
      }
    },
    appInfo: {
      title: "Informations sur l'application",
      language: "Langue",
      version: "Version de l'application",
      dataFolder: "Dossier de données actuel",
      changeButton: "Changer",
      openButton: "Ouvrir",
      session: "Session",
      githubLabel: "Dépôt GitHub :",
      disclaimerLabel: "Avertissement :",
      disclaimerText: "Cette application est non officielle et n'est pas affiliée à VRChat. Utilisez-la à vos risques et périls. Les développeurs ne sont pas responsables des problèmes découlant de l'utilisation de cet outil."
    },
    general: {
      title: "Général",
      minimizeToTray: "Réduire dans la barre d'état système",
      startOnStartup: "Démarrer au démarrage du système",
      enableAdvanced: "Activer les paramètres avancés",
      enableImportExport: "Importer/Exporter des événements",
      autoUploadImages: "Télécharger automatiquement les images de galerie depuis les événements/modèles importés"
    },
    discord: {
      enable: "Activer l'intégration Discord",
      description: "Crée automatiquement des événements Discord lors de la création d'événements VRChat.",
      tokenLabel: "Jeton du bot",
      tokenPlaceholder: "Collez le jeton du bot",
      guildLabel: "ID du serveur",
      guildPlaceholder: "ex. 123456789012345678",
      testButton: "Vérifier le jeton",
      testSuccess: "Connecté en tant que {botName}",
      testFailed: "Échec de la connexion. Vérifiez le jeton du bot.",
      tokenMissing: "Veuillez d'abord entrer un jeton de bot.",
      selectGroup: "Sélectionner un groupe...",
      saveButton: "Enregistrer",
      saved: "Paramètres Discord enregistrés.",
      eventLabel: "Créer un événement Discord",
      syncSuccess: "Événement Discord créé pour « {title} »",
      syncFailed: "Synchronisation Discord échouée pour « {title} » : {error}"
    },
    webhook: {
      postLabel: "Publier le Webhook Discord",
      enableLabel: "Activer le Webhook",
      syncSuccess: "Webhook envoyé pour \"{title}\"",
      syncFailed: "Échec de livraison du webhook pour \"{title}\" : {error}"
    },
    calendar: {
      enable: "Activer la génération de fichiers calendrier",
      createInvite: "Créer une invitation calendrier .ics",
      enableReminders: "Activer les rappels calendrier .ics",
      addReminder: "Ajouter un Rappel",
      unit: {
        minutes: "minutes",
        hours: "heures",
        days: "jours"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Tester le Webhook",
      webhookTestSuccess: "Webhook vérifié : {webhookName}",
      webhookTestFailed: "Test du webhook échoué. Vérifiez l'URL.",
      webhookMissing: "Entrez d'abord une URL de webhook.",
      remindersHint: "Certaines applications de calendrier peuvent n'utiliser que le premier rappel.",
      saveDirLabel: "Répertoire de sauvegarde du calendrier",
      autoSaved: "Fichier calendrier sauvegardé : {filePath}",
      inviteTitle: "Invitation calendrier"
    },
    eckit: {
      importButton: "Importer le Kit",
      webhookName: "Nom du Webhook",
      webhookNamePlaceholder: "Événements de Mon Groupe",
      embedColor: "Couleur de l'Embed",
      avatarUrl: "URL de l'Avatar",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "Joindre un message personnalisé au webhook",
      messageTitle: "Message personnalisé du webhook",
      messagePlaceholder: "Écrivez un message personnalisé à inclure avec le webhook...",
      attachImage: "Joindre une image",
      noImage: "Aucune image sélectionnée",
      selectImage: "Sélectionner"
    },
    saveButton: "Enregistrer les paramètres",
    saved: "Paramètres enregistrés.",
    featuredVerification: {
      permissionDenied: "Ce groupe n'est pas autorisé à créer des événements en vedette."
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
    title: "Réduire dans la barre d'état système ?",
    message: "Vous pouvez modifier cela plus tard dans les paramètres.",
    yes: "Oui",
    no: "Non"
  },
  categories: {
    hangout: "Détente",
    exploration: "Exploration",
    roleplaying: "Jeu de rôle",
    film: "Films et médias",
    gaming: "Jeux",
    music: "Musique",
    dance: "Danse",
    performance: "Spectacle",
    arts: "Arts",
    avatars: "Avatars",
    education: "Éducation",
    wellness: "Bien-être",
    other: "Autre"
  },
  platforms: {
    pcWindows: "PC (Windows)",
    android: "Android (Quest, mobile, etc.)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "Groupe",
      date: "Date",
      details: "Détails",
      create: "Créer"
    },
    section: {
      groupProfile: "Groupe + Modèle",
      dateSelection: "Sélection de la date",
      details: "Détails de l'événement",
      readyTitle: "Prêt à créer ?",
      readyHint: "Vérifiez vos choix, puis créez l'événement."
    },
    labels: {
      groupRequired: "Groupe (obligatoire)",
      profileOptional: "Modèle (facultatif)",
      advanced: "Avancé",
      patternDates: "Dates de modèle",
      manualDate: "Date manuelle",
      manualTime: "Heure manuelle",
      dateSourceManual: "Manuel",
      dateSource: "Utiliser",
      dateSourcePattern: "Modèle"
    },
    hints: {
      profileDefaults: "Choisissez un modèle pour les valeurs par défaut, ou laissez vide pour créer manuellement.",
    },
    dateHints: {
      default: "Le mode manuel est prêt. Les modèles avec des modèles débloquent les options de date.",
      noProfile: "Aucun modèle sélectionné. Utilisez la date/heure manuelle.",
      manualReady: "Mode manuel prêt.",
      chooseGenerated: "Choisissez une date générée ou utilisez le mode manuel.",
      noUpcoming: "Aucune date à venir trouvée.",
      loadFailed: "Impossible de charger les dates du modèle."
    },
    profileHint: "Les modèles sont facultatifs. Utilisez-en un pour les valeurs par défaut ou créez tout manuellement.",
    loadProfile: "Charger un modèle (facultatif)",
    clearProfile: "Effacer le modèle",
    importSuccess: "Données de l'événement importées depuis JSON.",
    importWrongType: "Ceci semble être un JSON de modèle. Veuillez utiliser Importer le modèle à la place.",
    exportSuccess: "Données de l'événement exportées vers JSON.",
    dateOption: "Sélectionner une date",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "Restrictions de rôle",
      hint: "Optionnel - Si activé, seuls les rôles de groupe sélectionnés peuvent rejoindre.",
      optional: "Pour les modérateurs d'instance, tous les rôles au niveau ou au-dessus du rôle de modérateur le plus bas sélectionné peuvent rejoindre.",
      allAccess: "Aucun (Tout le monde peut rejoindre)",
      managementRoles: "Rôles de gestion",
      roles: "Rôles",
      noRoles: "Aucun rôle disponible pour ce groupe."
    },
    manualProfileOption: "Manuel (sans modèle)",
    pastDateError: "Impossible de sélectionner une date passée.",
    futureDateError: "Les événements ne peuvent être planifiés que jusqu'à 1 an à l'avance.",
    upcomingLimitNotice: "VRChat limite actuellement chaque groupe à 10 événements à venir.",
    upcomingCountGroupFallback: "Ce groupe",
    upcomingCountStatus: "Événements à venir pour {group} : {count}/{limit}.",
    upcomingCountUnknown: "Nombre d'événements à venir indisponible.",
    upcomingCountToast: "{group} a maintenant {count}/{limit} événements à venir.",
    upcomingLimitReached: "Limite atteinte : {group} a déjà {limit} événements à venir. Supprimez-en un ou reprogrammez-en un.",
    upcomingLimitError: "Limite atteinte : {group} a déjà {limit} événements à venir. Supprimez-en un ou reprogrammez-en un.",
    crossPlatformRateLimit: "Limite de débit. Des événements non suivis créés sur une autre plateforme peuvent compter dans votre limite. Réessayez dans {minutes} minutes.",
    unknownRateLimit: "Limite de débit. Réessayez plus tard.",
    upcomingCountRefresh: "Rafraîchir",
    createButton: "Créer l'événement",
    create: {
      warnConflicts: "M'avertir des événements en conflit",
      alreadyCreating: "Création d'un événement en cours, veuillez patienter..."
    },
    created: "Événement créé.",
    failed: "Impossible de créer l'événement.",
    selectDateError: "Sélectionnez une date.",
    updateRequired: "Mise à jour disponible. Mettez à jour avant de créer des événements.",
    featuredPermissionRevoked: "Ce groupe n'a plus la permission de créer des événements en vedette.",
    groupFairPermissionRevoked: "Ce groupe n'a plus la permission d'inclure des événements dans la Foire des Groupes."
  },
  modify: {
    subtitle: "Modifier ou supprimer les événements à venir du groupe.",
    countEmpty: "Événements à venir indisponibles.",
    countGroupFallback: "Ce groupe",
    countStatus: "Événements à venir pour {group} : {count}.",
    empty: "Aucun événement à venir.",
    dateUnknown: "Date indisponible",
    eventImage: "Image de l'événement",
    noImage: "Aucune image",
    untitled: "Événement sans titre",
    profileLoad: "Charger",
    profileSelectError: "Sélectionnez un modèle à charger.",
    profileLoadFailed: "Impossible de charger les valeurs du modèle.",
    profileLoaded: "Valeurs du modèle chargées.",
    manualDate: "Changer la date",
    manualTime: "Changer l'heure",
    modal: {
      title: "Modifier l'événement",
      subtitle: "Les changements ne sont appliqués que lorsque vous appuyez sur Enregistrer."
    },
    updateRequired: "Mise à jour disponible. Veuillez mettre à jour avant de modifier des événements.",
    selectEventError: "Sélectionnez un événement à modifier.",
    selectDateError: "Sélectionnez une date et une heure.",
    saveFailed: "Impossible de mettre à jour l'événement.",
    saved: "Événement mis à jour.",
    deleteFailed: "Impossible de supprimer l'événement.",
    deleted: "Événement supprimé.",
    loadFailed: "Impossible de charger les événements.",
    missedAutomationNoticeSingular: "1 événement n'a pas pu être publié à son heure automatisée programmée.",
    missedAutomationNoticePlural: "{count} événements n'ont pas pu être publiés à leurs heures automatisées programmées.",
    queuedAutomationNoticeSingular: "Limite de taux: 1 événement en attente est en file d'attente, attendant que les limites de taux soient levées.",
    queuedAutomationNoticePlural: "Limite de taux: {count} événements en attente sont en file d'attente, attendant que les limites de taux soient levées.",
    pending: {
      postNow: "Publier maintenant",
      edit: "Modifier",
      cancel: "Annuler",
      publishAt: "Publication le: {time}",
      missedHint: "Cette automatisation a été manquée. Publiez maintenant ou supprimez.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "Événement publié avec succès.",
      postFailed: "Impossible de publier l'événement.",
      cancelled: "Événement en attente annulé.",
      cancelFailed: "Impossible d'annuler l'événement en attente.",
      editSaved: "Événement en attente mis à jour.",
      editFailed: "Impossible de mettre à jour l'événement en attente."
    },
    postingOptions: "Options de publication",
    badge: {
      modified: "Modifié"
    },
    filters: {
      heading: "Afficher",
      modified: "Occurrences modifiées",
      pending: "Événements en attente",
      standalone: "Événements indépendants"
    },
    filtersButton: "Filtres",
    timeRange: {
      "1month": "1 mois",
      "1week": "1 semaine",
      "1year": "1 an",
      "2weeks": "2 semaines",
      "3months": "3 mois",
      "6months": "6 mois",
      label: "Plage temporelle"
    }
  },
  profiles: {
    steps: {
      select: "Sélection",
      basics: "Bases",
      schedule: "Planning",
      audience: "Public"
    },
    section: {
      basics: "Bases du modèle",
      audience: "Public"
    },
    labels: {
    },
    buttons: {
      new: "Nouveau"
    },
    importSuccess: "Données du modèle importées depuis JSON.",
    importWrongType: "Ceci semble être un JSON d'événement. Veuillez utiliser Importer un événement à la place.",
    exportSuccess: "Données du modèle exportées vers JSON.",
    hints: {
      groupAccess: "Choisissez un groupe avec accès au calendrier.",
      patternsInfo: "Les modèles servent à pré-générer les dates à venir."
    },
    existingProfilePlaceholder: "Sélectionner un modèle",
    displayName: "Nom du modèle",
    displayNamePlaceholder: "Modèle de rencontre communautaire",
    durationDefault: "Durée par défaut (DD:HH:MM)",
    dateMode: "Mode de date",
    dateModePattern: "Basé sur un modèle",
    dateModeManual: "Manuel uniquement",
    dateModeBoth: "Modèles + manuel",
    sendNotificationDefault: "Envoyer une notification par défaut",
    patterns: {
      addButton: "Ajouter un modèle",
      clearButton: "Effacer les modèles",
      noPatterns: "Aucun modèle pour l'instant.",
      removeButton: "Retirer",
      patternType: "Type de modèle",
      weekday: "Jour de la semaine",
      time: "Heure",
      confirmClear: "Effacer tous les modèles ?",
      selectAll: "Sélectionnez le type de modèle, le jour et l'heure.",
      selectPattern: "Sélectionner un modèle",
      selectWeekday: "Sélectionner un jour",
      types: {
        every: "Chaque [jour]",
        everyOther: "Un [jour] sur deux",
        nth1: "Chaque 1er [jour] du mois",
        nth2: "Chaque 2e [jour] du mois",
        nth3: "Chaque 3e [jour] du mois",
        nth4: "Chaque 4e [jour] du mois",
        last: "Chaque dernier [jour] du mois",
        annual: "Chaque année le [date]"
      },
      format: {
        every: "Chaque {weekday} à {time}",
        everyOther: "Un {weekday} sur deux à {time}",
        last: "Dernier {weekday} à {time}",
        nth: "Le {ordinal} {weekday} à {time}",
        annual: "Chaque année le {month} {day} à {time}"
      },
      ordinal1: "1er",
      ordinal2: "2e",
      ordinal3: "3e",
      ordinal4: "4e",
      date: "Date",
      selectMonth: "Sélectionner le mois"
    },
    automation: {
      title: "Automatisation (Expérimental)",
      description: "Publier automatiquement des événements selon vos modèles. Les événements apparaîtront comme \"En attente\" dans Modifier les événements.",
      enableLabel: "Activer l'automatisation",
      timingLabel: "Règle de planification",
      frequencyLabel: "Chronométrage (JJ:HH:MM)",
      timingModes: {
        before: "Avant le début de l'événement",
        after: "Après la fin de l'événement précédent",
        monthly: "Mensuellement à une date spécifique"
      },
      monthlyDay: "Jour du mois",
      monthlyTime: "Heure",
      repeatMode: "Répéter",
      repeatModes: {
        indefinite: "Indéfiniment",
        count: "Nombre fixe"
      },
      repeatCount: "Événements à créer",
      patternsRequired: "Au moins un modèle est requis pour l'automatisation",
      confirmTitle: "Activer l'automatisation ?",
      confirmEnable: "L'automatisation nécessite que l'application soit en cours d'exécution pour publier les événements. Les automatisations manquées peuvent être gérées depuis l'onglet Modifier les événements.",
      offsetCorrected: "Le décalage ({oldOffset} jours) a dépassé la fréquence du modèle ({frequency} jours). Passé en mode \"avant\" avec un décalage de {newOffset} jours.",
      offsetCapped: "Le décalage ({oldOffset} jours) a dépassé la fréquence du modèle. Limité à {newOffset} jours.",
      prose: {
        day: "1 jour",
        days: "{count} jours",
        hour: "1 heure",
        hours: "{count} heures",
        minute: "1 minute",
        minutes: "{count} minutes",
        and: "et",
        noTime: "—",
        before: "Publier le prochain événement {time} avant qu'il ne commence.",
        after: "Publier le prochain événement {time} après la fin de l'événement précédent.",
        monthly: "Le {day}{ordinal} de chaque mois à {time}"
      },
      helpers: {
      },
      offsetProse: "Publier le prochain événement 7 jours avant qu'il ne commence.",
      monthlyProse: "Le 1er de chaque mois à 18:00",
      restoreButton: "Restaurer",
      restoreSuccess: "{count} événement(s) restauré(s)",
      restoreNone: "Aucun événement à restaurer",
      restoreFailed: "Échec de la restauration des événements",
      restoreNoProfile: "Aucun modèle sélectionné",
      restorableCount: "{count} événement(s) supprimé(s) peuvent être restauré(s)"
    },
    created: "Modèle créé.",
    updated: "Modèle mis à jour.",
    deleted: "Modèle supprimé.",
    confirmDelete: "Supprimer le modèle \"{name}\" ?",
  },
  common: {
    syncing: "Synchronisation des données...",
    ready: "Prêt",
    error: "Erreur",
    offline: "Hors ligne",
    online: "En ligne",
    resync: "Resynchroniser",
    update: "Mise à jour",
    updating: "Mise à jour",
    updateReady: "Redémarrer",
    updateDownloading: "Téléchargement de la mise à jour...",
    save: "Enregistrer",
    cancel: "Annuler",
    enable: "Activer",
    loading: "Chargement...",
    refresh: "Actualiser",
    edit: "Modifier",
    delete: "Supprimer",
    rateLimitError: "Limite de débit. Veuillez patienter et réessayer plus tard.",
    featuredEvent: "Événement en vedette",
    groupFairEvent: "Inclure dans la Foire des Groupes",
    noMatches: "Aucune correspondance.",
    noGroupsAccess: "Aucun groupe avec accès au calendrier",
    selectGroupPlaceholder: "Choisir un groupe",
    accessTypes: {
      public: "Public",
      group: "Groupe"
    },
    durationUnits: {
      day: "j",
      hour: "h",
      minute: "min"
    },
    weekdays: {
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche"
    },
    months: {
      january: "Janvier",
      february: "Février",
      march: "Mars",
      april: "Avril",
      may: "Mai",
      june: "Juin",
      july: "Juillet",
      august: "Août",
      september: "Septembre",
      october: "Octobre",
      november: "Novembre",
      december: "Décembre"
    },
    fields: {
      eventName: "Nom de l'événement",
      description: "Description",
      category: "Catégorie",
      tags: "Tags (max. 5)",
      accessType: "Type d'accès",
      imageId: "ID d'image (facultatif)",
      imageIdPlaceholder: "ex. file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "Envoyer une notification",
      timezone: "Fuseau horaire",
      duration: "Durée (DD:HH:MM)",
      languages: "Langues (max 3)",
      languagesHint: "{count} sélectionnées",
      filterLanguages: "Filtrer les langues...",
      platforms: "Plateformes",
    },
    errors: {
      durationError: "La durée doit être un nombre positif.",
      maxLanguages: "Maximum 3 langues autorisées.",
      noGroup: "Sélectionnez un groupe.",
      requiredMultiple: "{fields} sont requis.",
      requiredSingle: "{field} est requis."
    },
    exportJson: "Exporter JSON",
    importJson: "Importer JSON",
    labels: {
      group: "Groupe",
      schedule: "Planification",
      series: "Série",
      templates: "Modèles"
    },
    section: {
      scheduleSelection: "Sélection de la planification"
    },
    selectTemplate: "Sélectionner un modèle"
  },
  wizard: {
    back: "Retour",
    next: "Suivant"
  },
  conflict: {
    title: "Conflit d'événement",
    message: "Un événement \"{title}\" est déjà programmé à cette heure.",
    changeTime: "Resélectionner l'heure",
    continue: "Créer quand même"
  },
  schedules: {
    announcements: {
      hint: "Activez les actions à effectuer lorsque ce modèle publie un événement.",
      hintSeries: "Activez les actions à effectuer lorsque cette série est créée ou modifiée.",
      title: "Annonces"
    },
    empty: {
      all: "Aucune planification pour ce groupe.",
      series: "Aucune série pour ce groupe.",
      templates: "Aucun modèle pour ce groupe."
    },
    filter: {
      all: "Tout",
      label: "Afficher"
    },
    info: {
      series: {
        bullet1: "VRChat pré-génère toutes les occurrences côté serveur à partir d'une règle de récurrence.",
        bullet2: "Configurez puis oubliez — aucune application requise après la création.",
        bullet3: "Limitations : pas d'annonces par événement ; la règle de récurrence ne peut pas être modifiée sans régénérer toutes les occurrences (les modifications sont perdues).",
        bullet4: "Idéal pour des événements stables et répétitifs qui n'ont pas besoin d'annonces.",
        title: "Séries"
      },
      template: {
        bullet1: "Chaque événement est publié comme une entrée de calendrier indépendante — modifiable par occurrence.",
        bullet2: "Annoncez optionnellement chaque événement via les événements programmés Discord, les webhooks et les invitations calendrier .ics.",
        bullet3: "Combinez avec l'automatisation et la planification par motifs pour une publication sans intervention.",
        bullet4: "Nécessite que l'application soit en cours d'exécution pour la publication automatique.",
        title: "Modèles"
      }
    },
    modeBlurb: {
      moreInfo: "(plus d'infos)",
      series: "Une série est le planificateur récurrent natif de VRChat. Le serveur pré-génère toutes les occurrences. Pas d'annonces.",
      template: "Les modèles remplissent automatiquement les événements répétés et publient chaque occurrence individuellement avec des annonces optionnelles."
    },
    saveButton: {
      seriesCreate: "Créer la série",
      template: "Enregistrer le modèle"
    },
    subtitle: "Modèles pour la planification avec annonces et séries récurrentes natives de VRChat.",
    types: {
      templateButton: "Modèle"
    }
  },
  series: {
    confirmDelete: "Supprimer « {label} » ? Cela supprimera la série et toutes ses occurrences de VRChat.",
    confirmDeleteTitle: "Supprimer la série ?",
    created: "Série « {label} » créée.",
    days: {
      fr: "Ven",
      mo: "Lun",
      sa: "Sam",
      su: "Dim",
      th: "Jeu",
      tu: "Mar",
      we: "Mer"
    },
    deleted: "Série « {label} » supprimée.",
    disclaimer: "Une série ne peut être reprogrammée qu'avant le début de sa première occurrence. Une fois commencée, vous devez la supprimer pour changer la date ou l'heure. Les événements peuvent être planifiés jusqu'à un an à l'avance. La durée maximale d'un événement est de 31 jours.",
    end: {
      afterDateLabel: "À une date précise",
      afterOccurrencesLabel: "Après N occurrences",
      never: "Jamais",
      occurrencesLabel: "occurrences"
    },
    errors: {
      createFailed: "Impossible de créer la série.",
      deleteFailed: "Impossible de supprimer la série.",
      noDaysOfWeek: "Sélectionnez au moins un jour de la semaine.",
      noEndDate: "Définissez une date de fin.",
      noLabel: "L'étiquette de la série est requise.",
      noSeries: "Aucune série sélectionnée.",
      noStartDate: "La date et l'heure de la première occurrence sont requises.",
      noTitle: "Le nom de l'événement est requis.",
      notFound: "Série introuvable.",
      regenFailed: "Impossible de régénérer la série.",
      startInPast: "La première occurrence doit être dans le futur. Mettez à jour la date avant d'enregistrer.",
      updateFailed: "Impossible de mettre à jour la série."
    },
    frequency: {
      custom: "Personnalisé",
      daily: "Quotidien",
      monthly: "Mensuel",
      weekdays: "Jours de semaine",
      weekends: "Week-ends",
      weekly: "Hebdomadaire",
      yearly: "Annuel"
    },
    labels: {
      daysOfWeek: "Répéter le",
      endCondition: "Se termine",
      frequency: "Fréquence",
      interval: "Répéter tous les",
      startDate: "Date de la première occurrence",
      startTime: "Heure de début"
    },
    lockedHint: "Cette série a déjà commencé. La date, l'heure et la règle de répétition sont verrouillées — mais vous pouvez encore ajuster la fin. Pour reprogrammer, cliquez sur Déverrouiller — l'enregistrement remplacera cette série par une nouvelle.",
    rasterize: {
      retryIn: "Nouvelle tentative dans {wait}.",
      retryNow: "Réessayer maintenant",
      statusText: "{count} événement(s) en attente de création.{wait}"
    },
    regen: {
      choiceMessage: "Cette série a {count} événement(s) modifié(s). La série actuelle sera remplacée par une nouvelle.\n\n• Conserver les modifications : les chevauchements le même jour mettent à jour la nouvelle série ; les événements sans chevauchement deviennent autonomes.\n• Ignorer les modifications : les changements apportés à ces occurrences sont perdus.",
      choiceTitle: "Remplacer la série ?",
      confirmAction: "Remplacer la série",
      confirmMessage: "Cela remplacera la série actuelle par une nouvelle. Continuer ?",
      discard: "Ignorer les modifications",
      keep: "Conserver les modifications",
      success: "Série « {label} » remplacée.",
      successWithMods: "Série « {label} » remplacée. {count} modification(s) en file d'attente."
    },
    regenWarning: "La récurrence est déverrouillée. Si vous changez la récurrence, la série actuelle sera remplacée par une nouvelle.",
    regenWarningWithMods: "La récurrence est déverrouillée. Si vous changez la récurrence, la série actuelle sera remplacée par une nouvelle et il vous sera demandé comment gérer ses {count} événements modifiés.",
    unit: {
      days: "jours",
      months: "mois",
      weeks: "semaines",
      years: "ans"
    },
    unlockButton: "Déverrouiller",
    updateRequired: "Mise à jour disponible. Veuillez mettre à jour avant de modifier des séries.",
    updated: "Série « {label} » mise à jour.",
    warnings: {
      confirmUpdate: "Mettre à jour la série"
    }
  }
};