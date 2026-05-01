// Korean translations for VRChat Event Creator

export const ko = {
  nav: {
    create: "이벤트 만들기",
    modify: "이벤트 수정",
    settings: "설정",
    schedules: "일정 관리"
  },
  auth: {
    title: "로그인",
    subtitle: "VRChat 자격 증명 필요",
    username: "사용자 이름",
    password: "비밀번호",
    signIn: "로그인",
    logout: "로그아웃",
    sessionHint: "세션은 로컬에 캐시됩니다. 캐시 파일을 안전하게 보관하세요.",
    loggingIn: "로그인 중...",
    loginFailed: "로그인 실패.",
    sessionChecking: "세션 확인 중...",
    loginRequired: "로그인이 필요합니다.",
    loggedInAs: "{name}로 로그인됨.",
    loggedOut: "로그아웃됨."
  },
  twoFactor: {
    title: "2단계 코드",
    subtitle: "인증 코드를 입력하세요",
    codeLabel: "코드",
    submit: "제출"
  },
  languageSetup: {
    title: "언어 선택",
    subtitle: "시작할 언어를 선택하세요.",
    hint: "설정에서 언제든지 변경할 수 있습니다.",
    continue: "계속"
  },
  gallery: {
    title: "갤러리",
    subtitle: "갤러리 이미지를 선택해 파일 ID를 사용하세요.",
    empty: "갤러리 이미지가 없습니다.",
    loading: "갤러리 불러오는 중...",
    useButton: "이미지 ID 사용",
    chooseButton: "선택",
    uploadButton: "업로드",
    uploadSuccess: "갤러리 이미지를 업로드했습니다.",
    uploadFailed: "이미지를 업로드할 수 없습니다.",
    uploadLimitReached: "갤러리가 가득 찼습니다(64개). 업로드하려면 삭제하세요.",
    uploadTypeError: "PNG 또는 JPG 이미지만 지원됩니다.",
    uploadSizeError: "이미지는 10MB보다 작아야 합니다.",
    uploadMinDimensions: "이미지는 64x64보다 커야 합니다.",
    uploadMaxDimensions: "이미지는 2048x2048보다 작아야 합니다.",
    loadMore: "더 불러오기",
    loadFailed: "갤러리를 불러올 수 없습니다."
  },
  settings: {
    theme: {
      title: "테마",
      description: "앱의 외형을 사용자 지정하세요. 프리셋을 선택하거나 수동으로 조정하세요.",
      presetLabel: "현재 테마",
      nameLabel: "테마 이름",
      namePlaceholder: "새 테마 이름",
      saveButton: "테마 저장",
      deleteButton: "테마 삭제",
      resetButton: "기본값으로 재설정",
      savedLabel: "저장된 테마",
      customGroupLabel: "사용자 지정",
      customUnsaved: "사용자 지정(미저장)",
      importButton: "테마 가져오기",
      exportButton: "테마 내보내기",
      openStudio: "테마 스튜디오 열기",
      studio: {
        title: "테마 스튜디오",
        subtitle: "앱의 외형을 미리 보고 조정하세요. #RRGGBBAA 투명도 지원.",
        header: "헤더",
        statusLabels: "상태 및 라벨",
        accent: "강조",
        panel: "패널",
        mutedText: "흐린 텍스트",
        primary: "기본",
        ghost: "고스트",
        inputField: "입력 필드",
        dropdown: "드롭다운",
        dropdownOptionA: "드롭다운 옵션 A",
        dropdownOptionB: "드롭다운 옵션 B",
        dropdownOptionC: "드롭다운 옵션 C",
        dropdownOptionD: "드롭다운 옵션 D",
        previewLink: "미리보기 링크",
        toastPreview: "토스트 미리보기는 Panel Alt 사용",
        previewHint: "색을 조정하면 미리보기가 즉시 업데이트됩니다."
      },
      fields: {
        accent: "강조",
        bg: "배경 1",
        bgDeep: "배경 2",
        backdrop: "배경 3",
        panel: "패널",
        panelAlt: "패널 Alt",
        headerBg: "헤더",
        overlay: "오버레이",
        text: "텍스트",
        textMuted: "흐린 텍스트",
        link: "링크",
        linkHover: "링크 호버",
        button: "버튼 1",
        button2: "버튼 2",
        buttonText: "버튼 텍스트",
        border: "테두리",
        shadow: "그림자",
        inputBg: "입력 배경",
        inputBgStrong: "입력 배경 2",
        inputText: "입력 텍스트",
        selectOptionBg: "선택 옵션",
        selectOptionHighlight: "선택 강조",
        backdropOverlay: "배경 글로우",
        backdropGrid: "배경 그리드",
        scanline: "스캔라인"
      }
    },
    appInfo: {
      title: "앱 정보",
      language: "언어",
      version: "앱 버전",
      dataFolder: "현재 데이터 폴더",
      changeButton: "변경",
      openButton: "열기",
      session: "세션",
      githubLabel: "GitHub 저장소:",
      disclaimerLabel: "면책 조항:",
      disclaimerText: "이 애플리케이션은 비공식이며 VRChat과 관련이 없습니다. 사용에 따른 책임은 사용자에게 있습니다. 이 도구 사용으로 발생하는 문제에 대해 개발자는 책임지지 않습니다."
    },
    general: {
      title: "일반",
      minimizeToTray: "시스템 트레이로 최소화",
      startOnStartup: "시스템 시작 시 실행",
      enableAdvanced: "고급 설정 활성화",
      enableImportExport: "이벤트 가져오기/내보내기",
      autoUploadImages: "가져온 이벤트/템플릿에서 갤러리 이미지 자동 업로드"
    },
    discord: {
      enable: "Discord 연동 활성화",
      description: "VRChat 이벤트 생성 시 Discord 이벤트를 자동으로 만듭니다.",
      tokenLabel: "봇 토큰",
      tokenPlaceholder: "봇 토큰 붙여넣기",
      guildLabel: "서버 ID",
      guildPlaceholder: "예: 123456789012345678",
      testButton: "봇 토큰 확인",
      testSuccess: "{botName}(으)로 연결됨",
      testFailed: "연결 실패. 봇 토큰을 확인해 주세요.",
      tokenMissing: "먼저 봇 토큰을 입력해 주세요.",
      selectGroup: "그룹 선택...",
      saveButton: "저장",
      saved: "Discord 설정이 저장되었습니다.",
      eventLabel: "Discord 이벤트 생성",
      syncSuccess: "\"{title}\" Discord 이벤트가 생성되었습니다",
      syncFailed: "\"{title}\" Discord 동기화 실패: {error}"
    },
    webhook: {
      postLabel: "Discord Webhook 게시",
      enableLabel: "Webhook 활성화",
      syncSuccess: "\"{title}\" 웹훅 전송 완료",
      syncFailed: "\"{title}\" 웹훅 전송 실패: {error}"
    },
    calendar: {
      enable: "캘린더 파일 생성 활성화",
      createInvite: ".ics 캘린더 초대 생성",
      enableReminders: ".ics 캘린더 알림 활성화",
      addReminder: "알림 추가",
      unit: {
        minutes: "분",
        hours: "시간",
        days: "일"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Webhook 테스트",
      webhookTestSuccess: "Webhook 확인됨: {webhookName}",
      webhookTestFailed: "Webhook 테스트 실패. URL을 확인하세요.",
      webhookMissing: "먼저 Webhook URL을 입력하세요.",
      remindersHint: "일부 캘린더 앱은 첫 번째 알림만 사용할 수 있습니다.",
      saveDirLabel: "캘린더 저장 디렉토리",
      autoSaved: "캘린더 파일 저장됨: {filePath}",
      inviteTitle: "캘린더 초대"
    },
    eckit: {
      importButton: "키트 가져오기",
      webhookName: "Webhook 표시 이름",
      webhookNamePlaceholder: "내 그룹 이벤트",
      embedColor: "임베드 색상",
      avatarUrl: "아바타 URL",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "사용자 지정 Webhook 메시지 첨부",
      messageTitle: "사용자 지정 Webhook 메시지",
      messagePlaceholder: "Webhook 게시물에 포함할 사용자 지정 메시지를 작성하세요...",
      attachImage: "이미지 첨부",
      noImage: "선택된 이미지 없음",
      selectImage: "선택"
    },
    saveButton: "설정 저장",
    saved: "설정이 저장되었습니다.",
    featuredVerification: {
      permissionDenied: "이 그룹은 추천 이벤트를 만들 권한이 없습니다."
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
    title: "시스템 트레이로 최소화하시겠습니까?",
    message: "나중에 설정에서 변경할 수 있습니다.",
    yes: "예",
    no: "아니요"
  },
  categories: {
    hangout: "모임",
    exploration: "탐험",
    roleplaying: "역할극",
    film: "영화 및 미디어",
    gaming: "게임",
    music: "음악",
    dance: "댄스",
    performance: "퍼포먼스",
    arts: "예술",
    avatars: "아바타",
    education: "교육",
    wellness: "웰니스",
    other: "기타"
  },
  platforms: {
    pcWindows: "PC (윈도우)",
    android: "Android (Quest, 모바일 등)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "그룹",
      date: "날짜",
      details: "세부 정보",
      create: "생성"
    },
    section: {
      groupProfile: "그룹 + 템플릿",
      dateSelection: "날짜 선택",
      details: "이벤트 세부 정보",
      readyTitle: "생성할 준비가 되었나요?",
      readyHint: "선택 내용을 확인한 다음 이벤트를 생성하세요."
    },
    labels: {
      groupRequired: "그룹 (필수)",
      profileOptional: "템플릿 (선택)",
      advanced: "고급",
      patternDates: "패턴 날짜",
      manualDate: "수동 날짜",
      manualTime: "수동 시간",
      dateSourceManual: "수동",
      dateSource: "사용",
      dateSourcePattern: "패턴"
    },
    hints: {
      profileDefaults: "기본값을 위해 템플릿을 선택하거나, 비워두고 수동으로 생성하세요.",
    },
    dateHints: {
      default: "수동 모드가 준비되었습니다. 패턴이 있는 템플릿은 날짜 옵션을 제공합니다.",
      noProfile: "선택된 템플릿이 없습니다. 수동 날짜/시간을 사용하세요.",
      manualReady: "수동 모드 준비됨.",
      chooseGenerated: "생성된 날짜를 선택하거나 수동을 사용하세요.",
      noUpcoming: "예정된 날짜가 없습니다.",
      loadFailed: "패턴 날짜를 불러올 수 없습니다."
    },
    profileHint: "템플릿은 선택 사항입니다. 기본값을 위해 사용하거나 수동으로 모두 생성하세요.",
    loadProfile: "템플릿 불러오기 (선택)",
    clearProfile: "템플릿 지우기",
    importSuccess: "JSON에서 이벤트 데이터를 가져왔습니다.",
    importWrongType: "템플릿 JSON으로 보입니다. 대신 템플릿 가져오기를 사용하세요.",
    exportSuccess: "이벤트 데이터를 JSON으로 내보냈습니다.",
    dateOption: "날짜 선택",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "역할 제한",
      hint: "선택 사항 - 활성화하면 선택한 그룹 역할만 참여할 수 있습니다.",
      optional: "인스턴스 모더레이터의 경우, 선택한 최하위 모더레이터 역할 이상은 모두 참여할 수 있습니다.",
      allAccess: "없음 (모두 참여 가능)",
      managementRoles: "관리 역할",
      roles: "역할",
      noRoles: "이 그룹에 사용 가능한 역할이 없습니다."
    },
    manualProfileOption: "수동 (템플릿 없음)",
    pastDateError: "과거 날짜는 선택할 수 없습니다.",
    futureDateError: "이벤트는 최대 1년까지만 예약할 수 있습니다.",
    upcomingLimitNotice: "VRChat은 각 그룹에 대해 예정된 이벤트를 10개로 제한합니다.",
    upcomingCountGroupFallback: "이 그룹",
    upcomingCountStatus: "{group}의 예정 이벤트: {count}/{limit}.",
    upcomingCountUnknown: "예정 이벤트 수를 사용할 수 없습니다.",
    upcomingCountToast: "{group}의 예정 이벤트가 {count}/{limit}개가 되었습니다.",
    upcomingLimitReached: "제한에 도달했습니다: {group}에 이미 예정 이벤트 {limit}개가 있습니다. 하나를 삭제하거나 일정 변경하세요.",
    upcomingLimitError: "제한에 도달했습니다: {group}에 이미 예정 이벤트 {limit}개가 있습니다. 하나를 삭제하거나 일정 변경하세요.",
    crossPlatformRateLimit: "속도 제한. 다른 플랫폼에서 생성된 추적되지 않은 이벤트가 제한에 포함될 수 있습니다. {minutes}분 후 다시 시도하세요.",
    unknownRateLimit: "속도 제한. 나중에 다시 시도하세요.",
    upcomingCountRefresh: "새로고침",
    createButton: "이벤트 생성",
    create: {
      warnConflicts: "충돌하는 이벤트에 대해 경고",
      alreadyCreating: "이벤트를 생성 중입니다. 잠시 기다려 주세요..."
    },
    created: "이벤트가 생성되었습니다.",
    failed: "이벤트를 만들 수 없습니다.",
    selectDateError: "날짜를 선택하세요.",
    updateRequired: "업데이트가 있습니다. 이벤트를 만들기 전에 업데이트하세요.",
    featuredPermissionRevoked: "이 그룹은 더 이상 주목 이벤트를 생성할 권한이 없습니다.",
    groupFairPermissionRevoked: "이 그룹은 더 이상 그룹 페어에 이벤트를 포함할 권한이 없습니다."
  },
  modify: {
    subtitle: "그룹의 예정된 이벤트를 수정하거나 삭제합니다.",
    countEmpty: "예정된 이벤트를 불러올 수 없습니다.",
    countGroupFallback: "이 그룹",
    countStatus: "{group}의 예정된 이벤트: {count}.",
    empty: "예정된 이벤트가 없습니다.",
    dateUnknown: "날짜 정보 없음",
    eventImage: "이벤트 이미지",
    noImage: "이미지 없음",
    untitled: "제목 없는 이벤트",
    profileLoad: "불러오기",
    profileSelectError: "불러올 템플릿을 선택하세요.",
    profileLoadFailed: "템플릿 기본값을 불러올 수 없습니다.",
    profileLoaded: "템플릿 기본값을 불러왔습니다.",
    manualDate: "날짜 변경",
    manualTime: "시간 변경",
    modal: {
      title: "이벤트 수정",
      subtitle: "변경 사항은 저장을 눌렀을 때만 적용됩니다."
    },
    updateRequired: "업데이트가 있습니다. 이벤트를 수정하기 전에 업데이트하세요.",
    selectEventError: "수정할 이벤트를 선택하세요.",
    selectDateError: "날짜와 시간을 선택하세요.",
    saveFailed: "이벤트를 업데이트할 수 없습니다.",
    saved: "이벤트가 업데이트되었습니다.",
    deleteFailed: "이벤트를 삭제할 수 없습니다.",
    deleted: "이벤트가 삭제되었습니다.",
    loadFailed: "이벤트를 불러올 수 없습니다.",
    missedAutomationNoticeSingular: "1개의 이벤트를 예약된 자동화 시간에 게시할 수 없습니다.",
    missedAutomationNoticePlural: "{count}개의 이벤트를 예약된 자동화 시간에 게시할 수 없습니다.",
    queuedAutomationNoticeSingular: "속도 제한: 1개의 대기 중인 이벤트가 대기열에 있으며 속도 제한이 해제되기를 기다리고 있습니다.",
    queuedAutomationNoticePlural: "속도 제한: {count}개의 대기 중인 이벤트가 대기열에 있으며 속도 제한이 해제되기를 기다리고 있습니다.",
    pending: {
      postNow: "지금 게시",
      edit: "편집",
      cancel: "취소",
      publishAt: "게시 예정일: {time}",
      missedHint: "이 자동화가 누락되었습니다. 지금 게시하거나 삭제하세요.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "이벤트가 성공적으로 게시되었습니다.",
      postFailed: "이벤트를 게시할 수 없습니다.",
      cancelled: "예정된 이벤트가 취소되었습니다.",
      cancelFailed: "예정된 이벤트를 취소할 수 없습니다.",
      editSaved: "예정된 이벤트가 업데이트되었습니다.",
      editFailed: "예정된 이벤트를 업데이트할 수 없습니다."
    },
    postingOptions: "게시 옵션",
    badge: {
      modified: "수정됨"
    },
    filters: {
      heading: "표시",
      modified: "수정된 이벤트",
      pending: "대기 중인 이벤트",
      standalone: "단독 이벤트"
    },
    filtersButton: "필터",
    timeRange: {
      "1month": "1개월",
      "1week": "1주",
      "1year": "1년",
      "2weeks": "2주",
      "3months": "3개월",
      "6months": "6개월",
      label: "기간"
    }
  },
  profiles: {
    steps: {
      select: "선택",
      basics: "기본",
      schedule: "일정",
      audience: "대상"
    },
    section: {
      basics: "템플릿 기본",
      audience: "대상"
    },
    labels: {
    },
    buttons: {
      new: "새로 만들기"
    },
    importSuccess: "JSON에서 템플릿 데이터를 가져왔습니다.",
    importWrongType: "이벤트 JSON으로 보입니다. 대신 이벤트 가져오기를 사용하세요.",
    exportSuccess: "템플릿 데이터를 JSON으로 내보냈습니다.",
    hints: {
      groupAccess: "캘린더 접근 권한이 있는 그룹을 선택하세요.",
      patternsInfo: "패턴은 예정 날짜를 미리 생성하는 데 사용됩니다."
    },
    existingProfilePlaceholder: "템플릿 선택",
    displayName: "템플릿 이름",
    displayNamePlaceholder: "커뮤니티 모임 템플릿",
    durationDefault: "기본 지속 시간 (DD:HH:MM)",
    dateMode: "날짜 모드",
    dateModePattern: "패턴 기반",
    dateModeManual: "수동만",
    dateModeBoth: "패턴 + 수동",
    sendNotificationDefault: "기본적으로 알림 보내기",
    patterns: {
      addButton: "패턴 추가",
      clearButton: "패턴 지우기",
      noPatterns: "아직 패턴이 없습니다.",
      removeButton: "제거",
      patternType: "패턴 유형",
      weekday: "요일",
      time: "시간",
      confirmClear: "모든 패턴을 지울까요?",
      selectAll: "패턴 유형, 요일, 시간을 선택하세요.",
      selectPattern: "패턴 선택",
      selectWeekday: "요일 선택",
      types: {
        every: "매주 [weekday]",
        everyOther: "격주 [weekday]",
        nth1: "매월 1번째 [weekday]",
        nth2: "매월 2번째 [weekday]",
        nth3: "매월 3번째 [weekday]",
        nth4: "매월 4번째 [weekday]",
        last: "매월 마지막 [weekday]",
        annual: "매년 [날짜]"
      },
      format: {
        every: "매주 {weekday} {time}",
        everyOther: "격주 {weekday} {time}",
        last: "마지막 {weekday} {time}",
        nth: "{ordinal} {weekday} {time}",
        annual: "매년 {month} {day} {time}"
      },
      ordinal1: "첫째",
      ordinal2: "둘째",
      ordinal3: "셋째",
      ordinal4: "넷째",
      date: "날짜",
      selectMonth: "월 선택"
    },
    automation: {
      title: "자동화 (실험적)",
      description: "패턴에 따라 이벤트를 자동으로 게시합니다. 이벤트는 이벤트 수정에서 \"보류 중\"으로 표시됩니다.",
      enableLabel: "자동화 활성화",
      timingLabel: "일정 규칙",
      frequencyLabel: "타이밍 (DD:HH:MM)",
      timingModes: {
        before: "이벤트 시작 전",
        after: "이전 이벤트 종료 후",
        monthly: "매월 특정 날짜"
      },
      monthlyDay: "일",
      monthlyTime: "시간",
      repeatMode: "반복",
      repeatModes: {
        indefinite: "무기한",
        count: "고정 횟수"
      },
      repeatCount: "생성 수",
      patternsRequired: "자동화에는 최소 1개의 패턴이 필요합니다",
      confirmTitle: "자동화를 활성화하시겠습니까?",
      confirmEnable: "자동화를 사용하려면 이벤트를 게시하기 위해 앱이 실행 중이어야 합니다. 놓친 자동화는 이벤트 수정 탭에서 처리할 수 있습니다.",
      offsetCorrected: "오프셋({oldOffset}일)이 패턴 빈도({frequency}일)를 초과했습니다. \"전\" 모드로 전환하고 {newOffset}일 오프셋으로 설정했습니다.",
      offsetCapped: "오프셋({oldOffset}일)이 패턴 빈도를 초과했습니다. {newOffset}일로 제한되었습니다.",
      prose: {
        day: "1일",
        days: "{count}일",
        hour: "1시간",
        hours: "{count}시간",
        minute: "1분",
        minutes: "{count}분",
        and: "그리고",
        noTime: "—",
        before: "다음 이벤트 시작 {time} 전에 게시합니다.",
        after: "이전 이벤트 종료 {time} 후에 게시합니다.",
        monthly: "매월 {day}일 {time}"
      },
      helpers: {
      },
      offsetProse: "다음 이벤트 시작 7일 전에 게시합니다.",
      monthlyProse: "매월 1일 오후 6시",
      restoreButton: "복원",
      restoreSuccess: "이벤트 {count}개를 복원했습니다",
      restoreNone: "복원할 이벤트가 없습니다",
      restoreFailed: "이벤트 복원에 실패했습니다",
      restoreNoProfile: "템플릿이 선택되지 않았습니다",
      restorableCount: "삭제된 이벤트 {count}개를 복원할 수 있습니다"
    },
    created: "템플릿이 생성되었습니다.",
    updated: "템플릿이 업데이트되었습니다.",
    deleted: "템플릿이 삭제되었습니다.",
    confirmDelete: "템플릿 \"{name}\"을(를) 삭제할까요?",
  },
  common: {
    syncing: "데이터 동기화 중...",
    ready: "준비됨",
    error: "오류",
    offline: "오프라인",
    online: "온라인",
    resync: "재동기화",
    update: "업데이트",
    updating: "업데이트 중",
    updateReady: "다시 시작",
    updateDownloading: "업데이트 다운로드 중...",
    save: "저장",
    cancel: "취소",
    enable: "활성화",
    loading: "불러오는 중...",
    refresh: "새로고침",
    edit: "편집",
    delete: "삭제",
    rateLimitError: "속도 제한. 잠시 기다렸다가 다시 시도하세요.",
    featuredEvent: "주목 이벤트",
    groupFairEvent: "그룹 페어에 포함",
    noMatches: "일치하는 항목이 없습니다.",
    noGroupsAccess: "캘린더 접근 권한이 있는 그룹이 없습니다",
    selectGroupPlaceholder: "그룹을 선택하세요",
    accessTypes: {
      public: "공개",
      group: "그룹"
    },
    durationUnits: {
      day: "일",
      hour: "시간",
      minute: "분"
    },
    weekdays: {
      monday: "월요일",
      tuesday: "화요일",
      wednesday: "수요일",
      thursday: "목요일",
      friday: "금요일",
      saturday: "토요일",
      sunday: "일요일"
    },
    months: {
      january: "1월",
      february: "2월",
      march: "3월",
      april: "4월",
      may: "5월",
      june: "6월",
      july: "7월",
      august: "8월",
      september: "9월",
      october: "10월",
      november: "11월",
      december: "12월"
    },
    fields: {
      eventName: "이벤트 이름",
      description: "설명",
      category: "카테고리",
      tags: "태그 (최대 5개)",
      accessType: "접근 유형",
      imageId: "이미지 ID (선택사항)",
      imageIdPlaceholder: "예: file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "알림 보내기",
      timezone: "시간대",
      duration: "기간 (DD:HH:MM)",
      languages: "언어 (최대 3개)",
      languagesHint: "{count}개 선택됨",
      filterLanguages: "언어 검색...",
      platforms: "플랫폼",
    },
    errors: {
      durationError: "지속 시간은 양수여야 합니다.",
      maxLanguages: "최대 3개 언어까지 선택할 수 있습니다.",
      noGroup: "그룹을 선택하세요.",
      requiredMultiple: "{fields}은(는) 필수입니다.",
      requiredSingle: "{field}은(는) 필수입니다."
    },
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    labels: {
      group: "그룹",
      schedule: "일정",
      series: "시리즈",
      templates: "템플릿"
    },
    section: {
      scheduleSelection: "일정 선택"
    },
    selectTemplate: "템플릿 선택"
  },
  wizard: {
    back: "뒤로",
    next: "다음"
  },
  conflict: {
    title: "이벤트 충돌",
    message: "이벤트 \"{title}\"이(가) 이미 이 시간에 예정되어 있습니다.",
    changeTime: "시간 다시 선택",
    continue: "그대로 생성"
  },
  schedules: {
    announcements: {
      hint: "이 템플릿이 이벤트를 게시할 때 수행할 작업을 전환합니다.",
      hintSeries: "이 시리즈가 생성되거나 수정될 때 수행할 작업을 전환합니다.",
      title: "알림"
    },
    empty: {
      all: "이 그룹에 일정이 없습니다.",
      series: "이 그룹에 시리즈가 없습니다.",
      templates: "이 그룹에 템플릿이 없습니다."
    },
    filter: {
      all: "전체",
      label: "표시"
    },
    info: {
      series: {
        bullet1: "VRChat가 반복 규칙에 따라 모든 회차를 서버에서 미리 생성합니다.",
        bullet2: "설정 후엔 손이 갈 일이 없습니다 — 생성 후 앱은 필요하지 않습니다.",
        bullet3: "제한 사항: 이벤트별 알림 불가. 반복 규칙을 변경하면 모든 회차가 재생성되며 수정 사항은 사라집니다.",
        bullet4: "알림이 필요 없는 안정적인 반복 이벤트에 적합합니다.",
        title: "시리즈"
      },
      template: {
        bullet1: "각 이벤트는 독립된 캘린더 항목으로 게시되며 회차별로 수정할 수 있습니다.",
        bullet2: "각 이벤트를 Discord 예정 이벤트, Webhook, .ics 캘린더 초대로 선택적으로 알릴 수 있습니다.",
        bullet3: "자동화 및 패턴 기반 일정과 결합하여 방치형 게시가 가능합니다.",
        bullet4: "자동 게시는 앱이 실행 중이어야 합니다.",
        title: "템플릿"
      }
    },
    modeBlurb: {
      moreInfo: "(자세히)",
      series: "시리즈는 VRChat 네이티브 반복 일정 도구입니다. 서버에서 모든 회차를 미리 생성합니다. 알림은 없습니다.",
      template: "템플릿은 반복 이벤트를 자동으로 채우고 각 회차를 개별적으로 게시합니다(알림은 선택 사항)."
    },
    saveButton: {
      seriesCreate: "시리즈 만들기",
      template: "템플릿 저장"
    },
    subtitle: "알림 기반 일정용 템플릿과 VRChat 네이티브 반복 시리즈입니다.",
    types: {
      templateButton: "템플릿"
    }
  },
  series: {
    confirmDelete: "「{label}」을(를) 삭제하시겠습니까? 시리즈와 모든 회차가 VRChat에서 제거됩니다.",
    confirmDeleteTitle: "시리즈를 삭제하시겠습니까?",
    created: "시리즈 「{label}」을(를) 만들었습니다.",
    days: {
      fr: "금",
      mo: "월",
      sa: "토",
      su: "일",
      th: "목",
      tu: "화",
      we: "수"
    },
    deleted: "시리즈 「{label}」을(를) 삭제했습니다.",
    disclaimer: "시리즈는 첫 회차가 시작되기 전에만 일정을 변경할 수 있습니다. 시작된 후에는 날짜나 시간을 바꾸려면 삭제해야 합니다. 이벤트는 최대 1년 전까지 예약할 수 있습니다. 한 이벤트의 최대 길이는 31일입니다.",
    end: {
      afterDateLabel: "특정 날짜에",
      afterOccurrencesLabel: "N회 후",
      never: "없음",
      occurrencesLabel: "회"
    },
    errors: {
      createFailed: "시리즈를 만들 수 없습니다.",
      deleteFailed: "시리즈를 삭제할 수 없습니다.",
      noDaysOfWeek: "최소 한 요일을 선택하세요.",
      noEndDate: "종료일을 설정하세요.",
      noLabel: "시리즈 레이블은 필수입니다.",
      noSeries: "선택된 시리즈가 없습니다.",
      noStartDate: "첫 회차의 날짜와 시간은 필수입니다.",
      noTitle: "이벤트 이름은 필수입니다.",
      notFound: "시리즈를 찾을 수 없습니다.",
      regenFailed: "시리즈를 재생성할 수 없습니다.",
      startInPast: "첫 회차는 미래여야 합니다. 저장하기 전에 날짜를 업데이트하세요.",
      updateFailed: "시리즈를 업데이트할 수 없습니다."
    },
    frequency: {
      custom: "사용자 지정",
      daily: "매일",
      monthly: "매월",
      weekdays: "평일",
      weekends: "주말",
      weekly: "매주",
      yearly: "매년"
    },
    labels: {
      daysOfWeek: "반복 요일",
      endCondition: "종료",
      frequency: "빈도",
      interval: "반복 간격",
      startDate: "첫 회차 날짜",
      startTime: "시작 시간"
    },
    lockedHint: "이 시리즈는 이미 시작되었습니다. 날짜, 시간, 반복 규칙은 잠겨 있지만 종료 시점은 여전히 조정할 수 있습니다. 일정을 변경하려면 잠금 해제를 클릭하세요 — 저장하면 이 시리즈가 새 시리즈로 교체됩니다.",
    rasterize: {
      retryIn: "{wait} 후에 다시 시도합니다.",
      retryNow: "지금 다시 시도",
      statusText: "{count}개의 이벤트가 생성 대기 중입니다.{wait}"
    },
    regen: {
      choiceMessage: "이 시리즈에는 {count}개의 수정된 이벤트가 있습니다. 현재 시리즈가 새 시리즈로 교체됩니다.\n\n• 수정 유지: 같은 날 겹치는 항목은 새 시리즈에 반영되고, 겹치지 않는 항목은 단독 이벤트가 됩니다.\n• 수정 폐기: 해당 회차의 변경 사항이 사라집니다.",
      choiceTitle: "시리즈를 교체하시겠습니까?",
      confirmAction: "시리즈 교체",
      confirmMessage: "현재 시리즈가 새 시리즈로 교체됩니다. 계속하시겠습니까?",
      discard: "수정 폐기",
      keep: "수정 유지",
      success: "시리즈 「{label}」을(를) 교체했습니다.",
      successWithMods: "시리즈 「{label}」을(를) 교체했습니다. {count}건의 수정이 대기 중입니다."
    },
    regenWarning: "반복 규칙이 잠금 해제되었습니다. 반복 규칙을 변경하면 현재 시리즈가 새 시리즈로 교체됩니다.",
    regenWarningWithMods: "반복 규칙이 잠금 해제되었습니다. 반복 규칙을 변경하면 현재 시리즈가 새 시리즈로 교체되며 수정된 {count}개 이벤트를 어떻게 처리할지 묻습니다.",
    unit: {
      days: "일",
      months: "개월",
      weeks: "주",
      years: "년"
    },
    unlockButton: "잠금 해제",
    updateRequired: "업데이트가 있습니다. 시리즈를 변경하기 전에 업데이트하세요.",
    updated: "시리즈 「{label}」을(를) 업데이트했습니다.",
    warnings: {
      confirmUpdate: "시리즈 업데이트"
    }
  }
};