// Japanese translations for VRChat Event Creator

export const ja = {
  nav: {
    create: "イベント作成",
    modify: "イベント編集",
    settings: "設定",
    schedules: "スケジュール管理"
  },
  auth: {
    title: "アクセス",
    subtitle: "VRChatの認証が必要です",
    username: "ユーザー名",
    password: "パスワード",
    signIn: "ログイン",
    logout: "ログアウト",
    sessionHint: "セッション情報はローカル端末にて保存されております。キャッシュファイルを第三者に渡さないように！",
    loggingIn: "ログイン中…",
    loginFailed: "ログインに失敗しました",
    sessionChecking: "セッションを確認中...",
    loginRequired: "ログイン必須",
    loggedInAs: "{name} としてログイン中",
    loggedOut: "ログアウトしました。"
  },
  twoFactor: {
    title: "2段階認証コード",
    subtitle: "認証コードを入力してください",
    codeLabel: "コード",
    submit: "送信"
  },
    languageSetup: {
    title: "言語を選択",
    subtitle: "ご利用になる言語を指定して下さい",
    hint: "設定でいつでも変更できます。",
    continue: "続行"
  },
    gallery: {
    title: "ギャラリー",
    subtitle: "ギャラリー画像を選択してファイルIDを使用します。",
    empty: "ギャラリー画像が見つかりません。",
    loading: "ギャラリーを読み込み中...",
    useButton: "画像IDを使用",
    chooseButton: "選択",
    uploadButton: "アップロード",
    uploadSuccess: "ギャラリー画像をアップロードしました。",
    uploadFailed: "画像をアップロードできませんでした。",
    uploadLimitReached: "ギャラリーがいっぱいです（64枚）。削除してからアップロードしてください。",
    uploadTypeError: "PNGまたはJPGのみ対応しています。",
    uploadSizeError: "画像は10MB未満である必要があります。",
    uploadMinDimensions: "画像は64x64より大きくする必要があります。",
    uploadMaxDimensions: "画像は2048x2048より小さくする必要があります。",
    loadMore: "さらに読み込む",
    loadFailed: "ギャラリーを読み込めませんでした。"
  },
  settings: {
    theme: {
      title: "テーマ",
      description: "アプリの外観をカスタマイズします。プリセットを選ぶか手動で調整してください。",
      presetLabel: "現在のテーマ",
      nameLabel: "テーマ名",
      namePlaceholder: "新しいテーマ名",
      saveButton: "テーマを保存",
      deleteButton: "テーマを削除",
      resetButton: "デフォルトに戻す",
      savedLabel: "保存済みテーマ",
      customGroupLabel: "カスタム",
      customUnsaved: "カスタム（未保存）",
      importButton: "テーマをインポート",
      exportButton: "テーマをエクスポート",
      openStudio: "テーマスタジオを開く",
      studio: {
        title: "テーマスタジオ",
        subtitle: "アプリの外観をプレビューして微調整します。#RRGGBBAA の透明度に対応しています。",
        header: "ヘッダー",
        statusLabels: "ステータスとラベル",
        accent: "アクセント",
        panel: "パネル",
        mutedText: "ミュートテキスト",
        primary: "主要色",
        ghost: "ゴースト",
        inputField: "入力欄",
        dropdown: "ドロップダウン",
        dropdownOptionA: "ドロップダウン項目 A",
        dropdownOptionB: "ドロップダウン項目 B",
        dropdownOptionC: "ドロップダウン項目 C",
        dropdownOptionD: "ドロップダウン項目 D",
        previewLink: "プレビューURL",
        toastPreview: "トーストプレビューは Panel Alt を使用",
        previewHint: "色を調整するとリアルタイムで変化を確認できます。"
      },
      fields: {
        accent: "アクセント",
        bg: "背景 1",
        bgDeep: "背景 2",
        backdrop: "背景 3",
        panel: "パネル",
        panelAlt: "パネル Alt",
        headerBg: "ヘッダー",
        overlay: "オーバーレイ",
        text: "テキスト",
        textMuted: "ミュートテキスト",
        link: "リンク",
        linkHover: "リンクホバー",
        button: "ボタン 1",
        button2: "ボタン 2",
        buttonText: "ボタンテキスト",
        border: "ボーダー",
        shadow: "シャドウ",
        inputBg: "入力背景",
        inputBgStrong: "入力背景 2",
        inputText: "入力テキスト",
        selectOptionBg: "選択オプション",
        selectOptionHighlight: "選択ハイライト",
        backdropOverlay: "背景グロー",
        backdropGrid: "背景グリッド",
        scanline: "スキャンライン"
      }
    },
    appInfo: {
      title: "アプリ情報",
      language: "言語",
      version: "アプリバージョン",
      dataFolder: "現在のデータフォルダ",
      changeButton: "変更",
      openButton: "開く",
      session: "セッション",
      githubLabel: "GitHub リポジトリ:",
      disclaimerLabel: "免責事項:",
      disclaimerText: "このアプリは非公式で VRChat と提携していません。自己責任で使用してください。開発者は本ツールの使用による問題について責任を負いません。"
    },
    general: {
      title: "一般",
      minimizeToTray: "システムトレイに最小化",
      startOnStartup: "システム起動時に起動",
      enableAdvanced: "詳細設定を有効にする",
      enableImportExport: "イベントのインポート/エクスポート",
      autoUploadImages: "インポートしたイベント/プロファイルからギャラリー画像を自動アップロード"
    },
    discord: {
      enable: "Discord連携を有効にする",
      description: "VRChatイベントの作成時に、Discordイベントを自動的に作成します。",
      tokenLabel: "Botトークン",
      tokenPlaceholder: "Botトークンを貼り付け",
      guildLabel: "サーバーID",
      guildPlaceholder: "例: 123456789012345678",
      testButton: "Botトークンを検証",
      testSuccess: "{botName} として接続しました",
      testFailed: "接続に失敗しました。Botトークンを確認してください。",
      tokenMissing: "先にBotトークンを入力してください。",
      selectGroup: "グループを選択...",
      saveButton: "保存",
      saved: "Discord設定を保存しました。",
      eventLabel: "Discordイベントを作成",
      syncSuccess: "「{title}」のDiscordイベントを作成しました",
      syncFailed: "「{title}」のDiscord同期に失敗しました: {error}"
    },
    webhook: {
      postLabel: "Discord Webhookに投稿",
      enableLabel: "Webhookを有効化",
      syncSuccess: "「{title}」のWebhookを送信しました",
      syncFailed: "「{title}」のWebhook配信に失敗: {error}"
    },
    calendar: {
      enable: "カレンダーファイル生成を有効にする",
      createInvite: ".icsカレンダー招待を作成",
      enableReminders: ".icsカレンダーリマインダーを有効にする",
      addReminder: "リマインダーを追加",
      unit: {
        minutes: "分",
        hours: "時間",
        days: "日"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Webhookをテスト",
      webhookTestSuccess: "Webhook確認済み: {webhookName}",
      webhookTestFailed: "Webhookテスト失敗。URLを確認してください。",
      webhookMissing: "まずWebhook URLを入力してください。",
      remindersHint: "一部のカレンダーアプリは最初のリマインダーのみを使用する場合があります。",
      saveDirLabel: "カレンダー保存ディレクトリ",
      autoSaved: "カレンダーファイルを保存しました: {filePath}",
      inviteTitle: "カレンダー招待"
    },
    eckit: {
      importButton: "キットをインポート",
      webhookName: "Webhook表示名",
      webhookNamePlaceholder: "マイグループイベント",
      embedColor: "埋め込みカラー",
      avatarUrl: "アバターURL",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "カスタムWebhookメッセージを添付",
      messageTitle: "カスタムWebhookメッセージ",
      messagePlaceholder: "Webhook投稿に含めるカスタムメッセージを書いてください...",
      attachImage: "画像を添付",
      noImage: "画像未選択",
      selectImage: "選択"
    },
    saveButton: "設定を保存",
    saved: "設定を保存しました。",
    featuredVerification: {
      permissionDenied: "このグループは注目イベントを作成する権限がありません。"
    }
  },
  demo: {
    controls: {
      title: "デモコントロール",
      updateGateLabel: "強制アップデートが必要です",
      updateGateHint: "イベント作成・編集不可、トーストにアップデート必須情報確認"
    }
  },
  trayPrompt: {
    title: "システムトレイに最小化しますか？",
    message: "これは後で設定で変更できます。",
    yes: "はい",
    no: "いいえ"
  },
  categories: {
    hangout: "交流",
    exploration: "探索",
    roleplaying: "ロールプレイ",
    film: "映画・メディア",
    gaming: "ゲーム",
    music: "音楽",
    dance: "ダンス",
    performance: "パフォーマンス",
    arts: "アート",
    avatars: "アバター",
    education: "教育",
    wellness: "ウェルネス",
    other: "その他"
  },
  platforms: {
    pcWindows: "PC (Windows)",
    android: "Android (Quest、モバイルなど)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "グループ",
      date: "日付",
      details: "詳細",
      create: "作成"
    },
    section: {
      groupProfile: "グループ + テンプレート",
      dateSelection: "日付選択",
      details: "イベント詳細",
      readyTitle: "作成の準備はできましたか？",
      readyHint: "選択内容を確認してから作成してください。"
    },
    labels: {
      groupRequired: "グループ (必須)",
      profileOptional: "テンプレート (任意)",
      advanced: "詳細設定",
      patternDates: "パターン日付",
      manualDate: "手動日付",
      manualTime: "手動時刻",
      dateSourceManual: "手動",
      dateSource: "使用",
      dateSourcePattern: "パターン"
    },
    hints: {
      profileDefaults: "テンプレートを選ぶと既定値を使えます。空欄なら手動で作成します。",
    },
    dateHints: {
      default: "手動モードは準備完了。パターン付きテンプレートで日付候補が表示されます。",
      noProfile: "テンプレート未選択です。手動で日付/時刻を入力してください。",
      manualReady: "手動モード準備完了。",
      chooseGenerated: "生成された日付を選ぶか手動で入力してください。",
      noUpcoming: "今後の日程を確認できませんでした",
      loadFailed: "パターン化の日程を読み込めませんでした"
    },
    profileHint: "テンプレートは任意です。デフォルト設定または手動設定が選べます。",
    loadProfile: "テンプレートを読み込む (任意)",
    clearProfile: "テンプレートを削除",
    importSuccess: "イベントデータを JSON からインポートしました。",
    importWrongType: "これはテンプレートの JSON のようです。代わりにテンプレートのインポートを使用してください。",
    exportSuccess: "イベントデータを JSON にエクスポートしました。",
    dateOption: "日付を選択",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
        title: "ロール制限",
        hint: "任意 - 有効にすると、選択したグループロールのみ参加できます。",
        optional: "インスタンスモデレーターは、選択した最下位のモデレーターロール以上のロールが参加できます。",
        allAccess: "なし（全員参加可）",
        managementRoles: "管理ロール",
        roles: "ロール",
        noRoles: "このグループで利用できるロールがありません。"
    },
    manualProfileOption: "手動 (テンプレート無し)",
    pastDateError: "過去の日付は選択できません。",
    futureDateError: "イベントは最長1年先までしか設定できません。",
    upcomingLimitNotice: "VRChatの制限により1時間以内に作成できるイベント件数は10件までです",
    upcomingCountGroupFallback: "このグループ",
    upcomingCountStatus: "1時間以内に作成された{group}のイベント数： {count}/{limit}",
    upcomingCountUnknown: "制作されたイベント数の情報が取得できませんでした",
    upcomingCountToast: "1時間以内に作成された{group}のイベント数： {count}/{limit}",
    upcomingLimitReached: "現在イベント作成が制限されています。少し待ってから再試行してください",
    upcomingLimitError: "イベントの作成に失敗しました。少し待ってから再試行してください",
    crossPlatformRateLimit: "レート制限。他のプラットフォームで作成された追跡されていないイベントが制限にカウントされる可能性があります。{minutes}分後に再試行してください。",
    unknownRateLimit: "レート制限。後でもう一度お試しください。",
    upcomingCountRefresh: "更新",
    createButton: "イベントを作成",
    create: {
      warnConflicts: "重複してるイベントがある場合警告する",
      alreadyCreating: "既にイベントを制作中です。少々お待ちください。"
    },
    created: "イベントを作成しました。",
    failed: "イベントを作成できませんでした。",
    selectDateError: "日付を選択してください。",
    updateRequired: "更新があります。イベントを作成する前に更新してください。",
    featuredPermissionRevoked: "このグループで注目イベントを作成する権限が失われました",
    groupFairPermissionRevoked: "このグル－プでグループフェアイベントを作成する権限が失われました"
  },
  modify: {
    subtitle: "作成済みのグループのイベントを編集、または削除",
    countEmpty: "今後のイベント情報を取得できません。",
    countGroupFallback: "このグループ",
    countStatus: "{group} の今後のイベント: {count}。",
    empty: "今後のイベントはありません。",
    dateUnknown: "日付不明",
    eventImage: "イベント画像",
    noImage: "画像なし",
    untitled: "無題のイベント",
    profileLoad: "読み込み",
    profileSelectError: "読み込むテンプレートを選択してください。",
    profileLoadFailed: "テンプレートの既定値を読み込めませんでした。",
    profileLoaded: "テンプレートの既定値を読み込みました。",
    manualDate: "日付を変更",
    manualTime: "時刻を変更",
    modal: {
      title: "イベントを編集",
      subtitle: "変更は［保存］を押したときにのみ適用されます。"
    },
    updateRequired: "更新があります。イベントを編集する前に更新してください。",
    selectEventError: "編集するイベントを選択してください。",
    selectDateError: "日付と時刻を選択してください。",
    saveFailed: "イベントを更新できませんでした。",
    saved: "イベントを更新しました。",
    deleteFailed: "イベントを削除できませんでした。",
    deleted: "イベントを削除しました。",
    loadFailed: "イベントを読み込めませんでした。",
    missedAutomationNoticeSingular: "1つのイベントは予定された自動化時刻に投稿できませんでした。",
    missedAutomationNoticePlural: "{count}つのイベントは予定された自動化時刻に投稿できませんでした。",
    queuedAutomationNoticeSingular: "レート制限: 1つの保留中のイベントがキューに入っており、レート制限が解除されるのを待っています。",
    queuedAutomationNoticePlural: "レート制限: {count}つの保留中のイベントがキューに入っており、レート制限が解除されるのを待っています。",
    pending: {
      postNow: "今すぐ投稿",
      edit: "編集",
      cancel: "キャンセル",
      publishAt: "公開日: {time}",
      missedHint: "この自動化イベントは正常にスケジュールすることが出来ませんでした。今すぐ投稿するか削除してください",
      queuedDisabled: "レート制限により待機中。「今すぐ投稿」を無効化しました",
      queuedHint: "レート制限により待機中。投稿待ちです",
      posted: "イベントが正常に投稿されました。",
      postFailed: "イベントを投稿できませんでした。",
      cancelled: "予定イベントがキャンセルされました。",
      cancelFailed: "予定イベントをキャンセルできませんでした。",
      editSaved: "予定イベントが更新されました。",
      editFailed: "予定イベントを更新できませんでした。"
    },
    postingOptions: "投稿オプション",
    badge: {
      modified: "変更済み"
    },
    filters: {
      heading: "表示",
      modified: "変更されたイベント",
      pending: "保留中のイベント",
      standalone: "単発イベント"
    },
    filtersButton: "フィルター",
    timeRange: {
      "1month": "1か月",
      "1week": "1週間",
      "1year": "1年",
      "2weeks": "2週間",
      "3months": "3か月",
      "6months": "6か月",
      label: "期間"
    }
  },
  profiles: {
    steps: {
      select: "選択",
      basics: "基本",
      schedule: "スケジュール",
      audience: "対象"
    },
    section: {
      basics: "テンプレート基本",
      audience: "対象"
    },
    labels: {
    },
    buttons: {
      new: "新規"
    },
    importSuccess: "テンプレートデータを JSON からインポートしました。",
    importWrongType: "これはイベントの JSON のようです。代わりにイベントのインポートを使用してください。",
    exportSuccess: "テンプレートデータを JSON にエクスポートしました。",
    hints: {
      groupAccess: "カレンダー権限のあるグループを選択してください。",
      patternsInfo: "パターンは今後の日付を事前生成するために使用されます。"
    },
    existingProfilePlaceholder: "テンプレートを選択",
    displayName: "テンプレート名",
    displayNamePlaceholder: "コミュニティ交流テンプレート",
    durationDefault: "既定の所要時間（DD:HH:MM）",
    dateMode: "日付モード",
    dateModePattern: "パターン",
    dateModeManual: "手動のみ",
    dateModeBoth: "パターン + 手動",
    sendNotificationDefault: "デフォルトで通知を送信",
    patterns: {
      addButton: "パターン追加",
      clearButton: "パターンをクリア",
      noPatterns: "パターンがありません。",
      removeButton: "削除",
      patternType: "パターン種別",
      weekday: "曜日",
      time: "時刻",
      confirmClear: "すべてのパターンを削除しますか？",
      selectAll: "パターン種別、曜日、時刻を選択してください。",
      selectPattern: "パターンを選択",
      selectWeekday: "曜日を選択",
      types: {
        every: "毎週 [曜日]",
        everyOther: "隔週 [曜日]",
        nth1: "毎月第1 [曜日]",
        nth2: "毎月第2 [曜日]",
        nth3: "毎月第3 [曜日]",
        nth4: "毎月第4 [曜日]",
        last: "毎月最終 [曜日]",
        annual: "毎年[日付]"
      },
      format: {
        every: "毎週{weekday} {time}",
        everyOther: "隔週{weekday} {time}",
        last: "最終{weekday} {time}",
        nth: "{ordinal}{weekday} {time}",
        annual: "毎年{month}{day} {time}"
      },
      ordinal1: "第1",
      ordinal2: "第2",
      ordinal3: "第3",
      ordinal4: "第4",
      date: "日付",
      selectMonth: "月を選択"
    },
    automation: {
      title: "自動化（実験的）",
      description: "自動投稿を使うにはアプリケーションを開いておく必要があります。自動投稿を逃した場合は「イベントを変更」のタブから処理できます",
      enableLabel: "自動化を有効にする",
      timingLabel: "スケジュール規則",
      frequencyLabel: "タイミング（DD:HH:MM）",
      timingModes: {
        before: "イベント開始前",
        after: "前のイベント終了後",
        monthly: "毎月特定の日"
      },
      monthlyDay: "日",
      monthlyTime: "時刻",
      repeatMode: "繰り返し",
      repeatModes: {
        indefinite: "無期限",
        count: "固定回数"
      },
      repeatCount: "作成数",
      patternsRequired: "自動化には少なくとも1つのパターンが必要です",
      confirmTitle: "自動化を有効にしますか？",
      confirmEnable: "自動化にはイベントを投稿するためにアプリの実行が必要です。見逃した自動化は「イベントを変更」タブから処理できます。",
      offsetCorrected: "オフセット（{oldOffset}日）がパターン頻度（{frequency}日）を超えました。「前」モードに切り替え、{newOffset}日のオフセットに設定しました。",
      offsetCapped: "オフセット（{oldOffset}日）がパターン頻度を超えました。{newOffset}日に制限しました。",
      prose: {
        day: "1日",
        days: "{count}日",
        hour: "1時間",
        hours: "{count}時間",
        minute: "1分",
        minutes: "{count}分",
        and: "および",
        noTime: "—",
        before: "次のイベントの開始{time}前に投稿する。",
        after: "前のイベントの終了{time}後に投稿する。",
        monthly: "毎月{day}日{time}"
      },
      helpers: {
      },
      offsetProse: "次のイベントの開始7日前に投稿する。",
      monthlyProse: "毎月1日午後6時",
      restoreButton: "復元",
      restoreSuccess: "{count} 件のイベントを復元しました",
      restoreNone: "復元できるイベントはありません",
      restoreFailed: "イベントの復元に失敗しました",
      restoreNoProfile: "テンプレートが選択されていません",
      restorableCount: "{count} 件の削除済みイベントを復元できます"
    },
    created: "テンプレートを作成しました。",
    updated: "テンプレートを更新しました。",
    deleted: "テンプレートを削除しました。",
    confirmDelete: "テンプレート「{name}」を削除しますか？",
  },
  common: {
    syncing: "同期中...",
    ready: "準備完了",
    error: "エラー",
    offline: "オフライン",
    online: "オンライン",
    resync: "再同期",
    update: "更新",
    updating: "更新中",
    updateReady: "再起動",
    updateDownloading: "アップデートをダウンロード中...",
    save: "保存",
    cancel: "キャンセル",
    enable: "有効にする",
    loading: "読み込み中...",
    refresh: "更新",
    edit: "編集",
    delete: "削除",
    rateLimitError: "レート制限。しばらく待ってから再試行してください。",
    featuredEvent: "注目イベント",
    groupFairEvent: "グループフェアに含める",
    noMatches: "一致する項目がありません。",
    noGroupsAccess: "カレンダー権限のあるグループがありません",
    selectGroupPlaceholder: "グループを選択してください",
    accessTypes: {
      public: "公開",
      group: "グループ"
    },
    durationUnits: {
      day: "日",
      hour: "時間",
      minute: "分"
    },
    weekdays: {
      monday: "月曜日",
      tuesday: "火曜日",
      wednesday: "水曜日",
      thursday: "木曜日",
      friday: "金曜日",
      saturday: "土曜日",
      sunday: "日曜日"
    },
    months: {
      january: "1月",
      february: "2月",
      march: "3月",
      april: "4月",
      may: "5月",
      june: "6月",
      july: "7月",
      august: "8月",
      september: "9月",
      october: "10月",
      november: "11月",
      december: "12月"
    },
    fields: {
      eventName: "イベント名",
      description: "説明",
      category: "カテゴリー",
      tags: "タグ（最大5）",
      accessType: "アクセスタイプ",
      imageId: "画像ID（任意）",
      imageIdPlaceholder: "例: file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "通知を送信",
      timezone: "タイムゾーン",
      duration: "期間（日数：時間：分）",
      languages: "言語（最大3）",
      languagesHint: "{count}件選択",
      filterLanguages: "言語を検索...",
      platforms: "プラットフォーム",
    },
    errors: {
      durationError: "所要時間は正の数である必要があります。",
      maxLanguages: "最大3言語まで選択できます。",
      noGroup: "グループを選択してください。",
      requiredMultiple: "{fields} は必須です。",
      requiredSingle: "{field} は必須です。"
    },
    exportJson: "JSON をエクスポート",
    importJson: "JSON をインポート",
    labels: {
      group: "グループ",
      schedule: "スケジュール",
      series: "シリーズ",
      templates: "テンプレート"
    },
    section: {
      scheduleSelection: "スケジュール選択"
    },
    selectTemplate: "テンプレートを選択"
  },
  wizard: {
    back: "戻る",
    next: "次へ"
  },
  conflict: {
    title: "イベントの重複",
    message: "イベント「{title}」はすでにこの時間に予定されています。",
    changeTime: "時間を再選択",
    continue: "そのまま作成"
  },
  schedules: {
    announcements: {
      hint: "このテンプレートがイベントを投稿するときに行う操作を切り替えます。",
      hintSeries: "このシリーズが作成または変更されたときに行う操作を切り替えます。",
      title: "アナウンス"
    },
    empty: {
      all: "このグループのスケジュールはありません。",
      series: "このグループのシリーズはありません。",
      templates: "このグループのテンプレートはありません。"
    },
    filter: {
      all: "すべて",
      label: "表示"
    },
    info: {
      series: {
        bullet1: "VRChat が繰り返しルールに基づき、すべての回をサーバー側で事前生成します。",
        bullet2: "一度設定すれば後は不要 — 作成後はアプリ不要です。",
        bullet3: "制限事項：イベントごとのアナウンス不可。繰り返しルールを変更すると全ての回が再生成され、編集内容は失われます。",
        bullet4: "アナウンスが不要な、安定した繰り返しイベントに最適です。",
        title: "シリーズ"
      },
      template: {
        bullet1: "各イベントは独立したカレンダー項目として投稿され、回ごとに編集できます。",
        bullet2: "各イベントを Discord 予定イベント、Webhook、.ics カレンダー招待で任意にアナウンスできます。",
        bullet3: "自動化とパターンベースのスケジュールと組み合わせれば、手動操作なしで投稿できます。",
        bullet4: "自動投稿にはアプリが起動している必要があります。",
        title: "テンプレート"
      }
    },
    modeBlurb: {
      moreInfo: "（詳細）",
      series: "シリーズは VRChat ネイティブの繰り返しスケジューラーです。サーバー側で全ての回を事前生成します。アナウンスはありません。",
      template: "テンプレートは繰り返しイベントを自動入力し、各回を個別に投稿します（アナウンスは任意）。"
    },
    saveButton: {
      seriesCreate: "シリーズを作成",
      template: "テンプレートを保存"
    },
    subtitle: "アナウンス付きのスケジュール用テンプレートと、VRChat ネイティブの繰り返しシリーズ。",
    types: {
      templateButton: "テンプレート"
    }
  },
  series: {
    confirmDelete: "「{label}」を削除しますか？シリーズと全ての回が VRChat から削除されます。",
    confirmDeleteTitle: "シリーズを削除しますか？",
    created: "シリーズ「{label}」を作成しました。",
    days: {
      fr: "金",
      mo: "月",
      sa: "土",
      su: "日",
      th: "木",
      tu: "火",
      we: "水"
    },
    deleted: "シリーズ「{label}」を削除しました。",
    disclaimer: "シリーズの予定変更は、最初の回が開始する前のみ可能です。開始後は日時を変更するには削除が必要です。イベントは最大1年先まで予約できます。1イベントの最長は31日です。",
    end: {
      afterDateLabel: "指定日",
      afterOccurrencesLabel: "N 回後",
      never: "なし",
      occurrencesLabel: "回"
    },
    errors: {
      createFailed: "シリーズを作成できませんでした。",
      deleteFailed: "シリーズを削除できませんでした。",
      noDaysOfWeek: "曜日を1つ以上選んでください。",
      noEndDate: "終了日を指定してください。",
      noLabel: "シリーズのラベルは必須です。",
      noSeries: "シリーズが選択されていません。",
      noStartDate: "初回の日付と時刻は必須です。",
      noTitle: "イベント名は必須です。",
      notFound: "シリーズが見つかりません。",
      regenFailed: "シリーズを再生成できませんでした。",
      startInPast: "初回は未来である必要があります。保存する前に日付を更新してください。",
      updateFailed: "シリーズを更新できませんでした。"
    },
    frequency: {
      custom: "カスタム",
      daily: "毎日",
      monthly: "毎月",
      weekdays: "平日",
      weekends: "週末",
      weekly: "毎週",
      yearly: "毎年"
    },
    labels: {
      daysOfWeek: "繰り返す曜日",
      endCondition: "終了",
      frequency: "頻度",
      interval: "繰り返し間隔",
      startDate: "初回の日付",
      startTime: "開始時刻"
    },
    lockedHint: "このシリーズは既に開始しています。日付・時刻・繰り返しルールはロックされていますが、終了タイミングは調整できます。予定変更するには「ロック解除」をクリック — 保存すると新しいシリーズで置き換えられます。",
    rasterize: {
      retryIn: "次の再試行は {wait} 後です。",
      retryNow: "今すぐ再試行",
      statusText: "{count} 件のイベントが作成待ちです。{wait}"
    },
    regen: {
      choiceMessage: "このシリーズには {count} 件の変更済みイベントがあります。現在のシリーズは新しいシリーズに置き換えられます。\n\n• 変更を維持：同じ日の重複は新シリーズに反映され、重複しないものは単発イベントになります。\n• 変更を破棄：これらの回への変更は失われます。",
      choiceTitle: "シリーズを置き換えますか？",
      confirmAction: "シリーズを置き換え",
      confirmMessage: "現在のシリーズを新しいシリーズで置き換えます。続行しますか？",
      discard: "変更を破棄",
      keep: "変更を維持",
      success: "シリーズ「{label}」を置き換えました。",
      successWithMods: "シリーズ「{label}」を置き換えました。{count} 件の変更がキューに入っています。"
    },
    regenWarning: "繰り返しのロックが解除されています。繰り返しを変更すると、現在のシリーズは新しいシリーズに置き換えられます。",
    regenWarningWithMods: "繰り返しのロックが解除されています。繰り返しを変更すると、現在のシリーズは新しいシリーズに置き換えられ、変更済みの {count} 件のイベントの扱いを尋ねられます。",
    unit: {
      days: "日",
      months: "か月",
      weeks: "週間",
      years: "年"
    },
    unlockButton: "ロック解除",
    updateRequired: "アップデートがあります。シリーズを変更する前に更新してください。",
    updated: "シリーズ「{label}」を更新しました。",
    warnings: {
      confirmUpdate: "シリーズを更新"
    }
  }
};