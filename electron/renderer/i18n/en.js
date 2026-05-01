// English translations for VRChat Event Creator

export const en = {
  nav: {
    create: "Create Event",
    modify: "Modify Events",
    schedules: "Manage Schedules",
    settings: "Settings"
  },
  schedules: {
    subtitle: "Templates for announcement-driven scheduling and native VRChat recurring series.",
    saveButton: {
      template: "Save Template",
      seriesCreate: "Create Series"
    },
    announcements: {
      title: "Announcements",
      hint: "Toggle the actions to perform when this schedule posts an event.",
      hintSeries: "Toggle the actions to perform when this series is created or modified."
    },
    modeBlurb: {
      template: "Templates autofill repeated events and post each occurrence individually with optional announcements.",
      series: "A series is VRChat's native recurring event scheduler. The server pre-generates all occurrences. No announcements.",
      moreInfo: "(more info)"
    },
    info: {
      template: {
        title: "Templates",
        bullet1: "Each event posts as an independent calendar entry — modifiable per occurrence.",
        bullet2: "Optionally announce each event via Discord scheduled events, webhooks, and .ics calendar invites.",
        bullet3: "Combine with automation and pattern-based scheduling for hands-off posting.",
        bullet4: "Requires the app to be running for automated posting."
      },
      series: {
        title: "Series",
        bullet1: "VRChat pre-generates all occurrences server-side from a recurrence rule.",
        bullet2: "Set-and-forget — no app required after creation.",
        bullet3: "Limitations: no per-event announcements; the recurrence rule cannot be changed without regenerating all occurrences (modifications are lost).",
        bullet4: "Best for stable, repeating events that don't need announcements."
      }
    },
    filter: {
      label: "Show",
      all: "All"
    },
    types: {
      templateButton: "Template",
    },
    empty: {
      all: "No schedules for this group.",
      templates: "No templates for this group.",
      series: "No series for this group."
    },
    new: {
    }
  },
  series: {
    section: {
    },
    labels: {
      startDate: "First Occurrence Date",
      startTime: "Start Time",
      frequency: "Frequency",
      interval: "Repeat every",
      daysOfWeek: "Repeats on",
      endCondition: "Ends"
    },
    frequency: {
      daily: "Daily",
      weekly: "Weekly",
      weekdays: "Weekdays",
      weekends: "Weekends",
      monthly: "Monthly",
      yearly: "Yearly",
      custom: "Custom"
    },
    unit: {
      days: "days",
      weeks: "weeks",
      months: "months",
      years: "years"
    },
    days: {
      mo: "Mon",
      tu: "Tue",
      we: "Wed",
      th: "Thu",
      fr: "Fri",
      sa: "Sat",
      su: "Sun"
    },
    end: {
      never: "Never",
      afterOccurrencesLabel: "After N occurrences",
      afterDateLabel: "On a specific date",
      occurrencesLabel: "occurrences"
    },
    disclaimer: "A series can only be rescheduled before its first occurrence begins. Once it starts, you must delete it to change the date or time. Events can be scheduled up to one year ahead. Maximum event length is 31 days.",
    lockedHint: "This series has already started. Date, time, and the repeat rule are locked — but you can still adjust when it ends. To reschedule, click Unlock — saving will replace this series with a new one.",
    unlockButton: "Unlock",
    regenWarning: "Recurrence is unlocked. If you change the recurrence, the current series will be replaced with a new one.",
    regenWarningWithMods: "Recurrence is unlocked. If you change the recurrence, the current series will be replaced with a new one and you'll be asked how to handle its {count} modified events.",
    regen: {
      confirmMessage: "This will replace the current series with a new one. Continue?",
      confirmAction: "Replace Series",
      choiceTitle: "Replace series?",
      choiceMessage: "This series has {count} modified events. The current series will be replaced with a new one.\n\n• Keep modifications: same-day overlaps update the new series; non-overlap events become standalones.\n• Discard modifications: changes to those occurrences are lost.",
      keep: "Keep Modifications",
      discard: "Discard Modifications",
      success: "Series \"{label}\" replaced.",
      successWithMods: "Series \"{label}\" replaced. {count} modifications queued."
    },
    rasterize: {
      statusText: "{count} pending event(s) waiting to be created.{wait}",
      retryIn: "Next retry in {wait}.",
      retryNow: "Retry Now"
    },
    buttons: {
    },
    created: "Series \"{label}\" created.",
    updated: "Series \"{label}\" updated.",
    deleted: "Series \"{label}\" deleted.",
    confirmDelete: "Delete \"{label}\"? This will remove the series and all its occurrences from VRChat.",
    confirmDeleteTitle: "Delete series?",
    updateRequired: "Update available. Please update before changing series.",
    warnings: {
      confirmUpdate: "Update Series"
    },
    errors: {
      noLabel: "Series label is required.",
      noTitle: "Event name is required.",
      noStartDate: "First occurrence date and time are required.",
      startInPast: "First occurrence must be in the future. Update the date before saving.",
      noDaysOfWeek: "Select at least one day of the week.",
      noEndDate: "Set an end date.",
      notFound: "Series not found.",
      createFailed: "Could not create series.",
      updateFailed: "Could not update series.",
      deleteFailed: "Could not delete series.",
      regenFailed: "Could not regenerate series.",
      noSeries: "No series selected."
    }
  },
  auth: {
    title: "Access Node",
    subtitle: "VRChat credentials required",
    username: "Username",
    password: "Password",
    signIn: "Sign In",
    logout: "Logout",
    sessionHint: "Session is cached locally. Keep your cache file private.",
    loggingIn: "Logging in...",
    loginFailed: "Login failed.",
    sessionChecking: "Checking session...",
    loginRequired: "Login required.",
    loggedInAs: "Logged in as {name}.",
    loggedOut: "Logged out."
  },
  twoFactor: {
    title: "Two-Factor Code",
    subtitle: "Enter your authentication code",
    codeLabel: "Code",
    submit: "Submit"
  },
  languageSetup: {
    title: "Choose Language",
    subtitle: "Select your language to get started.",
    hint: "You can change this anytime in Settings.",
    continue: "Continue"
  },
  gallery: {
    title: "Gallery",
    subtitle: "Select a gallery image to use its file ID.",
    empty: "No gallery images found.",
    loading: "Loading gallery...",
    useButton: "Use Image ID",
    chooseButton: "Select",
    uploadButton: "Upload",
    uploadSuccess: "Gallery image uploaded.",
    uploadFailed: "Could not upload image.",
    uploadLimitReached: "Gallery is full (64 images). Delete one to upload.",
    uploadTypeError: "Only PNG or JPG images are supported.",
    uploadSizeError: "Image must be smaller than 10 MB.",
    uploadMinDimensions: "Image must be larger than 64x64.",
    uploadMaxDimensions: "Image must be smaller than 2048x2048.",
    loadMore: "Load more",
    loadFailed: "Could not load gallery."
  },
  settings: {
    featuredVerification: {
      permissionDenied: "This group is not permitted to create featured events."
    },
    theme: {
      title: "Theme",
      description: "Customize the appearance of the app. Select a preset or adjust manually.",
      presetLabel: "Current Theme",
      nameLabel: "Theme Name",
      namePlaceholder: "New theme name",
      saveButton: "Save Theme",
      deleteButton: "Delete Theme",
      resetButton: "Reset to Default",
      savedLabel: "Saved Themes",
      customGroupLabel: "Custom",
      customUnsaved: "Custom (unsaved)",
      importButton: "Import Theme",
      exportButton: "Export Theme",
      openStudio: "Open Theme Studio",
      studio: {
        title: "Theme Studio",
        subtitle: "Preview and fine-tune the appearance of the app. Supports #RRGGBBAA for custom transparencies.",
        header: "Header",
        statusLabels: "Status and labels",
        accent: "Accent",
        panel: "Panel",
        mutedText: "Muted text",
        primary: "Primary",
        ghost: "Ghost",
        inputField: "Input field",
        dropdown: "Dropdown",
        dropdownOptionA: "Dropdown option A",
        dropdownOptionB: "Dropdown option B",
        dropdownOptionC: "Dropdown option C",
        dropdownOptionD: "Dropdown option D",
        previewLink: "Preview link",
        toastPreview: "Toast preview uses Panel Alt",
        previewHint: "Preview updates live as you tweak colors."
      },
      fields: {
        accent: "Accent",
        bg: "Background 1",
        bgDeep: "Background 2",
        backdrop: "Background 3",
        panel: "Panel",
        panelAlt: "Panel Alt",
        headerBg: "Header",
        overlay: "Overlay",
        text: "Text",
        textMuted: "Text Muted",
        link: "Link",
        linkHover: "Link Hover",
        button: "Button 1",
        button2: "Button 2",
        buttonText: "Button Text",
        border: "Border",
        shadow: "Shadow",
        inputBg: "Input Background",
        inputBgStrong: "Input Background 2",
        inputText: "Input Text",
        selectOptionBg: "Select Option",
        selectOptionHighlight: "Select Highlight",
        backdropOverlay: "Backdrop Glow",
        backdropGrid: "Backdrop Grid",
        scanline: "Scanline"
      }
    },
    appInfo: {
      title: "Application Info",
      language: "Language",
      version: "App Version",
      dataFolder: "Current Data Folder",
      changeButton: "Change",
      openButton: "Open",
      session: "Session",
      githubLabel: "GitHub Repository:",
      disclaimerLabel: "Disclaimer:",
      disclaimerText: "This application is unofficial and not affiliated with VRChat. Use at your own risk. The developers are not responsible for any issues arising from use of this tool."
    },
    general: {
      title: "General",
      minimizeToTray: "Minimize to system tray",
      startOnStartup: "Start on system startup",
      enableAdvanced: "Enable advanced settings",
      enableImportExport: "Import/Export Events",
      autoUploadImages: "Automatically upload gallery images from imported events/templates"
    },
    discord: {
      enable: "Enable Discord integration",
      description: "Automatically create Discord Events when VRChat events are posted.",
      tokenLabel: "Bot Token",
      tokenPlaceholder: "Paste your bot token",
      guildLabel: "Server ID",
      guildPlaceholder: "e.g. 123456789012345678",
      testButton: "Verify Bot Token",
      testSuccess: "Connected as {botName}",
      testFailed: "Connection failed. Check your bot token.",
      tokenMissing: "Enter a bot token first.",
      selectGroup: "Select a group...",
      saveButton: "Save",
      saved: "Discord settings saved.",
      eventLabel: "Create Discord Event",
      syncSuccess: "Discord event created for \"{title}\"",
      syncFailed: "Discord sync failed for \"{title}\": {error}"
    },
    webhook: {
      postLabel: "Post Discord Webhook",
      enableLabel: "Enable Webhook",
      syncSuccess: "Webhook sent for \"{title}\"",
      syncFailed: "Webhook delivery failed for \"{title}\": {error}"
    },
    calendar: {
      enable: "Enable calendar file generation",
      inviteTitle: "Calendar Invite",
      createInvite: "Create .ics Calendar Invite",
      enableReminders: "Enable .ics Calendar Reminders",
      addReminder: "Add Reminder",
      unit: {
        minutes: "minutes",
        hours: "hours",
        days: "days"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Test Webhook",
      webhookTestSuccess: "Webhook verified: {webhookName}",
      webhookTestFailed: "Webhook test failed. Check the URL.",
      webhookMissing: "Enter a webhook URL first.",
      remindersHint: "Some calendar apps may only use the first reminder.",
      saveDirLabel: "Calendar save directory",
      autoSaved: "Calendar file saved: {filePath}"
    },
    eckit: {
      importButton: "Import Kit",
      webhookName: "Webhook Display Name",
      webhookNamePlaceholder: "My Group Events",
      embedColor: "Embed Color",
      avatarUrl: "Avatar URL",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "Attach Custom Webhook Message",
      messageTitle: "Custom Webhook Message",
      messagePlaceholder: "Write a custom message to include with the webhook post...",
      attachImage: "Attach Image",
      noImage: "No image selected",
      selectImage: "Select"
    },
    saveButton: "Save Settings",
    saved: "Settings saved."
  },
  demo: {
    controls: {
      title: "Demo Controls",
      updateGateLabel: "Force Update Required",
      updateGateHint: "Blocks event creation/modification and shows update-required toasts."
    }
  },
  trayPrompt: {
    title: "Minimize to System Tray?",
    message: "You can change this later in Settings.",
    yes: "Yes",
    no: "No"
  },
  categories: {
    hangout: "Hangout",
    exploration: "Exploration",
    roleplaying: "Roleplaying",
    film: "Film and Media",
    gaming: "Gaming",
    music: "Music",
    dance: "Dance",
    performance: "Performance",
    arts: "Arts",
    avatars: "Avatars",
    education: "Education",
    wellness: "Wellness",
    other: "Other"
  },
  platforms: {
    pcWindows: "PC (Windows)",
    android: "Android (Quest, mobile, etc)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "Group",
      date: "Date",
      details: "Details",
      create: "Create"
    },
    section: {
      groupProfile: "Group + Template",
      dateSelection: "Date Selection",
      details: "Event Details",
      readyTitle: "Ready to create?",
      readyHint: "Review your selections, then create the event."
    },
    labels: {
      groupRequired: "Group (required)",
      profileOptional: "Template (optional)",
      advanced: "Advanced",
      dateSource: "Use",
      dateSourcePattern: "Pattern",
      dateSourceManual: "Manual",
      patternDates: "Pattern Dates",
      manualDate: "Manual Date",
      manualTime: "Manual Time"
    },
    hints: {
      profileDefaults: "Pick a template for defaults, or leave blank to create manually.",
    },
    dateHints: {
      default: "Manual mode is ready. Templates with patterns unlock date options.",
      noProfile: "No template selected. Use manual date/time.",
      manualReady: "Manual mode ready.",
      chooseGenerated: "Choose a generated date or use manual.",
      noUpcoming: "No upcoming dates found.",
      loadFailed: "Could not load pattern dates."
    },
    profileHint: "Templates are optional. Use one for defaults, or create everything manually.",
    loadProfile: "Load Template (optional)",
    clearProfile: "Clear Template",
    importSuccess: "Event data imported from JSON.",
    importWrongType: "This appears to be a template JSON. Please use Import Template instead.",
    exportSuccess: "Event data exported to JSON.",
    dateOption: "Select Date",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "Role Restrictions",
      hint: "Optional - If enabled, only the selected group roles may join.",
      optional: "For instance moderators, all roles at or above the lowest selected moderator role may join.",
      allAccess: "None (Everyone can join)",
      managementRoles: "Management Roles",
      roles: "Roles",
      noRoles: "No roles available for this group."
    },
    manualProfileOption: "Manual (no template)",
    pastDateError: "Cannot select a past date.",
    futureDateError: "Events can only be scheduled up to 1 year in advance.",
    upcomingLimitNotice: "VRChat currently prevents us from creating more than 10 events per-group per-hour.",
    upcomingCountGroupFallback: "This group",
    upcomingCountStatus: "Events created for {group} this hour: {count}/{limit}.",
    upcomingCountUnknown: "Event creation count unavailable.",
    upcomingCountToast: "Events created for {group} this hour: {count}/{limit}.",
    upcomingLimitReached: "Event creation is temporarily restricted. Please wait and try again later.",
    upcomingLimitError: "Event creation failed. Please wait and try again.",
    crossPlatformRateLimit: "Rate Limited. Untracked events created on another platform may count toward your limit. Try again in {minutes} minutes.",
    unknownRateLimit: "Rate limited. Try again later.",
    upcomingCountRefresh: "Refresh",
    createButton: "Create Event",
    create: {
      warnConflicts: "Warn me about conflicting events",
      alreadyCreating: "Already creating an event, please wait..."
    },
    created: "Event created.",
    failed: "Could not create event.",
    selectDateError: "Select a date.",
    updateRequired: "Update available. Please update before creating events.",
    featuredPermissionRevoked: "This group no longer has permission to create featured events.",
    groupFairPermissionRevoked: "This group no longer has permission to include events in the Group Fair."
  },
  modify: {
    subtitle: "Edit or delete upcoming group events.",
    filter: {
    },
    filtersButton: "Filters",
    timeRange: {
      label: "Time Range",
      "1week": "1 week",
      "2weeks": "2 weeks",
      "1month": "1 month",
      "3months": "3 months",
      "6months": "6 months",
      "1year": "1 year"
    },
    filters: {
      heading: "Show",
      pending: "Pending events",
      standalone: "Standalone events",
      modified: "Modified occurrences"
    },
    badge: {
      modified: "Modified"
    },
    countEmpty: "Upcoming events unavailable.",
    countGroupFallback: "This group",
    countStatus: "Upcoming events for {group}: {count}.",
    empty: "No upcoming events.",
    dateUnknown: "Date unavailable",
    eventImage: "Event image",
    noImage: "No image",
    untitled: "Untitled event",
    profileLoad: "Load",
    profileSelectError: "Select a template to load.",
    profileLoadFailed: "Could not load template defaults.",
    profileLoaded: "Template defaults loaded.",
    manualDate: "Change Date",
    manualTime: "Change Time",
    modal: {
      title: "Edit Event",
      subtitle: "Changes are only applied when you press Save."
    },
    updateRequired: "Update available. Please update before modifying events.",
    selectEventError: "Select an event to edit.",
    selectDateError: "Select a date and time.",
    saveFailed: "Could not update event.",
    saved: "Event updated.",
    deleteFailed: "Could not delete event.",
    deleted: "Event deleted.",
    loadFailed: "Could not load events.",
    missedAutomationNoticeSingular: "1 event could not be posted at its scheduled automated time.",
    missedAutomationNoticePlural: "{count} events could not be posted at their scheduled automated time.",
    queuedAutomationNoticeSingular: "Rate Limited: 1 pending event is queued, waiting on rate limits to lift.",
    queuedAutomationNoticePlural: "Rate Limited: {count} pending events are queued, waiting on rate limits to lift.",
    pending: {
      postNow: "Post Now",
      edit: "Edit",
      cancel: "Cancel",
      publishAt: "Publishes on: {time}",
      missedHint: "This automation was missed. Post now or delete.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "Event posted successfully.",
      postFailed: "Could not post event.",
      cancelled: "Pending event cancelled.",
      cancelFailed: "Could not cancel pending event.",
      editSaved: "Pending event updated.",
      editFailed: "Could not update pending event."
    },
    postingOptions: "Posting Options"
  },
  profiles: {
    steps: {
      select: "Select",
      basics: "Basics",
      schedule: "Schedule",
      audience: "Audience"
    },
    section: {
      basics: "Schedule Basics",
      audience: "Audience"
    },
    buttons: {
      new: "New"
    },
    importSuccess: "Template data imported from JSON.",
    importWrongType: "This appears to be an event JSON. Please use Import Event instead.",
    exportSuccess: "Template data exported to JSON.",
    hints: {
      groupAccess: "Choose a group with calendar access.",
      patternsInfo: "Patterns are used to pre-generate upcoming dates."
    },
    existingProfilePlaceholder: "Select a schedule",
    displayName: "Schedule Name",
    displayNamePlaceholder: "Community Hangout",
    durationDefault: "Default Duration (DD:HH:MM)",
    dateMode: "Date Mode",
    dateModePattern: "Pattern based",
    dateModeManual: "Manual only",
    dateModeBoth: "Patterns + manual",
    sendNotificationDefault: "Send Notification by default",
    patterns: {
      addButton: "Add Pattern",
      clearButton: "Clear Patterns",
      noPatterns: "No patterns yet.",
      removeButton: "Remove",
      patternType: "Pattern Type",
      weekday: "Weekday",
      time: "Time",
      confirmClear: "Clear all patterns?",
      selectAll: "Select pattern type, weekday, and time.",
      selectPattern: "Select a pattern",
      selectWeekday: "Select a weekday",
      date: "Date",
      selectMonth: "Select a month",
      types: {
        every: "Every [weekday]",
        everyOther: "Every other [weekday]",
        nth1: "Every 1st [weekday] of month",
        nth2: "Every 2nd [weekday] of month",
        nth3: "Every 3rd [weekday] of month",
        nth4: "Every 4th [weekday] of month",
        last: "Every last [weekday] of month",
        annual: "Every year on [date]"
      },
      format: {
        every: "Every {weekday} at {time}",
        everyOther: "Every other {weekday} at {time}",
        last: "Last {weekday} at {time}",
        nth: "{ordinal} {weekday} at {time}",
        annual: "Every year on {month} {day} at {time}"
      },
      ordinal1: "1st",
      ordinal2: "2nd",
      ordinal3: "3rd",
      ordinal4: "4th"
    },
    automation: {
      title: "Automation",
      description: "Automatically post events based on your patterns. Events will appear as \"Pending\" in Modify Events.",
      enableLabel: "Enable Automation",
      timingLabel: "Scheduling Rule",
      frequencyLabel: "Timing (DD:HH:MM)",
      timingModes: {
        before: "Before event starts",
        after: "After previous event ends",
        monthly: "Monthly on specific day"
      },
      monthlyDay: "Day of Month",
      monthlyTime: "Time",
      repeatMode: "Repeat",
      repeatModes: {
        indefinite: "Indefinitely",
        count: "Fixed count"
      },
      repeatCount: "Events to Create",
      patternsRequired: "At least one pattern is required for automation",
      confirmTitle: "Enable Automation?",
      confirmEnable: "Automations require the app to be running to post events. Missed automations can be handled from the Modify Events tab.",
      offsetCorrected: "Offset ({oldOffset} days) exceeded pattern frequency ({frequency} days). Switched to \"before\" mode with {newOffset}-day offset.",
      offsetCapped: "Offset ({oldOffset} days) exceeded pattern frequency. Capped to {newOffset} days.",
      prose: {
        day: "1 day",
        days: "{count} days",
        hour: "1 hour",
        hours: "{count} hours",
        minute: "1 minute",
        minutes: "{count} minutes",
        and: "and",
        noTime: "—",
        before: "Post the next event {time} before it begins.",
        after: "Post the next event {time} after the previous event ends.",
        monthly: "Every month on the {day}{ordinal} at {time}"
      },
      helpers: {
      },
      offsetProse: "Post the next event 7 days before it begins.",
      monthlyProse: "Every month on the 1st at 6:00 PM",
      restoreButton: "Restore",
      restoreSuccess: "Restored {count} event(s)",
      restoreNone: "No events to restore",
      restoreFailed: "Failed to restore events",
      restoreNoProfile: "No template selected",
      restorableCount: "{count} deleted event(s) can be restored"
    },
    created: "Template created.",
    updated: "Template updated.",
    deleted: "Template deleted.",
    confirmDelete: "Delete template \"{name}\"?",
  },
  common: {
    syncing: "Syncing data...",
    ready: "Ready",
    error: "Error",
    offline: "Offline",
    online: "Online",
    resync: "Resync",
    update: "Update",
    updating: "Updating",
    updateReady: "Restart",
    updateDownloading: "Downloading update...",
    save: "Save",
    cancel: "Cancel",
    enable: "Enable",
    loading: "Loading...",
    refresh: "Refresh",
    edit: "Edit",
    delete: "Delete",
    importJson: "Import JSON",
    exportJson: "Export JSON",
    selectTemplate: "Select a template",
    rateLimitError: "Rate limited. Please wait and try again later.",
    featuredEvent: "Featured Event",
    groupFairEvent: "Include in Group Fair",
    noMatches: "No matches.",
    noGroupsAccess: "No groups with calendar access",
    selectGroupPlaceholder: "Choose a group",
    errors: {
      noGroup: "Select a group.",
      requiredSingle: "{field} is required.",
      requiredMultiple: "{fields} are required.",
      maxLanguages: "Maximum 3 languages allowed.",
      durationError: "Duration must be a positive number."
    },
    section: {
      scheduleSelection: "Schedule Selection"
    },
    labels: {
      schedule: "Schedule",
      group: "Group",
      series: "Series",
      templates: "Templates"
    },
    accessTypes: {
      public: "Public",
      group: "Group"
    },
    durationUnits: {
      day: "d",
      hour: "hr",
      minute: "min"
    },
    weekdays: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    },
    months: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    },
    fields: {
      eventName: "Event Name",
      description: "Description",
      category: "Category",
      tags: "Tags (max 5)",
      accessType: "Access Type",
      imageId: "Image ID (optional)",
      imageIdPlaceholder: "ex. file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "Send Notification",
      timezone: "Timezone",
      duration: "Duration (DD:HH:MM)",
      languages: "Languages (max 3)",
      languagesHint: "{count} selected",
      filterLanguages: "Filter languages...",
      platforms: "Platforms",
    }
  },
  wizard: {
    back: "Back",
    next: "Next"
  },
  conflict: {
    title: "Event Conflict",
    message: "An event \"{title}\" is already scheduled at this time.",
    changeTime: "Reselect Time",
    continue: "Create Anyway"
  }
};