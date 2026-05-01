// Russian translations for VRChat Event Creator

export const ru = {
  nav: {
    create: "Создать событие",
    modify: "Редактировать события",
    settings: "Настройки",
    schedules: "Управление расписаниями"
  },
  auth: {
    title: "Войти",
    subtitle: "Требуются учетные данные VRChat",
    username: "Имя пользователя",
    password: "Пароль",
    signIn: "Войти",
    logout: "Выйти",
    sessionHint: "Сессия кэшируется локально. Храните файл кэша в безопасности.",
    loggingIn: "Вход...",
    loginFailed: "Ошибка входа.",
    sessionChecking: "Проверка сессии...",
    loginRequired: "Требуется вход.",
    loggedInAs: "Вход выполнен как {name}.",
    loggedOut: "Вы вышли."
  },
  twoFactor: {
    title: "Двухфакторный код",
    subtitle: "Введите код аутентификации",
    codeLabel: "Код",
    submit: "Отправить"
  },
  languageSetup: {
    title: "Выбор языка",
    subtitle: "Выберите язык для начала.",
    hint: "Это можно изменить в настройках в любое время.",
    continue: "Продолжить"
  },
  gallery: {
    title: "Галерея",
    subtitle: "Выберите изображение из галереи, чтобы использовать его ID файла.",
    empty: "Изображения галереи не найдены.",
    loading: "Загрузка галереи...",
    useButton: "Использовать ID изображения",
    chooseButton: "Выбрать",
    uploadButton: "Загрузить",
    uploadSuccess: "Изображение галереи загружено.",
    uploadFailed: "Не удалось загрузить изображение.",
    uploadLimitReached: "Галерея заполнена (64 изображения). Удалите одно, чтобы загрузить.",
    uploadTypeError: "Поддерживаются только изображения PNG или JPG.",
    uploadSizeError: "Размер изображения должен быть меньше 10 МБ.",
    uploadMinDimensions: "Изображение должно быть больше 64x64.",
    uploadMaxDimensions: "Изображение должно быть меньше 2048x2048.",
    loadMore: "Загрузить еще",
    loadFailed: "Не удалось загрузить галерею."
  },
  settings: {
    theme: {
      title: "Тема",
      description: "Настройте внешний вид приложения. Выберите пресет или настройте вручную.",
      presetLabel: "Текущая тема",
      nameLabel: "Название темы",
      namePlaceholder: "Новое название темы",
      saveButton: "Сохранить тему",
      deleteButton: "Удалить тему",
      resetButton: "Сбросить к умолчанию",
      savedLabel: "Сохраненные темы",
      customGroupLabel: "Пользовательские",
      customUnsaved: "Пользовательская (несохраненная)",
      importButton: "Импорт темы",
      exportButton: "Экспорт темы",
      openStudio: "Открыть студию темы",
      studio: {
        title: "Студия темы",
        subtitle: "Просмотрите и настройте внешний вид приложения. Поддерживает #RRGGBBAA для прозрачности.",
        header: "Шапка",
        statusLabels: "Статус и метки",
        accent: "Акцент",
        panel: "Панель",
        mutedText: "Приглушенный текст",
        primary: "Основная",
        ghost: "Призрачная",
        inputField: "Поле ввода",
        dropdown: "Выпадающий список",
        dropdownOptionA: "Пункт списка A",
        dropdownOptionB: "Пункт списка B",
        dropdownOptionC: "Пункт списка C",
        dropdownOptionD: "Пункт списка D",
        previewLink: "Ссылка предпросмотра",
        toastPreview: "Предпросмотр toast использует Panel Alt",
        previewHint: "Предпросмотр обновляется при изменении цветов."
      },
      fields: {
        accent: "Акцент",
        bg: "Фон 1",
        bgDeep: "Фон 2",
        backdrop: "Фон 3",
        panel: "Панель",
        panelAlt: "Панель Alt",
        headerBg: "Шапка",
        overlay: "Оверлей",
        text: "Текст",
        textMuted: "Приглушенный текст",
        link: "Ссылка",
        linkHover: "Ссылка при наведении",
        button: "Кнопка 1",
        button2: "Кнопка 2",
        buttonText: "Текст кнопки",
        border: "Граница",
        shadow: "Тень",
        inputBg: "Фон ввода",
        inputBgStrong: "Фон ввода 2",
        inputText: "Текст ввода",
        selectOptionBg: "Опция выбора",
        selectOptionHighlight: "Подсветка выбора",
        backdropOverlay: "Сияние фона",
        backdropGrid: "Фоновая сетка",
        scanline: "Скан-линии"
      }
    },
    appInfo: {
      title: "Информация о приложении",
      language: "Язык",
      version: "Версия приложения",
      dataFolder: "Текущая папка данных",
      changeButton: "Изменить",
      openButton: "Открыть",
      session: "Сессия",
      githubLabel: "Репозиторий GitHub:",
      disclaimerLabel: "Отказ от ответственности:",
      disclaimerText: "Это приложение неофициально и не связано с VRChat. Используйте на свой риск. Разработчики не несут ответственности за проблемы, возникающие при использовании этого инструмента."
    },
    general: {
      title: "Общие",
      minimizeToTray: "Свернуть в системный трей",
      startOnStartup: "Запускать при старте системы",
      enableAdvanced: "Включить расширенные настройки",
      enableImportExport: "Импорт/Экспорт событий",
      autoUploadImages: "Автоматически загружать изображения галереи из импортированных событий/шаблонов"
    },
    discord: {
      enable: "Включить интеграцию с Discord",
      description: "Автоматически создаёт мероприятия в Discord при создании событий VRChat.",
      tokenLabel: "Токен бота",
      tokenPlaceholder: "Вставьте токен бота",
      guildLabel: "ID сервера",
      guildPlaceholder: "напр. 123456789012345678",
      testButton: "Проверить токен",
      testSuccess: "Подключено как {botName}",
      testFailed: "Ошибка подключения. Проверьте токен бота.",
      tokenMissing: "Сначала введите токен бота.",
      selectGroup: "Выберите группу...",
      saveButton: "Сохранить",
      saved: "Настройки Discord сохранены.",
      eventLabel: "Создать событие Discord",
      syncSuccess: "Мероприятие Discord создано для «{title}»",
      syncFailed: "Синхронизация с Discord не удалась для «{title}»: {error}"
    },
    webhook: {
      postLabel: "Отправить Discord Webhook",
      enableLabel: "Включить Webhook",
      syncSuccess: "Webhook отправлен для \"{title}\"",
      syncFailed: "Не удалось отправить webhook для \"{title}\": {error}"
    },
    calendar: {
      enable: "Включить создание файлов календаря",
      createInvite: "Создать приглашение календаря .ics",
      enableReminders: "Включить напоминания календаря .ics",
      addReminder: "Добавить напоминание",
      unit: {
        minutes: "минут",
        hours: "часов",
        days: "дней"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Проверить вебхук",
      webhookTestSuccess: "Вебхук подтверждён: {webhookName}",
      webhookTestFailed: "Проверка вебхука не удалась. Проверьте URL.",
      webhookMissing: "Сначала введите URL вебхука.",
      remindersHint: "Некоторые приложения-календари могут использовать только первое напоминание.",
      saveDirLabel: "Директория сохранения календаря",
      autoSaved: "Файл календаря сохранён: {filePath}",
      inviteTitle: "Приглашение в календарь"
    },
    eckit: {
      importButton: "Импортировать кит",
      webhookName: "Отображаемое имя вебхука",
      webhookNamePlaceholder: "События моей группы",
      embedColor: "Цвет вставки",
      avatarUrl: "URL аватара",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "Прикрепить пользовательское сообщение к вебхуку",
      messageTitle: "Пользовательское сообщение вебхука",
      messagePlaceholder: "Напишите пользовательское сообщение для включения в вебхук...",
      attachImage: "Прикрепить изображение",
      noImage: "Изображение не выбрано",
      selectImage: "Выбрать"
    },
    saveButton: "Сохранить настройки",
    saved: "Настройки сохранены.",
    featuredVerification: {
      permissionDenied: "Этой группе не разрешено создавать рекомендуемые события."
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
    title: "Свернуть в системный трей?",
    message: "Вы можете изменить это позже в настройках.",
    yes: "Да",
    no: "Нет"
  },
  categories: {
    hangout: "Встреча",
    exploration: "Исследование",
    roleplaying: "Ролевая игра",
    film: "Кино и медиа",
    gaming: "Игры",
    music: "Музыка",
    dance: "Танцы",
    performance: "Выступление",
    arts: "Искусство",
    avatars: "Аватары",
    education: "Образование",
    wellness: "Благополучие",
    other: "Другое"
  },
  platforms: {
    pcWindows: "ПК (Windows)",
    android: "Android (Quest, мобильные и т. д.)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "Группа",
      date: "Дата",
      details: "Детали",
      create: "Создать"
    },
    section: {
      groupProfile: "Группа + шаблон",
      dateSelection: "Выбор даты",
      details: "Детали события",
      readyTitle: "Готовы создать?",
      readyHint: "Проверьте выбор и создайте событие."
    },
    labels: {
      groupRequired: "Группа (обязательно)",
      profileOptional: "Шаблон (необязательно)",
      advanced: "Дополнительно",
      patternDates: "Даты шаблона",
      manualDate: "Ручная дата",
      manualTime: "Ручное время",
      dateSourceManual: "Вручную",
      dateSource: "Использовать",
      dateSourcePattern: "Шаблон"
    },
    hints: {
      profileDefaults: "Выберите шаблон для значений по умолчанию или оставьте пустым для ручного создания.",
    },
    dateHints: {
      default: "Ручной режим готов. Шаблоны с шаблонами открывают варианты дат.",
      noProfile: "Шаблон не выбран. Используйте ручную дату/время.",
      manualReady: "Ручной режим готов.",
      chooseGenerated: "Выберите сгенерированную дату или используйте ручной ввод.",
      noUpcoming: "Предстоящих дат не найдено.",
      loadFailed: "Не удалось загрузить даты шаблона."
    },
    profileHint: "Шаблоны необязательны. Используйте для значений по умолчанию или создавайте вручную.",
    loadProfile: "Загрузить шаблон (необязательно)",
    clearProfile: "Очистить шаблон",
    importSuccess: "Данные события импортированы из JSON.",
    importWrongType: "Похоже, это JSON шаблона. Пожалуйста, используйте импорт шаблона.",
    exportSuccess: "Данные события экспортированы в JSON.",
    dateOption: "Выберите дату",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "Ограничения ролей",
      hint: "Необязательно - если включено, присоединяться могут только выбранные роли группы.",
      optional: "Для модераторов инстанса могут присоединяться все роли на уровне или выше самой низкой выбранной роли модератора.",
      allAccess: "Нет (Все могут присоединиться)",
      managementRoles: "Управляющие роли",
      roles: "Роли",
      noRoles: "Для этой группы нет доступных ролей."
    },
    manualProfileOption: "Вручную (без шаблона)",
    pastDateError: "Нельзя выбрать прошедшую дату.",
    futureDateError: "События можно планировать только на 1 год вперед.",
    upcomingLimitNotice: "VRChat ограничивает каждую группу 10 предстоящими событиями.",
    upcomingCountGroupFallback: "Эта группа",
    upcomingCountStatus: "Предстоящие события для {group}: {count}/{limit}.",
    upcomingCountUnknown: "Количество предстоящих событий недоступно.",
    upcomingCountToast: "Теперь у {group} {count}/{limit} предстоящих событий.",
    upcomingLimitReached: "Лимит достигнут: у {group} уже {limit} предстоящих событий. Удалите или перенесите одно.",
    upcomingLimitError: "Лимит достигнут: у {group} уже {limit} предстоящих событий. Удалите или перенесите одно.",
    crossPlatformRateLimit: "Ограничение скорости. Неотслеживаемые события, созданные на другой платформе, могут учитываться в вашем лимите. Повторите попытку через {minutes} минут.",
    unknownRateLimit: "Ограничение скорости. Повторите попытку позже.",
    upcomingCountRefresh: "Обновить",
    createButton: "Создать событие",
    create: {
      warnConflicts: "Предупреждать о конфликтующих событиях",
      alreadyCreating: "Событие уже создается, пожалуйста, подождите..."
    },
    created: "Событие создано.",
    failed: "Не удалось создать событие.",
    selectDateError: "Выберите дату.",
    updateRequired: "Доступно обновление. Пожалуйста, обновите приложение перед созданием событий.",
    featuredPermissionRevoked: "У этой группы больше нет разрешения создавать избранные события.",
    groupFairPermissionRevoked: "У этой группы больше нет разрешения включать события в групповую ярмарку."
  },
  modify: {
    subtitle: "Редактируйте или удаляйте предстоящие события группы.",
    countEmpty: "Предстоящие события недоступны.",
    countGroupFallback: "Эта группа",
    countStatus: "Предстоящие события для {group}: {count}.",
    empty: "Нет предстоящих событий.",
    dateUnknown: "Дата недоступна",
    eventImage: "Изображение события",
    noImage: "Без изображения",
    untitled: "Событие без названия",
    profileLoad: "Загрузить",
    profileSelectError: "Выберите шаблон для загрузки.",
    profileLoadFailed: "Не удалось загрузить значения шаблона.",
    profileLoaded: "Значения шаблона загружены.",
    manualDate: "Изменить дату",
    manualTime: "Изменить время",
    modal: {
      title: "Редактировать событие",
      subtitle: "Изменения применяются только после нажатия «Сохранить»."
    },
    updateRequired: "Доступно обновление. Пожалуйста, обновите приложение перед редактированием событий.",
    selectEventError: "Выберите событие для редактирования.",
    selectDateError: "Выберите дату и время.",
    saveFailed: "Не удалось обновить событие.",
    saved: "Событие обновлено.",
    deleteFailed: "Не удалось удалить событие.",
    deleted: "Событие удалено.",
    loadFailed: "Не удалось загрузить события.",
    missedAutomationNoticeSingular: "1 событие не удалось опубликовать в запланированное время автоматизации.",
    missedAutomationNoticePlural: "{count} события не удалось опубликовать в запланированное время автоматизации.",
    queuedAutomationNoticeSingular: "Ограничение скорости: 1 ожидающее событие находится в очереди, ожидая снятия ограничений скорости.",
    queuedAutomationNoticePlural: "Ограничение скорости: {count} ожидающих события находятся в очереди, ожидая снятия ограничений скорости.",
    pending: {
      postNow: "Опубликовать сейчас",
      edit: "Редактировать",
      cancel: "Отмена",
      publishAt: "Дата публикации: {time}",
      missedHint: "Эта автоматизация была пропущена. Опубликуйте сейчас или удалите.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "Событие успешно опубликовано.",
      postFailed: "Не удалось опубликовать событие.",
      cancelled: "Ожидающее событие отменено.",
      cancelFailed: "Не удалось отменить ожидающее событие.",
      editSaved: "Ожидающее событие обновлено.",
      editFailed: "Не удалось обновить ожидающее событие."
    },
    postingOptions: "Параметры публикации",
    badge: {
      modified: "Изменено"
    },
    filters: {
      heading: "Показывать",
      modified: "Изменённые события",
      pending: "Ожидающие события",
      standalone: "Отдельные события"
    },
    filtersButton: "Фильтры",
    timeRange: {
      "1month": "1 месяц",
      "1week": "1 неделя",
      "1year": "1 год",
      "2weeks": "2 недели",
      "3months": "3 месяца",
      "6months": "6 месяцев",
      label: "Период времени"
    }
  },
  profiles: {
    steps: {
      select: "Выбор",
      basics: "Основы",
      schedule: "Расписание",
      audience: "Аудитория"
    },
    section: {
      basics: "Основы шаблона",
      audience: "Аудитория"
    },
    labels: {
    },
    buttons: {
      new: "Новый"
    },
    importSuccess: "Данные шаблона импортированы из JSON.",
    importWrongType: "Похоже, это JSON события. Пожалуйста, используйте импорт события.",
    exportSuccess: "Данные шаблона экспортированы в JSON.",
    hints: {
      groupAccess: "Выберите группу с доступом к календарю.",
      patternsInfo: "Шаблоны используются для предварительного создания дат."
    },
    existingProfilePlaceholder: "Выберите шаблон",
    displayName: "Название шаблона",
    displayNamePlaceholder: "Шаблон встречи сообщества",
    durationDefault: "Длительность по умолчанию (DD:HH:MM)",
    dateMode: "Режим даты",
    dateModePattern: "По шаблону",
    dateModeManual: "Только вручную",
    dateModeBoth: "Шаблоны + вручную",
    sendNotificationDefault: "Отправлять уведомление по умолчанию",
    patterns: {
      addButton: "Добавить шаблон",
      clearButton: "Очистить шаблоны",
      noPatterns: "Шаблонов пока нет.",
      removeButton: "Удалить",
      patternType: "Тип шаблона",
      weekday: "День недели",
      time: "Время",
      confirmClear: "Очистить все шаблоны?",
      selectAll: "Выберите тип, день недели и время.",
      selectPattern: "Выберите шаблон",
      selectWeekday: "Выберите день недели",
      types: {
        every: "Каждый [weekday]",
        everyOther: "Через неделю [weekday]",
        nth1: "Каждый 1-й [weekday] месяца",
        nth2: "Каждый 2-й [weekday] месяца",
        nth3: "Каждый 3-й [weekday] месяца",
        nth4: "Каждый 4-й [weekday] месяца",
        last: "Каждый последний [weekday] месяца",
        annual: "Каждый год [дата]"
      },
      format: {
        every: "Каждый {weekday} в {time}",
        everyOther: "Через неделю {weekday} в {time}",
        last: "Последний {weekday} в {time}",
        nth: "{ordinal} {weekday} в {time}",
        annual: "Каждый год {month} {day} в {time}"
      },
      ordinal1: "1-й",
      ordinal2: "2-й",
      ordinal3: "3-й",
      ordinal4: "4-й",
      date: "Дата",
      selectMonth: "Выбрать месяц"
    },
    automation: {
      title: "Автоматизация (Экспериментально)",
      description: "Автоматически публиковать события на основе ваших шаблонов. События будут отображаться как \"Ожидающие\" в разделе Изменить события.",
      enableLabel: "Включить автоматизацию",
      timingLabel: "Правило планирования",
      frequencyLabel: "Время (ДД:ЧЧ:ММ)",
      timingModes: {
        before: "До начала события",
        after: "После окончания предыдущего события",
        monthly: "Ежемесячно в определенный день"
      },
      monthlyDay: "День месяца",
      monthlyTime: "Время",
      repeatMode: "Повторять",
      repeatModes: {
        indefinite: "Бесконечно",
        count: "Фиксированное количество"
      },
      repeatCount: "Событий создать",
      patternsRequired: "Для автоматизации требуется как минимум один шаблон",
      confirmTitle: "Включить автоматизацию?",
      confirmEnable: "Для автоматизации требуется запущенное приложение для публикации событий. Пропущенные автоматизации можно обработать на вкладке Изменить события.",
      offsetCorrected: "Смещение ({oldOffset} дней) превысило частоту шаблона ({frequency} дней). Переключено в режим \"до\" со смещением {newOffset} дней.",
      offsetCapped: "Смещение ({oldOffset} дней) превысило частоту шаблона. Ограничено до {newOffset} дней.",
      prose: {
        day: "1 день",
        days: "{count} дней",
        hour: "1 час",
        hours: "{count} часов",
        minute: "1 минута",
        minutes: "{count} минут",
        and: "и",
        noTime: "—",
        before: "Опубликовать следующее событие за {time} до его начала.",
        after: "Опубликовать следующее событие через {time} после окончания предыдущего события.",
        monthly: "Каждый месяц {day}-го числа в {time}"
      },
      helpers: {
      },
      offsetProse: "Опубликовать следующее событие за 7 дней до его начала.",
      monthlyProse: "Каждый месяц 1-го числа в 6:00 PM",
      restoreButton: "Восстановить",
      restoreSuccess: "Восстановлено {count} событие(й)",
      restoreNone: "Нет событий для восстановления",
      restoreFailed: "Не удалось восстановить события",
      restoreNoProfile: "Шаблон не выбран",
      restorableCount: "{count} удалённых событие(й) можно восстановить"
    },
    created: "Шаблон создан.",
    updated: "Шаблон обновлен.",
    deleted: "Шаблон удален.",
    confirmDelete: "Удалить шаблон \"{name}\"?",
  },
  common: {
    syncing: "Синхронизация данных...",
    ready: "Готово",
    error: "Ошибка",
    offline: "Офлайн",
    online: "Онлайн",
    resync: "Повторная синхронизация",
    update: "Обновить",
    updating: "Обновление",
    updateReady: "Перезапуск",
    updateDownloading: "Загрузка обновления...",
    save: "Сохранить",
    cancel: "Отмена",
    enable: "Включить",
    loading: "Загрузка...",
    refresh: "Обновить",
    edit: "Редактировать",
    delete: "Удалить",
    rateLimitError: "Ограничение скорости. Пожалуйста, подождите и попробуйте позже.",
    featuredEvent: "Избранное событие",
    groupFairEvent: "Включить в групповую ярмарку",
    noMatches: "Совпадений нет.",
    noGroupsAccess: "Нет групп с доступом к календарю",
    selectGroupPlaceholder: "Выберите группу",
    accessTypes: {
      public: "Публичный",
      group: "Группа"
    },
    durationUnits: {
      day: "д",
      hour: "ч",
      minute: "мин"
    },
    weekdays: {
      monday: "Понедельник",
      tuesday: "Вторник",
      wednesday: "Среда",
      thursday: "Четверг",
      friday: "Пятница",
      saturday: "Суббота",
      sunday: "Воскресенье"
    },
    months: {
      january: "Январь",
      february: "Февраль",
      march: "Март",
      april: "Апрель",
      may: "Май",
      june: "Июнь",
      july: "Июль",
      august: "Август",
      september: "Сентябрь",
      october: "Октябрь",
      november: "Ноябрь",
      december: "Декабрь"
    },
    fields: {
      eventName: "Название события",
      description: "Описание",
      category: "Категория",
      tags: "Теги (макс. 5)",
      accessType: "Тип доступа",
      imageId: "ID изображения (необязательно)",
      imageIdPlaceholder: "напр. file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "Отправить уведомление",
      timezone: "Часовой пояс",
      duration: "Длительность (ДД:ЧЧ:ММ)",
      languages: "Языки (макс. 3)",
      languagesHint: "выбрано: {count}",
      filterLanguages: "Фильтр языков...",
      platforms: "Платформы",
    },
    errors: {
      durationError: "Длительность должна быть положительным числом.",
      maxLanguages: "Можно выбрать не более 3 языков.",
      noGroup: "Выберите группу.",
      requiredMultiple: "{fields} обязательны.",
      requiredSingle: "{field} обязателен."
    },
    exportJson: "Экспорт JSON",
    importJson: "Импорт JSON",
    labels: {
      group: "Группа",
      schedule: "Расписание",
      series: "Серия",
      templates: "Шаблоны"
    },
    section: {
      scheduleSelection: "Выбор расписания"
    },
    selectTemplate: "Выберите шаблон"
  },
  wizard: {
    back: "Назад",
    next: "Далее"
  },
  conflict: {
    title: "Конфликт события",
    message: "Событие \"{title}\" уже запланировано на это время.",
    changeTime: "Выбрать время заново",
    continue: "Создать в любом случае"
  },
  schedules: {
    announcements: {
      hint: "Переключите действия, выполняемые при публикации события этим шаблоном.",
      hintSeries: "Переключите действия, выполняемые при создании или изменении этой серии.",
      title: "Анонсы"
    },
    empty: {
      all: "Нет расписаний для этой группы.",
      series: "Нет серий для этой группы.",
      templates: "Нет шаблонов для этой группы."
    },
    filter: {
      all: "Все",
      label: "Показывать"
    },
    info: {
      series: {
        bullet1: "VRChat заранее создаёт все повторения на сервере по правилу повторения.",
        bullet2: "Настроил и забыл — после создания приложение не нужно.",
        bullet3: "Ограничения: нельзя анонсировать каждое событие отдельно; правило повторения нельзя изменить без пересоздания всех повторений (изменения теряются).",
        bullet4: "Подходит для стабильных повторяющихся событий, которым не нужны анонсы.",
        title: "Серии"
      },
      template: {
        bullet1: "Каждое событие публикуется как отдельная запись в календаре — изменяется индивидуально.",
        bullet2: "По желанию анонсируйте каждое событие через запланированные события Discord, вебхуки и приглашения календаря .ics.",
        bullet3: "Сочетайте с автоматизацией и расписанием по шаблонам для публикации без участия.",
        bullet4: "Для автоматической публикации приложение должно быть запущено.",
        title: "Шаблоны"
      }
    },
    modeBlurb: {
      moreInfo: "(подробнее)",
      series: "Серия — это встроенный планировщик повторяющихся событий VRChat. Сервер заранее создаёт все повторения. Без анонсов.",
      template: "Шаблоны автоматически заполняют повторяющиеся события и публикуют каждое отдельно, с опциональными анонсами."
    },
    saveButton: {
      seriesCreate: "Создать серию",
      template: "Сохранить шаблон"
    },
    subtitle: "Шаблоны для запланированных событий с анонсами и встроенные серии VRChat.",
    types: {
      templateButton: "Шаблон"
    }
  },
  series: {
    confirmDelete: "Удалить «{label}»? Серия и все её повторения будут удалены из VRChat.",
    confirmDeleteTitle: "Удалить серию?",
    created: "Серия «{label}» создана.",
    days: {
      fr: "Пт",
      mo: "Пн",
      sa: "Сб",
      su: "Вс",
      th: "Чт",
      tu: "Вт",
      we: "Ср"
    },
    deleted: "Серия «{label}» удалена.",
    disclaimer: "Серию можно перенести только до начала первого повторения. После старта изменить дату или время можно только удалив серию. События можно запланировать максимум на год вперёд. Максимальная длительность события — 31 день.",
    end: {
      afterDateLabel: "В определённую дату",
      afterOccurrencesLabel: "После N повторений",
      never: "Никогда",
      occurrencesLabel: "повторений"
    },
    errors: {
      createFailed: "Не удалось создать серию.",
      deleteFailed: "Не удалось удалить серию.",
      noDaysOfWeek: "Выберите хотя бы один день недели.",
      noEndDate: "Укажите дату окончания.",
      noLabel: "Метка серии обязательна.",
      noSeries: "Серия не выбрана.",
      noStartDate: "Дата и время первого повторения обязательны.",
      noTitle: "Название события обязательно.",
      notFound: "Серия не найдена.",
      regenFailed: "Не удалось пересоздать серию.",
      startInPast: "Первое повторение должно быть в будущем. Обновите дату перед сохранением.",
      updateFailed: "Не удалось обновить серию."
    },
    frequency: {
      custom: "Своя",
      daily: "Ежедневно",
      monthly: "Ежемесячно",
      weekdays: "По будням",
      weekends: "По выходным",
      weekly: "Еженедельно",
      yearly: "Ежегодно"
    },
    labels: {
      daysOfWeek: "Повторять по",
      endCondition: "Заканчивается",
      frequency: "Частота",
      interval: "Повторять каждые",
      startDate: "Дата первого повторения",
      startTime: "Время начала"
    },
    lockedHint: "Эта серия уже началась. Дата, время и правило повторения заблокированы — но можно ещё настроить, когда она закончится. Чтобы перенести, нажмите «Разблокировать» — при сохранении серия будет заменена на новую.",
    rasterize: {
      retryIn: "Следующая попытка через {wait}.",
      retryNow: "Повторить сейчас",
      statusText: "{count} событий ожидают создания.{wait}"
    },
    regen: {
      choiceMessage: "В этой серии {count} изменённых событий. Текущая серия будет заменена новой.\n\n• Сохранить изменения: совпадения в тот же день обновят новую серию; события без совпадений станут отдельными.\n• Отменить изменения: правки этих повторений будут потеряны.",
      choiceTitle: "Заменить серию?",
      confirmAction: "Заменить серию",
      confirmMessage: "Текущая серия будет заменена новой. Продолжить?",
      discard: "Отменить изменения",
      keep: "Сохранить изменения",
      success: "Серия «{label}» заменена.",
      successWithMods: "Серия «{label}» заменена. {count} изменений в очереди."
    },
    regenWarning: "Правило повторения разблокировано. Если изменить его, текущая серия будет заменена новой.",
    regenWarningWithMods: "Правило повторения разблокировано. Если изменить его, текущая серия будет заменена новой, и вас спросят, как обработать её {count} изменённых событий.",
    unit: {
      days: "дней",
      months: "месяцев",
      weeks: "недель",
      years: "лет"
    },
    unlockButton: "Разблокировать",
    updateRequired: "Доступно обновление. Пожалуйста, обновите перед изменением серий.",
    updated: "Серия «{label}» обновлена.",
    warnings: {
      confirmUpdate: "Обновить серию"
    }
  }
};