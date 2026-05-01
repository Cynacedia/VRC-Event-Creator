// Chinese (Simplified) translations for VRChat Event Creator

export const zh = {
  nav: {
    create: "创建活动",
    modify: "编辑活动",
    settings: "设置",
    schedules: "管理日程"
  },
  auth: {
    title: "登录",
    subtitle: "需要 VRChat 登录凭据",
    username: "用户名",
    password: "密码",
    signIn: "登录",
    logout: "退出登录",
    sessionHint: "会话已缓存到本地。请妥善保管缓存文件。",
    loggingIn: "正在登录...",
    loginFailed: "登录失败。",
    sessionChecking: "正在检查会话...",
    loginRequired: "需要登录。",
    loggedInAs: "已登录为 {name}。",
    loggedOut: "已退出登录。"
  },
  twoFactor: {
    title: "双重验证代码",
    subtitle: "请输入认证代码",
    codeLabel: "代码",
    submit: "提交"
  },
  languageSetup: {
    title: "选择语言",
    subtitle: "请选择语言以开始使用。",
    hint: "你可以随时在设置中更改。",
    continue: "继续"
  },
  gallery: {
    title: "图库",
    subtitle: "选择一张图库图片以使用其图片 ID。",
    empty: "未找到图库图片。",
    loading: "正在加载图库...",
    useButton: "使用图片 ID",
    chooseButton: "选择",
    uploadButton: "上传",
    uploadSuccess: "图库图片已上传。",
    uploadFailed: "无法上传图片。",
    uploadLimitReached: "图库已满（64 张）。请删除一张后再上传。",
    uploadTypeError: "仅支持 PNG 或 JPG 图片。",
    uploadSizeError: "图片必须小于 10 MB。",
    uploadMinDimensions: "图片必须大于 64x64。",
    uploadMaxDimensions: "图片必须小于 2048x2048。",
    loadMore: "加载更多",
    loadFailed: "无法加载图库。"
  },
  settings: {
    theme: {
      title: "主题",
      description: "自定义应用外观。选择预设主题或手动调整。",
      presetLabel: "当前主题",
      nameLabel: "主题名称",
      namePlaceholder: "新主题名称",
      saveButton: "保存主题",
      deleteButton: "删除主题",
      resetButton: "重置为默认",
      savedLabel: "已保存的主题",
      customGroupLabel: "自定义",
      customUnsaved: "自定义（未保存）",
      importButton: "导入主题",
      exportButton: "导出主题",
      openStudio: "打开主题工作室",
      studio: {
        title: "主题工作室",
        subtitle: "预览并微调应用外观。支持 #RRGGBBAA 自定义透明度。",
        header: "页眉",
        statusLabels: "状态与标签",
        accent: "强调",
        panel: "面板",
        mutedText: "弱化文本",
        primary: "主按钮",
        ghost: "幽灵按钮",
        inputField: "输入框",
        dropdown: "下拉菜单",
        dropdownOptionA: "下拉选项 A",
        dropdownOptionB: "下拉选项 B",
        dropdownOptionC: "下拉选项 C",
        dropdownOptionD: "下拉选项 D",
        previewLink: "预览链接",
        toastPreview: "提示预览使用通知面板",
        previewHint: "调整颜色时预览会实时更新。"
      },
      fields: {
        accent: "强调色",
        bg: "背景 1",
        bgDeep: "背景 2",
        backdrop: "背景 3",
        panel: "面板",
        panelAlt: "通知面板",
        headerBg: "页眉",
        overlay: "叠加层",
        text: "文本",
        textMuted: "弱化文本",
        link: "链接",
        linkHover: "链接悬停",
        button: "按钮 1",
        button2: "按钮 2",
        buttonText: "按钮文本",
        border: "边框",
        shadow: "阴影",
        inputBg: "输入背景",
        inputBgStrong: "输入背景 2",
        inputText: "输入文本",
        selectOptionBg: "选择项",
        selectOptionHighlight: "选择高亮",
        backdropOverlay: "背景辉光",
        backdropGrid: "背景网格",
        scanline: "扫描线"
      }
    },
    appInfo: {
      title: "应用信息",
      language: "语言",
      version: "应用版本",
      dataFolder: "当前数据文件夹",
      changeButton: "更改",
      openButton: "打开",
      session: "会话",
      githubLabel: "GitHub 仓库：",
      disclaimerLabel: "免责声明：",
      disclaimerText: "本应用为非官方工具，与 VRChat 无关。使用风险自负。开发者不对使用本工具引发的问题负责。"
    },
    general: {
      title: "常规",
      minimizeToTray: "最小化到系统托盘",
      startOnStartup: "开机自动启动",
      enableAdvanced: "启用高级设置",
      enableImportExport: "导入/导出活动",
      autoUploadImages: "自动上传导入活动/模板中的图库图片"
    },
    discord: {
      enable: "启用 Discord 集成",
      description: "创建 VRChat 活动时自动创建 Discord 活动。",
      tokenLabel: "机器人令牌",
      tokenPlaceholder: "粘贴机器人令牌",
      guildLabel: "服务器 ID",
      guildPlaceholder: "例如 123456789012345678",
      testButton: "验证令牌",
      testSuccess: "已连接为 {botName}",
      testFailed: "连接失败，请检查机器人令牌。",
      tokenMissing: "请先输入机器人令牌。",
      selectGroup: "选择群组...",
      saveButton: "保存",
      saved: "Discord 设置已保存。",
      eventLabel: "创建 Discord 活动",
      syncSuccess: "已为「{title}」创建 Discord 活动",
      syncFailed: "「{title}」的 Discord 同步失败：{error}"
    },
    webhook: {
      postLabel: "发送 Discord Webhook",
      enableLabel: "启用 Webhook",
      syncSuccess: "已为「{title}」发送 Webhook",
      syncFailed: "「{title}」的 Webhook 发送失败：{error}"
    },
    calendar: {
      enable: "启用日历文件生成",
      createInvite: "创建.ics日历邀请",
      enableReminders: "启用.ics日历提醒",
      addReminder: "添加提醒",
      unit: {
        minutes: "分钟",
        hours: "小时",
        days: "天"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "测试Webhook",
      webhookTestSuccess: "Webhook已验证：{webhookName}",
      webhookTestFailed: "Webhook测试失败。请检查URL。",
      webhookMissing: "请先输入Webhook URL。",
      remindersHint: "某些日历应用可能只使用第一个提醒。",
      saveDirLabel: "日历保存目录",
      autoSaved: "日历文件已保存：{filePath}",
      inviteTitle: "日历邀请"
    },
    eckit: {
      importButton: "导入套件",
      webhookName: "Webhook显示名称",
      webhookNamePlaceholder: "我的群组活动",
      embedColor: "嵌入颜色",
      avatarUrl: "头像URL",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "附加自定义Webhook消息",
      messageTitle: "自定义Webhook消息",
      messagePlaceholder: "编写要包含在Webhook帖子中的自定义消息...",
      attachImage: "附加图片",
      noImage: "未选择图片",
      selectImage: "选择"
    },
    saveButton: "保存设置",
    saved: "设置已保存。",
    featuredVerification: {
      permissionDenied: "此群组无权创建精选活动。"
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
    title: "最小化到系统托盘？",
    message: "你可以稍后在设置中更改此选项。",
    yes: "是",
    no: "否"
  },
  categories: {
    hangout: "闲聊",
    exploration: "探索",
    roleplaying: "角色扮演",
    film: "电影与媒体",
    gaming: "游戏",
    music: "音乐",
    dance: "舞蹈",
    performance: "表演",
    arts: "艺术",
    avatars: "虚拟形象",
    education: "教育",
    wellness: "健康",
    other: "其他"
  },
  platforms: {
    pcWindows: "PC（Windows）",
    android: "Android（Quest、移动端等）",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "群组",
      date: "日期",
      details: "详情",
      create: "创建"
    },
    section: {
      groupProfile: "群组 + 模板",
      dateSelection: "日期选择",
      details: "活动详情",
      readyTitle: "准备创建？",
      readyHint: "检查你的选择，然后创建活动。"
    },
    labels: {
      groupRequired: "群组（必填）",
      profileOptional: "模板（可选）",
      advanced: "高级",
      patternDates: "模式日期",
      manualDate: "手动日期",
      manualTime: "手动时间",
      dateSourceManual: "手动",
      dateSource: "使用",
      dateSourcePattern: "模式"
    },
    hints: {
      profileDefaults: "选择模板以填充默认值，或留空手动创建。",
    },
    dateHints: {
      default: "手动模式已就绪。带模式的模板会提供日期选项。",
      noProfile: "未选择模板。请使用手动日期/时间。",
      manualReady: "手动模式就绪。",
      chooseGenerated: "选择生成的日期或手动输入。",
      noUpcoming: "未找到即将到来的日期。",
      loadFailed: "无法加载模式日期。"
    },
    profileHint: "模板为可选项，可用于填充默认值，也可完全手动创建。",
    loadProfile: "加载模板（可选）",
    clearProfile: "清除模板",
    importSuccess: "已从 JSON 导入活动数据。",
    importWrongType: "这似乎是模板 JSON。请改用导入模板。",
    exportSuccess: "已将活动数据导出为 JSON。",
    dateOption: "选择日期",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "角色限制",
      hint: "可选：启用后，仅所选群组角色可加入。",
      optional: "对于实例管理员，所选最低管理员角色及以上的角色均可加入。",
      allAccess: "无（所有人都可加入）",
      managementRoles: "管理角色",
      roles: "角色",
      noRoles: "该群组没有可用的角色。"
    },
    manualProfileOption: "手动（无模板）",
    pastDateError: "不能选择过去的日期。",
    futureDateError: "活动最多只能提前 1 年安排。",
    upcomingLimitNotice: "VRChat 当前将每个群组的即将到来的活动限制为 10 个。",
    upcomingCountGroupFallback: "该群组",
    upcomingCountStatus: "{group} 的即将到来的活动：{count}/{limit}。",
    upcomingCountUnknown: "无法获取即将到来的活动数量。",
    upcomingCountToast: "{group} 现在有 {count}/{limit} 个即将到来的活动。",
    upcomingLimitReached: "已达上限：{group} 已有 {limit} 个即将到来的活动。请删除或改期一个。",
    upcomingLimitError: "已达上限：{group} 已有 {limit} 个即将到来的活动。请删除或改期一个。",
    crossPlatformRateLimit: "速率限制。在其他平台上创建的未跟踪活动可能计入你的限制。请在 {minutes} 分钟后重试。",
    unknownRateLimit: "速率限制。请稍后重试。",
    upcomingCountRefresh: "刷新",
    createButton: "创建活动",
    create: {
      warnConflicts: "提醒冲突的活动",
      alreadyCreating: "正在创建活动，请稍候..."
    },
    created: "活动已创建。",
    failed: "无法创建活动。",
    selectDateError: "请选择日期。",
    updateRequired: "有可用更新。请先更新再创建活动。",
    featuredPermissionRevoked: "该群组不再有创建精选活动的权限。",
    groupFairPermissionRevoked: "该群组不再有将活动包含在群组集市中的权限。"
  },
  modify: {
    subtitle: "编辑或删除群组即将到来的活动。",
    countEmpty: "无法获取即将到来的活动。",
    countGroupFallback: "该群组",
    countStatus: "{group} 的即将到来的活动：{count}。",
    empty: "没有即将到来的活动。",
    dateUnknown: "日期不可用",
    eventImage: "活动图片",
    noImage: "无图片",
    untitled: "未命名活动",
    profileLoad: "加载",
    profileSelectError: "请选择要加载的模板。",
    profileLoadFailed: "无法加载模板默认值。",
    profileLoaded: "模板默认值已加载。",
    manualDate: "更改日期",
    manualTime: "更改时间",
    modal: {
      title: "编辑活动",
      subtitle: "只有点击「保存」时更改才会生效。"
    },
    updateRequired: "有可用更新。请先更新再修改活动。",
    selectEventError: "请选择要编辑的活动。",
    selectDateError: "请选择日期和时间。",
    saveFailed: "无法更新活动。",
    saved: "活动已更新。",
    deleteFailed: "无法删除活动。",
    deleted: "活动已删除。",
    loadFailed: "无法加载活动。",
    missedAutomationNoticeSingular: "1 个活动未能在预定的自动发布时间发布。",
    missedAutomationNoticePlural: "{count} 个活动未能在预定的自动发布时间发布。",
    queuedAutomationNoticeSingular: "速率限制：1 个待处理活动已排队，正在等待速率限制解除。",
    queuedAutomationNoticePlural: "速率限制：{count} 个待处理活动已排队，正在等待速率限制解除。",
    pending: {
      postNow: "立即发布",
      edit: "编辑",
      cancel: "取消",
      publishAt: "发布时间：{time}",
      missedHint: "此自动化已错过。立即发布或删除。",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "活动发布成功。",
      postFailed: "无法发布活动。",
      cancelled: "待发布活动已取消。",
      cancelFailed: "无法取消待发布活动。",
      editSaved: "待发布活动已更新。",
      editFailed: "无法更新待发布活动。"
    },
    postingOptions: "发布选项",
    badge: {
      modified: "已修改"
    },
    filters: {
      heading: "显示",
      modified: "已修改的活动",
      pending: "待处理活动",
      standalone: "独立活动"
    },
    filtersButton: "筛选",
    timeRange: {
      "1month": "1 个月",
      "1week": "1 周",
      "1year": "1 年",
      "2weeks": "2 周",
      "3months": "3 个月",
      "6months": "6 个月",
      label: "时间范围"
    }
  },
  profiles: {
    steps: {
      select: "选择",
      basics: "基础",
      schedule: "计划",
      audience: "受众"
    },
    section: {
      basics: "模板基础",
      audience: "受众"
    },
    labels: {
    },
    buttons: {
      new: "新建"
    },
    importSuccess: "已从 JSON 导入模板数据。",
    importWrongType: "这似乎是活动 JSON。请改用导入活动。",
    exportSuccess: "已将模板数据导出为 JSON。",
    hints: {
      groupAccess: "选择具有日历权限的群组。",
      patternsInfo: "模式用于预生成即将到来的日期。"
    },
    existingProfilePlaceholder: "选择一个模板",
    displayName: "模板名称",
    displayNamePlaceholder: "社区聚会模板",
    durationDefault: "默认时长（DD:HH:MM）",
    dateMode: "日期模式",
    dateModePattern: "基于模式",
    dateModeManual: "仅手动",
    dateModeBoth: "模式 + 手动",
    sendNotificationDefault: "默认发送通知",
    patterns: {
      addButton: "添加模式",
      clearButton: "清除模式",
      noPatterns: "暂无模式。",
      removeButton: "移除",
      patternType: "模式类型",
      weekday: "星期",
      time: "时间",
      confirmClear: "清除所有模式？",
      selectAll: "选择模式类型、星期和时间。",
      selectPattern: "选择一个模式",
      selectWeekday: "选择星期",
      types: {
        every: "每周 [weekday]",
        everyOther: "每隔一周 [weekday]",
        nth1: "每月第 1 个[weekday]",
        nth2: "每月第 2 个[weekday]",
        nth3: "每月第 3 个[weekday]",
        nth4: "每月第 4 个[weekday]",
        last: "每月最后一个[weekday]",
        annual: "每年[日期]"
      },
      format: {
        every: "每周{weekday} {time}",
        everyOther: "每隔一周{weekday} {time}",
        last: "最后一个{weekday} {time}",
        nth: "第{ordinal}个{weekday} {time}",
        annual: "每年{month}{day} {time}"
      },
      ordinal1: "1",
      ordinal2: "2",
      ordinal3: "3",
      ordinal4: "4",
      date: "日期",
      selectMonth: "选择月份"
    },
    automation: {
      title: "自动化（实验性）",
      description: "根据你的模式自动发布活动。活动将在「编辑活动」中显示为「待处理」。",
      enableLabel: "启用自动化",
      timingLabel: "计划规则",
      frequencyLabel: "时间（DD:HH:MM）",
      timingModes: {
        before: "活动开始前",
        after: "上一个活动结束后",
        monthly: "每月特定日期"
      },
      monthlyDay: "月份日期",
      monthlyTime: "时间",
      repeatMode: "重复",
      repeatModes: {
        indefinite: "无限期",
        count: "固定次数"
      },
      repeatCount: "要创建的活动数",
      patternsRequired: "自动化至少需要一个模式",
      confirmTitle: "启用自动化？",
      confirmEnable: "自动化需要应用保持运行才能发布活动。可在「编辑活动」选项卡处理错过的自动化。",
      offsetCorrected: "偏移量（{oldOffset} 天）超过了模式频率（{frequency} 天）。已切换到「之前」模式，偏移量设为 {newOffset} 天。",
      offsetCapped: "偏移量（{oldOffset} 天）超过了模式频率。已限制为 {newOffset} 天。",
      prose: {
        day: "1 天",
        days: "{count} 天",
        hour: "1 小时",
        hours: "{count} 小时",
        minute: "1 分钟",
        minutes: "{count} 分钟",
        and: "和",
        noTime: "—",
        before: "在下一个活动开始前{time}发布。",
        after: "在上一个活动结束后{time}发布。",
        monthly: "每月{day}日{time}"
      },
      helpers: {
      },
      offsetProse: "在下一个活动开始前 7 天发布。",
      monthlyProse: "每月 1 日下午 6 点",
      restoreButton: "恢复",
      restoreSuccess: "已恢复 {count} 个活动",
      restoreNone: "没有可恢复的活动",
      restoreFailed: "恢复活动失败",
      restoreNoProfile: "未选择模板",
      restorableCount: "{count} 个已删除的活动可恢复"
    },
    created: "模板已创建。",
    updated: "模板已更新。",
    deleted: "模板已删除。",
    confirmDelete: "删除模板「{name}」？",
  },
  common: {
    syncing: "正在同步数据...",
    ready: "就绪",
    error: "错误",
    offline: "离线",
    online: "在线",
    resync: "重新同步",
    update: "更新",
    updating: "更新中",
    updateReady: "重启",
    updateDownloading: "正在下载更新...",
    save: "保存",
    cancel: "取消",
    enable: "启用",
    loading: "加载中...",
    refresh: "刷新",
    edit: "编辑",
    delete: "删除",
    rateLimitError: "速率限制。请稍候再试。",
    featuredEvent: "精选活动",
    groupFairEvent: "包含在群组集市中",
    noMatches: "无匹配项。",
    noGroupsAccess: "没有具备日历权限的群组",
    selectGroupPlaceholder: "选择一个群组",
    accessTypes: {
      public: "公开",
      group: "群组"
    },
    durationUnits: {
      day: "天",
      hour: "小时",
      minute: "分钟"
    },
    weekdays: {
      monday: "周一",
      tuesday: "周二",
      wednesday: "周三",
      thursday: "周四",
      friday: "周五",
      saturday: "周六",
      sunday: "周日"
    },
    months: {
      january: "一月",
      february: "二月",
      march: "三月",
      april: "四月",
      may: "五月",
      june: "六月",
      july: "七月",
      august: "八月",
      september: "九月",
      october: "十月",
      november: "十一月",
      december: "十二月"
    },
    fields: {
      eventName: "活动名称",
      description: "描述",
      category: "类别",
      tags: "标签（最多 5 个）",
      accessType: "访问类型",
      imageId: "图片 ID（可选）",
      imageIdPlaceholder: "例如：file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "发送通知",
      timezone: "时区",
      duration: "时长（DD:HH:MM）",
      languages: "语言（最多 3 种）",
      languagesHint: "已选择 {count} 种",
      filterLanguages: "筛选语言...",
      platforms: "平台",
    },
    errors: {
      durationError: "时长必须为正数。",
      maxLanguages: "最多可选择 3 种语言。",
      noGroup: "请选择群组。",
      requiredMultiple: "{fields} 为必填。",
      requiredSingle: "{field} 为必填。"
    },
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    labels: {
      group: "群组",
      schedule: "日程",
      series: "系列",
      templates: "模板"
    },
    section: {
      scheduleSelection: "日程选择"
    },
    selectTemplate: "选择一个模板"
  },
  wizard: {
    back: "返回",
    next: "下一步"
  },
  conflict: {
    title: "活动冲突",
    message: "活动「{title}」已在此时间安排。",
    changeTime: "重新选择时间",
    continue: "仍然创建"
  },
  schedules: {
    announcements: {
      hint: "切换此模板发布活动时要执行的操作。",
      hintSeries: "切换此系列创建或修改时要执行的操作。",
      title: "公告"
    },
    empty: {
      all: "此群组没有日程。",
      series: "此群组没有系列。",
      templates: "此群组没有模板。"
    },
    filter: {
      all: "全部",
      label: "显示"
    },
    info: {
      series: {
        bullet1: "VRChat 根据重复规则在服务器端预先生成所有发生次数。",
        bullet2: "一次设置即可 —— 创建后无需应用程序。",
        bullet3: "限制：无法逐个活动公告；更改重复规则会重新生成所有发生次数（修改会丢失）。",
        bullet4: "适合不需要公告的稳定重复活动。",
        title: "系列"
      },
      template: {
        bullet1: "每个活动作为独立的日历条目发布——可逐次修改。",
        bullet2: "可选择性地通过 Discord 预定活动、Webhook 和 .ics 日历邀请来公告每个活动。",
        bullet3: "结合自动化和基于模式的调度，实现免操作发布。",
        bullet4: "自动发布需要应用保持运行。",
        title: "模板"
      }
    },
    modeBlurb: {
      moreInfo: "（详细信息）",
      series: "系列是 VRChat 原生的重复活动调度器。服务器会预先生成所有发生次数。无公告。",
      template: "模板自动填充重复活动，并逐次单独发布，可选附带公告。"
    },
    saveButton: {
      seriesCreate: "创建系列",
      template: "保存模板"
    },
    subtitle: "用于公告驱动调度的模板，以及 VRChat 原生重复系列。",
    types: {
      templateButton: "模板"
    }
  },
  series: {
    confirmDelete: "删除「{label}」？这将从 VRChat 移除该系列及其所有发生。",
    confirmDeleteTitle: "删除系列？",
    created: "已创建系列「{label}」。",
    days: {
      fr: "周五",
      mo: "周一",
      sa: "周六",
      su: "周日",
      th: "周四",
      tu: "周二",
      we: "周三"
    },
    deleted: "已删除系列「{label}」。",
    disclaimer: "系列只能在第一次发生开始之前重新调度。一旦开始，必须删除才能更改日期或时间。活动最多可提前一年安排。单个活动最长 31 天。",
    end: {
      afterDateLabel: "指定日期",
      afterOccurrencesLabel: "N 次发生后",
      never: "永不",
      occurrencesLabel: "次"
    },
    errors: {
      createFailed: "无法创建系列。",
      deleteFailed: "无法删除系列。",
      noDaysOfWeek: "至少选择一个星期几。",
      noEndDate: "请设置结束日期。",
      noLabel: "系列标签必填。",
      noSeries: "未选择系列。",
      noStartDate: "首次发生的日期和时间必填。",
      noTitle: "活动名称必填。",
      notFound: "未找到系列。",
      regenFailed: "无法重新生成系列。",
      startInPast: "首次发生必须在未来。保存前请更新日期。",
      updateFailed: "无法更新系列。"
    },
    frequency: {
      custom: "自定义",
      daily: "每天",
      monthly: "每月",
      weekdays: "工作日",
      weekends: "周末",
      weekly: "每周",
      yearly: "每年"
    },
    labels: {
      daysOfWeek: "重复在",
      endCondition: "结束",
      frequency: "频率",
      interval: "每隔",
      startDate: "首次发生日期",
      startTime: "开始时间"
    },
    lockedHint: "此系列已开始。日期、时间和重复规则已锁定——但你仍可调整结束时间。如需重新安排，请点击解锁——保存后会用新系列替换此系列。",
    rasterize: {
      retryIn: "下次重试在 {wait} 后。",
      retryNow: "立即重试",
      statusText: "{count} 个待创建的活动。{wait}"
    },
    regen: {
      choiceMessage: "此系列有 {count} 个已修改活动。当前系列将被新系列替换。\n\n• 保留修改：同日重叠会更新到新系列；无重叠的活动变为独立活动。\n• 放弃修改：对这些发生的更改将丢失。",
      choiceTitle: "替换系列？",
      confirmAction: "替换系列",
      confirmMessage: "这将用新系列替换当前系列。继续？",
      discard: "放弃修改",
      keep: "保留修改",
      success: "已替换系列「{label}」。",
      successWithMods: "已替换系列「{label}」。{count} 个修改已排队。"
    },
    regenWarning: "重复规则已解锁。如果更改重复规则，当前系列将被新系列替换。",
    regenWarningWithMods: "重复规则已解锁。如果更改重复规则，当前系列将被新系列替换，且会询问如何处理其 {count} 个已修改活动。",
    unit: {
      days: "天",
      months: "个月",
      weeks: "周",
      years: "年"
    },
    unlockButton: "解锁",
    updateRequired: "有可用更新。请在更改系列前更新。",
    updated: "已更新系列「{label}」。",
    warnings: {
      confirmUpdate: "更新系列"
    }
  }
};