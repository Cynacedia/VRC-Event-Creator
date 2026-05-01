// Spanish translations for VRChat Event Creator

export const es = {
  nav: {
    create: "Crear evento",
    modify: "Modificar eventos",
    settings: "Configuración",
    schedules: "Gestionar horarios"
  },
  auth: {
    title: "Iniciar sesión",
    subtitle: "Se requieren credenciales de VRChat",
    username: "Usuario",
    password: "Contraseña",
    signIn: "Iniciar sesión",
    logout: "Cerrar sesión",
    sessionHint: "La sesión se guarda en caché localmente. Mantén tu archivo de caché privado.",
    loggingIn: "Iniciando sesión...",
    loginFailed: "Error al iniciar sesión.",
    sessionChecking: "Comprobando la sesión...",
    loginRequired: "Se requiere iniciar sesión.",
    loggedInAs: "Conectado como {name}.",
    loggedOut: "Sesión cerrada."
  },
  twoFactor: {
    title: "Código de doble factor",
    subtitle: "Introduce tu código de autenticación",
    codeLabel: "Código",
    submit: "Enviar"
  },
  languageSetup: {
    title: "Elegir idioma",
    subtitle: "Selecciona tu idioma para comenzar.",
    hint: "Puedes cambiar esto en cualquier momento en Configuración.",
    continue: "Continuar"
  },
  gallery: {
    title: "Galería",
    subtitle: "Selecciona una imagen de la galería para usar su ID de archivo.",
    empty: "No se encontraron imágenes de la galería.",
    loading: "Cargando galería...",
    useButton: "Usar ID de imagen",
    chooseButton: "Seleccionar",
    uploadButton: "Subir",
    uploadSuccess: "Imagen de galería subida.",
    uploadFailed: "No se pudo subir la imagen.",
    uploadLimitReached: "La galería está llena (64 imágenes). Elimina una para subir.",
    uploadTypeError: "Solo se admiten imágenes PNG o JPG.",
    uploadSizeError: "La imagen debe ser menor de 10 MB.",
    uploadMinDimensions: "La imagen debe ser mayor de 64x64.",
    uploadMaxDimensions: "La imagen debe ser menor de 2048x2048.",
    loadMore: "Cargar más",
    loadFailed: "No se pudo cargar la galería."
  },
  settings: {
    theme: {
      title: "Tema",
      description: "Personaliza la apariencia de la aplicación. Selecciona un preset o ajusta manualmente.",
      presetLabel: "Tema actual",
      nameLabel: "Nombre del tema",
      namePlaceholder: "Nuevo nombre del tema",
      saveButton: "Guardar tema",
      deleteButton: "Eliminar tema",
      resetButton: "Restablecer a predeterminado",
      savedLabel: "Temas guardados",
      customGroupLabel: "Personalizado",
      customUnsaved: "Personalizado (sin guardar)",
      importButton: "Importar tema",
      exportButton: "Exportar tema",
      openStudio: "Abrir Theme Studio",
      studio: {
        title: "Estudio de temas",
        subtitle: "Previsualiza y ajusta la apariencia de la app. Compatible con #RRGGBBAA para transparencias personalizadas.",
        header: "Encabezado",
        statusLabels: "Estado y etiquetas",
        accent: "Acento",
        panel: "Panel",
        mutedText: "Texto atenuado",
        primary: "Principal",
        ghost: "Fantasma",
        inputField: "Campo de entrada",
        dropdown: "Desplegable",
        dropdownOptionA: "Opción desplegable A",
        dropdownOptionB: "Opción desplegable B",
        dropdownOptionC: "Opción desplegable C",
        dropdownOptionD: "Opción desplegable D",
        previewLink: "Enlace de vista previa",
        toastPreview: "La vista previa del toast usa Panel Alt",
        previewHint: "La vista previa se actualiza en vivo mientras ajustas los colores."
      },
      fields: {
        accent: "Acento",
        bg: "Fondo 1",
        bgDeep: "Fondo 2",
        backdrop: "Fondo 3",
        panel: "Panel",
        panelAlt: "Panel alternativo",
        headerBg: "Encabezado",
        overlay: "Superposición",
        text: "Texto",
        textMuted: "Texto atenuado",
        link: "Enlace",
        linkHover: "Enlace al pasar el cursor",
        button: "Botón 1",
        button2: "Botón 2",
        buttonText: "Texto del botón",
        border: "Borde",
        shadow: "Sombra",
        inputBg: "Fondo de entrada",
        inputBgStrong: "Fondo de entrada 2",
        inputText: "Texto de entrada",
        selectOptionBg: "Opción de selección",
        selectOptionHighlight: "Resaltado de selección",
        backdropOverlay: "Resplandor del fondo",
        backdropGrid: "Cuadrícula del fondo",
        scanline: "Línea de escaneo"
      }
    },
    appInfo: {
      title: "Información de la aplicación",
      language: "Idioma",
      version: "Versión de la aplicación",
      dataFolder: "Carpeta de datos actual",
      changeButton: "Cambiar",
      openButton: "Abrir",
      session: "Sesión",
      githubLabel: "Repositorio de GitHub:",
      disclaimerLabel: "Aviso:",
      disclaimerText: "Esta aplicación no es oficial y no está afiliada a VRChat. Úsala bajo tu propio riesgo. Los desarrolladores no son responsables de los problemas derivados del uso de esta herramienta."
    },
    general: {
      title: "General",
      minimizeToTray: "Minimizar a la bandeja del sistema",
      startOnStartup: "Iniciar con el sistema",
      enableAdvanced: "Habilitar configuración avanzada",
      enableImportExport: "Importar/Exportar Eventos",
      autoUploadImages: "Subir automáticamente imágenes de galería desde eventos/plantillas importados"
    },
    discord: {
      enable: "Activar integración con Discord",
      description: "Crea automáticamente eventos en Discord al crear eventos de VRChat.",
      tokenLabel: "Token del bot",
      tokenPlaceholder: "Pega el token del bot",
      guildLabel: "ID del servidor",
      guildPlaceholder: "ej. 123456789012345678",
      testButton: "Verificar token",
      testSuccess: "Conectado como {botName}",
      testFailed: "Error de conexión. Verifica el token del bot.",
      tokenMissing: "Ingresa un token de bot primero.",
      selectGroup: "Seleccionar un grupo...",
      saveButton: "Guardar",
      saved: "Configuración de Discord guardada.",
      eventLabel: "Crear evento de Discord",
      syncSuccess: "Evento de Discord creado para \"{title}\"",
      syncFailed: "Sincronización con Discord fallida para \"{title}\": {error}"
    },
    webhook: {
      postLabel: "Publicar Webhook de Discord",
      enableLabel: "Habilitar Webhook",
      syncSuccess: "Webhook enviado para \"{title}\"",
      syncFailed: "Error de envío del webhook para \"{title}\": {error}"
    },
    calendar: {
      enable: "Habilitar generación de archivos de calendario",
      createInvite: "Crear invitación de calendario .ics",
      enableReminders: "Habilitar recordatorios de calendario .ics",
      addReminder: "Agregar Recordatorio",
      unit: {
        minutes: "minutos",
        hours: "horas",
        days: "días"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Probar Webhook",
      webhookTestSuccess: "Webhook verificado: {webhookName}",
      webhookTestFailed: "Prueba de webhook fallida. Verifica la URL.",
      webhookMissing: "Ingresa una URL de webhook primero.",
      remindersHint: "Algunas aplicaciones de calendario pueden usar solo el primer recordatorio.",
      saveDirLabel: "Directorio de guardado de calendario",
      autoSaved: "Archivo de calendario guardado: {filePath}",
      inviteTitle: "Invitación de calendario"
    },
    eckit: {
      importButton: "Importar Kit",
      webhookName: "Nombre del Webhook",
      webhookNamePlaceholder: "Eventos de Mi Grupo",
      embedColor: "Color del Embed",
      avatarUrl: "URL del Avatar",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "Adjuntar mensaje personalizado al webhook",
      messageTitle: "Mensaje personalizado del webhook",
      messagePlaceholder: "Escribe un mensaje personalizado para incluir con el webhook...",
      attachImage: "Adjuntar imagen",
      noImage: "Ninguna imagen seleccionada",
      selectImage: "Seleccionar"
    },
    saveButton: "Guardar configuración",
    saved: "Configuración guardada.",
    featuredVerification: {
      permissionDenied: "Este grupo no tiene permiso para crear eventos destacados."
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
    title: "¿Minimizar a la bandeja del sistema?",
    message: "Puedes cambiar esto más tarde en Configuración.",
    yes: "Sí",
    no: "No"
  },
  categories: {
    hangout: "Reunión",
    exploration: "Exploración",
    roleplaying: "Rol",
    film: "Cine y medios",
    gaming: "Juegos",
    music: "Música",
    dance: "Danza",
    performance: "Actuación",
    arts: "Artes",
    avatars: "Avatares",
    education: "Educación",
    wellness: "Bienestar",
    other: "Otro"
  },
  platforms: {
    pcWindows: "PC (Windows)",
    android: "Android (Quest, móvil, etc.)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "Grupo",
      date: "Fecha",
      details: "Detalles",
      create: "Crear"
    },
    section: {
      groupProfile: "Grupo + Plantilla",
      dateSelection: "Selección de fecha",
      details: "Detalles del evento",
      readyTitle: "¿Listo para crear?",
      readyHint: "Revisa tus selecciones y crea el evento."
    },
    labels: {
      groupRequired: "Grupo (obligatorio)",
      profileOptional: "Plantilla (opcional)",
      advanced: "Avanzado",
      patternDates: "Fechas del patrón",
      manualDate: "Fecha manual",
      manualTime: "Hora manual",
      dateSourceManual: "Manual",
      dateSource: "Usar",
      dateSourcePattern: "Patrón"
    },
    hints: {
      profileDefaults: "Elige una plantilla para los valores por defecto, o deja en blanco para crear manualmente.",
    },
    dateHints: {
      default: "El modo manual está listo. Los plantillas con patrones habilitan opciones de fecha.",
      noProfile: "No hay plantilla seleccionada. Usa fecha/hora manual.",
      manualReady: "Modo manual listo.",
      chooseGenerated: "Elige una fecha generada o usa el modo manual.",
      noUpcoming: "No se encontraron fechas próximas.",
      loadFailed: "No se pudieron cargar las fechas del patrón."
    },
    profileHint: "Las plantillas son opcionales. Usa uno para valores predeterminados o crea todo manualmente.",
    loadProfile: "Cargar plantilla (opcional)",
    clearProfile: "Limpiar plantilla",
    importSuccess: "Datos del evento importados desde JSON.",
    importWrongType: "Esto parece ser un JSON de plantilla. Usa Importar plantilla en su lugar.",
    exportSuccess: "Datos del evento exportados a JSON.",
    dateOption: "Seleccionar fecha",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "Restricciones de roles",
      hint: "Opcional - Si está habilitado, solo los roles de grupo seleccionados pueden unirse.",
      optional: "Para los moderadores de instancia, todos los roles en o por encima del rol de moderador más bajo seleccionado pueden unirse.",
      allAccess: "Ninguno (Todos pueden unirse)",
      managementRoles: "Roles de gestión",
      roles: "Roles",
      noRoles: "No hay roles disponibles para este grupo."
    },
    manualProfileOption: "Manual (sin plantilla)",
    pastDateError: "No se puede seleccionar una fecha pasada.",
    futureDateError: "Los eventos solo se pueden programar hasta 1 año por adelantado.",
    upcomingLimitNotice: "VRChat actualmente limita cada grupo a 10 eventos próximos.",
    upcomingCountGroupFallback: "Este grupo",
    upcomingCountStatus: "Eventos próximos para {group}: {count}/{limit}.",
    upcomingCountUnknown: "Recuento de eventos próximos no disponible.",
    upcomingCountToast: "{group} ahora tiene {count}/{limit} eventos próximos.",
    upcomingLimitReached: "Límite alcanzado: {group} ya tiene {limit} eventos próximos. Elimina o reprograma uno.",
    upcomingLimitError: "Límite alcanzado: {group} ya tiene {limit} eventos próximos. Elimina o reprograma uno.",
    crossPlatformRateLimit: "Límite de tasa. Eventos no rastreados creados en otra plataforma pueden contar para tu límite. Inténtalo de nuevo en {minutes} minutos.",
    unknownRateLimit: "Límite de tasa. Inténtalo más tarde.",
    upcomingCountRefresh: "Actualizar",
    createButton: "Crear evento",
    create: {
      warnConflicts: "Advertirme sobre eventos en conflicto",
      alreadyCreating: "Ya se está creando un evento, por favor espera..."
    },
    created: "Evento creado.",
    failed: "No se pudo crear el evento.",
    selectDateError: "Selecciona una fecha.",
    updateRequired: "Actualización disponible. Actualiza antes de crear eventos.",
    featuredPermissionRevoked: "Este grupo ya no tiene permiso para crear eventos destacados.",
    groupFairPermissionRevoked: "Este grupo ya no tiene permiso para incluir eventos en la Feria de Grupos."
  },
  modify: {
    subtitle: "Edita o elimina eventos próximos del grupo.",
    countEmpty: "Eventos próximos no disponibles.",
    countGroupFallback: "Este grupo",
    countStatus: "Eventos próximos para {group}: {count}.",
    empty: "No hay eventos próximos.",
    dateUnknown: "Fecha no disponible",
    eventImage: "Imagen del evento",
    noImage: "Sin imagen",
    untitled: "Evento sin título",
    profileLoad: "Cargar",
    profileSelectError: "Selecciona una plantilla para cargar.",
    profileLoadFailed: "No se pudieron cargar los valores de la plantilla.",
    profileLoaded: "Valores de la plantilla cargados.",
    manualDate: "Cambiar fecha",
    manualTime: "Cambiar hora",
    modal: {
      title: "Editar evento",
      subtitle: "Los cambios solo se aplican cuando presionas Guardar."
    },
    updateRequired: "Actualización disponible. Actualiza antes de modificar eventos.",
    selectEventError: "Selecciona un evento para editar.",
    selectDateError: "Selecciona fecha y hora.",
    saveFailed: "No se pudo actualizar el evento.",
    saved: "Evento actualizado.",
    deleteFailed: "No se pudo eliminar el evento.",
    deleted: "Evento eliminado.",
    loadFailed: "No se pudieron cargar los eventos.",
    missedAutomationNoticeSingular: "1 evento no pudo ser publicado a su hora automatizada programada.",
    missedAutomationNoticePlural: "{count} eventos no pudieron ser publicados a sus horas automatizadas programadas.",
    queuedAutomationNoticeSingular: "Límite de tasa: 1 evento pendiente está en cola, esperando que se levanten los límites de tasa.",
    queuedAutomationNoticePlural: "Límite de tasa: {count} eventos pendientes están en cola, esperando que se levanten los límites de tasa.",
    pending: {
      postNow: "Publicar ahora",
      edit: "Editar",
      cancel: "Cancelar",
      publishAt: "Publicación el: {time}",
      missedHint: "Esta automatización fue omitida. Publica ahora o elimina.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "Evento publicado exitosamente.",
      postFailed: "No se pudo publicar el evento.",
      cancelled: "Evento pendiente cancelado.",
      cancelFailed: "No se pudo cancelar el evento pendiente.",
      editSaved: "Evento pendiente actualizado.",
      editFailed: "No se pudo actualizar el evento pendiente."
    },
    postingOptions: "Opciones de publicación",
    badge: {
      modified: "Modificado"
    },
    filters: {
      heading: "Mostrar",
      modified: "Ocurrencias modificadas",
      pending: "Eventos pendientes",
      standalone: "Eventos independientes"
    },
    filtersButton: "Filtros",
    timeRange: {
      "1month": "1 mes",
      "1week": "1 semana",
      "1year": "1 año",
      "2weeks": "2 semanas",
      "3months": "3 meses",
      "6months": "6 meses",
      label: "Rango de tiempo"
    }
  },
  profiles: {
    steps: {
      select: "Selección",
      basics: "Básicos",
      schedule: "Horario",
      audience: "Audiencia"
    },
    section: {
      basics: "Datos básicos de la plantilla",
      audience: "Audiencia"
    },
    labels: {
    },
    buttons: {
      new: "Nuevo"
    },
    importSuccess: "Datos de la plantilla importados desde JSON.",
    importWrongType: "Esto parece ser un JSON de evento. Usa Importar evento en su lugar.",
    exportSuccess: "Datos de la plantilla exportados a JSON.",
    hints: {
      groupAccess: "Elige un grupo con acceso al calendario.",
      patternsInfo: "Los patrones se usan para generar fechas próximas."
    },
    existingProfilePlaceholder: "Seleccionar una plantilla",
    displayName: "Nombre de la plantilla",
    displayNamePlaceholder: "Plantilla de reunión comunitaria",
    durationDefault: "Duración predeterminada (DD:HH:MM)",
    dateMode: "Modo de fecha",
    dateModePattern: "Basado en patrón",
    dateModeManual: "Solo manual",
    dateModeBoth: "Patrones + manual",
    sendNotificationDefault: "Enviar notificación por defecto",
    patterns: {
      addButton: "Agregar patrón",
      clearButton: "Borrar patrones",
      noPatterns: "Aún no hay patrones.",
      removeButton: "Quitar",
      patternType: "Tipo de patrón",
      weekday: "Día de la semana",
      time: "Hora",
      confirmClear: "¿Borrar todos los patrones?",
      selectAll: "Selecciona el tipo de patrón, el día y la hora.",
      selectPattern: "Seleccionar un patrón",
      selectWeekday: "Seleccionar un día",
      types: {
        every: "Cada [día]",
        everyOther: "Cada dos [días]",
        nth1: "Cada 1.º [día] del mes",
        nth2: "Cada 2.º [día] del mes",
        nth3: "Cada 3.º [día] del mes",
        nth4: "Cada 4.º [día] del mes",
        last: "Cada último [día] del mes",
        annual: "Cada año el [fecha]"
      },
      format: {
        every: "Cada {weekday} a las {time}",
        everyOther: "Cada dos {weekday} a las {time}",
        last: "Último {weekday} a las {time}",
        nth: "El {ordinal} {weekday} a las {time}",
        annual: "Cada año el {month} {day} a las {time}"
      },
      ordinal1: "1.º",
      ordinal2: "2.º",
      ordinal3: "3.º",
      ordinal4: "4.º",
      date: "Fecha",
      selectMonth: "Seleccionar mes"
    },
    automation: {
      title: "Automatización (Experimental)",
      description: "Publicar eventos automáticamente según tus patrones. Los eventos aparecerán como \"Pendientes\" en Modificar Eventos.",
      enableLabel: "Habilitar automatización",
      timingLabel: "Regla de programación",
      frequencyLabel: "Temporización (DD:HH:MM)",
      timingModes: {
        before: "Antes del inicio del evento",
        after: "Después del final del evento anterior",
        monthly: "Mensualmente en día específico"
      },
      monthlyDay: "Día del mes",
      monthlyTime: "Hora",
      repeatMode: "Repetir",
      repeatModes: {
        indefinite: "Indefinidamente",
        count: "Cantidad fija"
      },
      repeatCount: "Eventos a crear",
      patternsRequired: "Se requiere al menos un patrón para la automatización",
      confirmTitle: "¿Activar automatización?",
      confirmEnable: "La automatización requiere que la aplicación esté en ejecución para publicar eventos. Las automatizaciones perdidas se pueden gestionar desde la pestaña Modificar Eventos.",
      offsetCorrected: "El desplazamiento ({oldOffset} días) excedió la frecuencia del patrón ({frequency} días). Se cambió al modo \"antes\" con desplazamiento de {newOffset} días.",
      offsetCapped: "El desplazamiento ({oldOffset} días) excedió la frecuencia del patrón. Limitado a {newOffset} días.",
      prose: {
        day: "1 día",
        days: "{count} días",
        hour: "1 hora",
        hours: "{count} horas",
        minute: "1 minuto",
        minutes: "{count} minutos",
        and: "y",
        noTime: "—",
        before: "Publicar el próximo evento {time} antes de que comience.",
        after: "Publicar el próximo evento {time} después de que finalice el evento anterior.",
        monthly: "El {day}{ordinal} de cada mes a las {time}"
      },
      helpers: {
      },
      offsetProse: "Publicar el próximo evento 7 días antes de que comience.",
      monthlyProse: "El 1º de cada mes a las 6:00 PM",
      restoreButton: "Restaurar",
      restoreSuccess: "Se restauraron {count} evento(s)",
      restoreNone: "No hay eventos para restaurar",
      restoreFailed: "No se pudieron restaurar los eventos",
      restoreNoProfile: "No hay ningún plantilla seleccionada",
      restorableCount: "Se pueden restaurar {count} evento(s) eliminado(s)"
    },
    created: "Plantilla creada.",
    updated: "Plantilla actualizada.",
    deleted: "Plantilla eliminada.",
    confirmDelete: "¿Eliminar la plantilla \"{name}\"?",
  },
  common: {
    syncing: "Sincronizando datos...",
    ready: "Listo",
    error: "Error",
    offline: "Desconectado",
    online: "En línea",
    resync: "Resincronizar",
    update: "Actualizar",
    updating: "Actualizando",
    updateReady: "Reiniciar",
    updateDownloading: "Descargando actualización...",
    save: "Guardar",
    cancel: "Cancelar",
    enable: "Activar",
    loading: "Cargando...",
    refresh: "Actualizar",
    edit: "Editar",
    delete: "Eliminar",
    rateLimitError: "Límite de tasa. Por favor espere e inténtelo más tarde.",
    featuredEvent: "Evento destacado",
    groupFairEvent: "Incluir en Feria de Grupos",
    noMatches: "Sin coincidencias.",
    noGroupsAccess: "No hay grupos con acceso al calendario",
    selectGroupPlaceholder: "Elegir un grupo",
    accessTypes: {
      public: "Público",
      group: "Grupo"
    },
    durationUnits: {
      day: "d",
      hour: "h",
      minute: "min"
    },
    weekdays: {
      monday: "Lunes",
      tuesday: "Martes",
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
      sunday: "Domingo"
    },
    months: {
      january: "Enero",
      february: "Febrero",
      march: "Marzo",
      april: "Abril",
      may: "Mayo",
      june: "Junio",
      july: "Julio",
      august: "Agosto",
      september: "Septiembre",
      october: "Octubre",
      november: "Noviembre",
      december: "Diciembre"
    },
    fields: {
      eventName: "Nombre del evento",
      description: "Descripción",
      category: "Categoría",
      tags: "Etiquetas (máx. 5)",
      accessType: "Tipo de acceso",
      imageId: "ID de imagen (opcional)",
      imageIdPlaceholder: "ej. file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "Enviar notificación",
      timezone: "Zona horaria",
      duration: "Duración (DD:HH:MM)",
      languages: "Idiomas (máx. 3)",
      languagesHint: "{count} seleccionados",
      filterLanguages: "Filtrar idiomas...",
      platforms: "Plataformas",
    },
    errors: {
      durationError: "La duración debe ser un número positivo.",
      maxLanguages: "Máximo 3 idiomas permitidos.",
      noGroup: "Selecciona un grupo.",
      requiredMultiple: "{fields} son obligatorios.",
      requiredSingle: "{field} es obligatorio."
    },
    exportJson: "Exportar JSON",
    importJson: "Importar JSON",
    labels: {
      group: "Grupo",
      schedule: "Horario",
      series: "Serie",
      templates: "Plantillas"
    },
    section: {
      scheduleSelection: "Selección de programación"
    },
    selectTemplate: "Seleccionar una plantilla"
  },
  wizard: {
    back: "Atrás",
    next: "Siguiente"
  },
  conflict: {
    title: "Conflicto de evento",
    message: "Ya existe un evento \"{title}\" programado en este horario.",
    changeTime: "Reseleccionar hora",
    continue: "Crear de todas formas"
  },
  schedules: {
    announcements: {
      hint: "Activa las acciones a realizar cuando esta plantilla publique un evento.",
      hintSeries: "Activa las acciones a realizar cuando esta serie se cree o modifique.",
      title: "Anuncios"
    },
    empty: {
      all: "No hay programaciones para este grupo.",
      series: "No hay series para este grupo.",
      templates: "No hay plantillas para este grupo."
    },
    filter: {
      all: "Todo",
      label: "Mostrar"
    },
    info: {
      series: {
        bullet1: "VRChat pre-genera todas las ocurrencias en el servidor a partir de una regla de recurrencia.",
        bullet2: "Configura y olvídate — no se necesita aplicación después de crearla.",
        bullet3: "Limitaciones: no hay anuncios por evento; la regla de recurrencia no se puede cambiar sin regenerar todas las ocurrencias (las modificaciones se pierden).",
        bullet4: "Ideal para eventos estables y repetitivos que no necesitan anuncios.",
        title: "Series"
      },
      template: {
        bullet1: "Cada evento se publica como una entrada de calendario independiente — modificable por ocurrencia.",
        bullet2: "Anuncia opcionalmente cada evento mediante eventos programados de Discord, webhooks e invitaciones de calendario .ics.",
        bullet3: "Combina con la automatización y la programación basada en patrones para publicar sin intervención.",
        bullet4: "Requiere que la aplicación esté en ejecución para la publicación automática.",
        title: "Plantillas"
      }
    },
    modeBlurb: {
      moreInfo: "(más información)",
      series: "Una serie es el planificador recurrente nativo de VRChat. El servidor pre-genera todas las ocurrencias. Sin anuncios.",
      template: "Las plantillas rellenan automáticamente los eventos repetidos y publican cada ocurrencia de forma individual con anuncios opcionales."
    },
    saveButton: {
      seriesCreate: "Crear serie",
      template: "Guardar plantilla"
    },
    subtitle: "Plantillas para programación con anuncios y series recurrentes nativas de VRChat.",
    types: {
      templateButton: "Plantilla"
    }
  },
  series: {
    confirmDelete: "¿Eliminar «{label}»? Esto quitará la serie y todas sus ocurrencias de VRChat.",
    confirmDeleteTitle: "¿Eliminar serie?",
    created: "Serie «{label}» creada.",
    days: {
      fr: "Vie",
      mo: "Lun",
      sa: "Sáb",
      su: "Dom",
      th: "Jue",
      tu: "Mar",
      we: "Mié"
    },
    deleted: "Serie «{label}» eliminada.",
    disclaimer: "Una serie solo puede reprogramarse antes de que comience su primera ocurrencia. Una vez iniciada, debes eliminarla para cambiar la fecha o la hora. Los eventos pueden programarse hasta un año por adelantado. La duración máxima de un evento es de 31 días.",
    end: {
      afterDateLabel: "En una fecha específica",
      afterOccurrencesLabel: "Tras N ocurrencias",
      never: "Nunca",
      occurrencesLabel: "ocurrencias"
    },
    errors: {
      createFailed: "No se pudo crear la serie.",
      deleteFailed: "No se pudo eliminar la serie.",
      noDaysOfWeek: "Selecciona al menos un día de la semana.",
      noEndDate: "Define una fecha de finalización.",
      noLabel: "La etiqueta de la serie es obligatoria.",
      noSeries: "No hay serie seleccionada.",
      noStartDate: "La fecha y hora de la primera ocurrencia son obligatorias.",
      noTitle: "El nombre del evento es obligatorio.",
      notFound: "Serie no encontrada.",
      regenFailed: "No se pudo regenerar la serie.",
      startInPast: "La primera ocurrencia debe ser en el futuro. Actualiza la fecha antes de guardar.",
      updateFailed: "No se pudo actualizar la serie."
    },
    frequency: {
      custom: "Personalizado",
      daily: "Diariamente",
      monthly: "Mensualmente",
      weekdays: "Días laborables",
      weekends: "Fines de semana",
      weekly: "Semanalmente",
      yearly: "Anualmente"
    },
    labels: {
      daysOfWeek: "Se repite los",
      endCondition: "Termina",
      frequency: "Frecuencia",
      interval: "Repetir cada",
      startDate: "Fecha de la primera ocurrencia",
      startTime: "Hora de inicio"
    },
    lockedHint: "Esta serie ya ha comenzado. La fecha, la hora y la regla de repetición están bloqueadas — pero todavía puedes ajustar cuándo termina. Para reprogramar, haz clic en Desbloquear — al guardar se reemplazará esta serie por una nueva.",
    rasterize: {
      retryIn: "Reintento en {wait}.",
      retryNow: "Reintentar ahora",
      statusText: "{count} evento(s) en espera de creación.{wait}"
    },
    regen: {
      choiceMessage: "Esta serie tiene {count} evento(s) modificado(s). La serie actual se reemplazará por una nueva.\n\n• Conservar modificaciones: los solapamientos del mismo día actualizan la nueva serie; los eventos sin solapamiento se vuelven independientes.\n• Descartar modificaciones: los cambios en esas ocurrencias se pierden.",
      choiceTitle: "¿Reemplazar serie?",
      confirmAction: "Reemplazar serie",
      confirmMessage: "Esto reemplazará la serie actual por una nueva. ¿Continuar?",
      discard: "Descartar modificaciones",
      keep: "Conservar modificaciones",
      success: "Serie «{label}» reemplazada.",
      successWithMods: "Serie «{label}» reemplazada. {count} modificación(es) en cola."
    },
    regenWarning: "La recurrencia está desbloqueada. Si cambias la recurrencia, la serie actual se reemplazará por una nueva.",
    regenWarningWithMods: "La recurrencia está desbloqueada. Si cambias la recurrencia, la serie actual se reemplazará por una nueva y se te preguntará cómo manejar sus {count} eventos modificados.",
    unit: {
      days: "días",
      months: "meses",
      weeks: "semanas",
      years: "años"
    },
    unlockButton: "Desbloquear",
    updateRequired: "Actualización disponible. Actualiza antes de modificar series.",
    updated: "Serie «{label}» actualizada.",
    warnings: {
      confirmUpdate: "Actualizar serie"
    }
  }
};