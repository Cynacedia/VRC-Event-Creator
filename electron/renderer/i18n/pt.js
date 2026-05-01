// Portuguese translations for VRChat Event Creator

export const pt = {
  nav: {
    create: "Criar Evento",
    modify: "Modificar eventos",
    settings: "Configurações",
    schedules: "Gerenciar agendas"
  },
  auth: {
    title: "Acesso",
    subtitle: "Credenciais VRChat necessárias",
    username: "Nome de usuário",
    password: "Senha",
    signIn: "Entrar",
    logout: "Sair",
    sessionHint: "A sessão é armazenada em cache localmente. Mantenha seu arquivo de cache privado.",
    loggingIn: "Entrando...",
    loginFailed: "Falha ao entrar.",
    sessionChecking: "Verificando sessão...",
    loginRequired: "Login necessário.",
    loggedInAs: "Conectado como {name}.",
    loggedOut: "Desconectado."
  },
  twoFactor: {
    title: "Código de dois fatores",
    subtitle: "Digite seu código de autenticação",
    codeLabel: "Código",
    submit: "Enviar"
  },
  languageSetup: {
    title: "Escolher idioma",
    subtitle: "Selecione seu idioma para começar.",
    hint: "Você pode mudar isso a qualquer momento nas configurações.",
    continue: "Continuar"
  },
  gallery: {
    title: "Galeria",
    subtitle: "Selecione uma imagem da galeria para usar seu ID de arquivo.",
    empty: "Nenhuma imagem da galeria encontrada.",
    loading: "Carregando galeria...",
    useButton: "Usar ID da imagem",
    chooseButton: "Selecionar",
    uploadButton: "Enviar",
    uploadSuccess: "Imagem da galeria enviada.",
    uploadFailed: "Não foi possível enviar a imagem.",
    uploadLimitReached: "A galeria está cheia (64 imagens). Apague uma para enviar.",
    uploadTypeError: "Apenas imagens PNG ou JPG são compatíveis.",
    uploadSizeError: "A imagem deve ter menos de 10 MB.",
    uploadMinDimensions: "A imagem deve ser maior que 64x64.",
    uploadMaxDimensions: "A imagem deve ser menor que 2048x2048.",
    loadMore: "Carregar mais",
    loadFailed: "Não foi possível carregar a galeria."
  },
  settings: {
    theme: {
      title: "Tema",
      description: "Personalize a aparência do app. Selecione um preset ou ajuste manualmente.",
      presetLabel: "Tema atual",
      nameLabel: "Nome do tema",
      namePlaceholder: "Novo nome do tema",
      saveButton: "Salvar tema",
      deleteButton: "Excluir tema",
      resetButton: "Redefinir para padrão",
      savedLabel: "Temas salvos",
      customGroupLabel: "Personalizado",
      customUnsaved: "Personalizado (não salvo)",
      importButton: "Importar tema",
      exportButton: "Exportar tema",
      openStudio: "Abrir Estúdio de Tema",
      studio: {
        title: "Estúdio de Tema",
        subtitle: "Visualize e ajuste a aparência do app. Suporta #RRGGBBAA para transparências personalizadas.",
        header: "Cabeçalho",
        statusLabels: "Status e rótulos",
        accent: "Destaque",
        panel: "Painel",
        mutedText: "Texto atenuado",
        primary: "Primário",
        ghost: "Fantasma",
        inputField: "Campo de entrada",
        dropdown: "Menu suspenso",
        dropdownOptionA: "Opção A do menu",
        dropdownOptionB: "Opção B do menu",
        dropdownOptionC: "Opção C do menu",
        dropdownOptionD: "Opção D do menu",
        previewLink: "Link de prévia",
        toastPreview: "Prévia de toast usa Painel Alt",
        previewHint: "A prévia atualiza ao vivo conforme você ajusta as cores."
      },
      fields: {
        accent: "Destaque",
        bg: "Fundo 1",
        bgDeep: "Fundo 2",
        backdrop: "Fundo 3",
        panel: "Painel",
        panelAlt: "Painel Alt",
        headerBg: "Cabeçalho",
        overlay: "Sobreposição",
        text: "Texto",
        textMuted: "Texto atenuado",
        link: "Ligação",
        linkHover: "Link ao passar o mouse",
        button: "Botão 1",
        button2: "Botão 2",
        buttonText: "Texto do botão",
        border: "Borda",
        shadow: "Sombra",
        inputBg: "Fundo do campo",
        inputBgStrong: "Fundo do campo 2",
        inputText: "Texto do campo",
        selectOptionBg: "Opção selecionável",
        selectOptionHighlight: "Destaque da seleção",
        backdropOverlay: "Brilho do fundo",
        backdropGrid: "Grade do fundo",
        scanline: "Linha de varredura"
      }
    },
    appInfo: {
      title: "Informações do aplicativo",
      language: "Idioma",
      version: "Versão do app",
      dataFolder: "Pasta de dados atual",
      changeButton: "Alterar",
      openButton: "Abrir",
      session: "Sessão",
      githubLabel: "Repositório GitHub:",
      disclaimerLabel: "Aviso:",
      disclaimerText: "Este aplicativo é não oficial e não é afiliado à VRChat. Use por sua conta e risco. Os desenvolvedores não são responsáveis por problemas decorrentes do uso desta ferramenta."
    },
    general: {
      title: "Geral",
      minimizeToTray: "Minimizar para a bandeja do sistema",
      startOnStartup: "Iniciar com o sistema",
      enableAdvanced: "Ativar configurações avançadas",
      enableImportExport: "Importar/Exportar Eventos",
      autoUploadImages: "Carregar automaticamente imagens da galeria de eventos/modelos importados"
    },
    discord: {
      enable: "Ativar integração com Discord",
      description: "Cria automaticamente eventos no Discord ao criar eventos do VRChat.",
      tokenLabel: "Token do bot",
      tokenPlaceholder: "Cole o token do bot",
      guildLabel: "ID do servidor",
      guildPlaceholder: "ex. 123456789012345678",
      testButton: "Verificar token",
      testSuccess: "Conectado como {botName}",
      testFailed: "Falha na conexão. Verifique o token do bot.",
      tokenMissing: "Insira um token de bot primeiro.",
      selectGroup: "Selecionar um grupo...",
      saveButton: "Salvar",
      saved: "Configurações do Discord salvas.",
      eventLabel: "Criar evento no Discord",
      syncSuccess: "Evento do Discord criado para \"{title}\"",
      syncFailed: "Sincronização com Discord falhou para \"{title}\": {error}"
    },
    webhook: {
      postLabel: "Publicar Webhook do Discord",
      enableLabel: "Ativar Webhook",
      syncSuccess: "Webhook enviado para \"{title}\"",
      syncFailed: "Falha na entrega do webhook para \"{title}\": {error}"
    },
    calendar: {
      enable: "Ativar geração de arquivos de calendário",
      createInvite: "Criar convite de calendário .ics",
      enableReminders: "Ativar lembretes de calendário .ics",
      addReminder: "Adicionar Lembrete",
      unit: {
        minutes: "minutos",
        hours: "horas",
        days: "dias"
      },
      webhookLabel: "Webhook URL",
      webhookPlaceholder: "https://discord.com/api/webhooks/...",
      webhookTestButton: "Testar Webhook",
      webhookTestSuccess: "Webhook verificado: {webhookName}",
      webhookTestFailed: "Teste do webhook falhou. Verifique a URL.",
      webhookMissing: "Insira uma URL de webhook primeiro.",
      remindersHint: "Alguns aplicativos de calendário podem usar apenas o primeiro lembrete.",
      saveDirLabel: "Diretório de salvamento do calendário",
      autoSaved: "Arquivo de calendário salvo: {filePath}",
      inviteTitle: "Convite de calendário"
    },
    eckit: {
      importButton: "Importar Kit",
      webhookName: "Nome do Webhook",
      webhookNamePlaceholder: "Eventos do Meu Grupo",
      embedColor: "Cor do Embed",
      avatarUrl: "URL do Avatar",
      avatarUrlPlaceholder: "https://example.com/avatar.png",
      attachMessage: "Anexar mensagem personalizada ao webhook",
      messageTitle: "Mensagem personalizada do webhook",
      messagePlaceholder: "Escreva uma mensagem personalizada para incluir com o webhook...",
      attachImage: "Anexar imagem",
      noImage: "Nenhuma imagem selecionada",
      selectImage: "Selecionar"
    },
    saveButton: "Salvar configurações",
    saved: "Configurações salvas.",
    featuredVerification: {
      permissionDenied: "Este grupo não tem permissão para criar eventos em destaque."
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
    title: "Minimizar para a bandeja do sistema?",
    message: "Você pode alterar isso mais tarde nas Configurações.",
    yes: "Sim",
    no: "Não"
  },
  categories: {
    hangout: "Encontro",
    exploration: "Exploração",
    roleplaying: "Interpretação",
    film: "Filme e mídia",
    gaming: "Jogos",
    music: "Música",
    dance: "Dança",
    performance: "Apresentação",
    arts: "Artes",
    avatars: "Avatares",
    education: "Educação",
    wellness: "Bem-estar",
    other: "Outros"
  },
  platforms: {
    pcWindows: "PC (Windows)",
    android: "Android (Quest, celular, etc)",
    ios: "iOS"
  },
  events: {
    steps: {
      group: "Grupo",
      date: "Data",
      details: "Detalhes",
      create: "Criar"
    },
    section: {
      groupProfile: "Grupo + Modelo",
      dateSelection: "Seleção de data",
      details: "Detalhes do evento",
      readyTitle: "Pronto para criar?",
      readyHint: "Revise suas seleções e crie o evento."
    },
    labels: {
      groupRequired: "Grupo (obrigatório)",
      profileOptional: "Modelo (opcional)",
      advanced: "Avançado",
      patternDates: "Datas do padrão",
      manualDate: "Data manual",
      manualTime: "Hora manual",
      dateSourceManual: "Manual",
      dateSource: "Usar",
      dateSourcePattern: "Padrão"
    },
    hints: {
      profileDefaults: "Escolha um modelo para padrões ou deixe em branco para criar manualmente.",
    },
    dateHints: {
      default: "O modo manual está pronto. Modelos com padrões liberam opções de data.",
      noProfile: "Nenhum modelo selecionado. Use data/hora manual.",
      manualReady: "Modo manual pronto.",
      chooseGenerated: "Escolha uma data gerada ou use manual.",
      noUpcoming: "Nenhuma data futura encontrada.",
      loadFailed: "Não foi possível carregar datas do padrão."
    },
    profileHint: "Modelos são opcionais. Use um para padrões ou crie tudo manualmente.",
    loadProfile: "Carregar modelo (opcional)",
    clearProfile: "Limpar modelo",
    importSuccess: "Dados do evento importados do JSON.",
    importWrongType: "Isto parece ser um JSON de modelo. Use Importar modelo em vez disso.",
    exportSuccess: "Dados do evento exportados para JSON.",
    dateOption: "Selecionar data",
    patternDateLabel: "{label} - {date}",
    roleRestrictions: {
      title: "Restrições de cargos",
      hint: "Opcional - Se ativado, apenas os cargos de grupo selecionados podem participar.",
      optional: "Para moderadores de instância, todos os cargos no nível ou acima do cargo de moderador mais baixo selecionado podem participar.",
      allAccess: "Nenhum (Todos podem participar)",
      managementRoles: "Cargos de gestão",
      roles: "Cargos",
      noRoles: "Nenhum cargo disponível para este grupo."
    },
    manualProfileOption: "Manual (sem modelo)",
    pastDateError: "Não é possível selecionar uma data passada.",
    futureDateError: "Os eventos só podem ser agendados com até 1 ano de antecedência.",
    upcomingLimitNotice: "O VRChat atualmente limita cada grupo a 10 eventos futuros.",
    upcomingCountGroupFallback: "Este grupo",
    upcomingCountStatus: "Eventos futuros para {group}: {count}/{limit}.",
    upcomingCountUnknown: "Contagem de eventos futuros indisponível.",
    upcomingCountToast: "{group} agora tem {count}/{limit} eventos futuros.",
    upcomingLimitReached: "Limite atingido: {group} já tem {limit} eventos futuros. Remova ou reagende um.",
    upcomingLimitError: "Limite atingido: {group} já tem {limit} eventos futuros. Remova ou reagende um.",
    crossPlatformRateLimit: "Limite de taxa. Eventos não rastreados criados em outra plataforma podem contar para o seu limite. Tente novamente em {minutes} minutos.",
    unknownRateLimit: "Limite de taxa. Tente novamente mais tarde.",
    upcomingCountRefresh: "Atualizar",
    createButton: "Criar evento",
    create: {
      warnConflicts: "Avisar sobre eventos conflitantes",
      alreadyCreating: "Já está criando um evento, aguarde..."
    },
    created: "Evento criado.",
    failed: "Não foi possível criar o evento.",
    selectDateError: "Selecione uma data.",
    updateRequired: "Atualização disponível. Atualize antes de criar eventos.",
    featuredPermissionRevoked: "Este grupo não tem mais permissão para criar eventos em destaque.",
    groupFairPermissionRevoked: "Este grupo não tem mais permissão para incluir eventos na Feira de Grupos."
  },
  modify: {
    subtitle: "Editar ou excluir eventos futuros do grupo.",
    countEmpty: "Eventos futuros indisponíveis.",
    countGroupFallback: "Este grupo",
    countStatus: "Eventos futuros para {group}: {count}.",
    empty: "Nenhum evento futuro.",
    dateUnknown: "Data indisponível",
    eventImage: "Imagem do evento",
    noImage: "Sem imagem",
    untitled: "Evento sem título",
    profileLoad: "Carregar",
    profileSelectError: "Selecione um modelo para carregar.",
    profileLoadFailed: "Não foi possível carregar os padrões do modelo.",
    profileLoaded: "Padrões do modelo carregados.",
    manualDate: "Alterar data",
    manualTime: "Alterar hora",
    modal: {
      title: "Editar evento",
      subtitle: "As alterações só são aplicadas quando você pressiona Salvar."
    },
    updateRequired: "Atualização disponível. Atualize antes de modificar eventos.",
    selectEventError: "Selecione um evento para editar.",
    selectDateError: "Selecione data e hora.",
    saveFailed: "Não foi possível atualizar o evento.",
    saved: "Evento atualizado.",
    deleteFailed: "Não foi possível excluir o evento.",
    deleted: "Evento excluído.",
    loadFailed: "Não foi possível carregar os eventos.",
    missedAutomationNoticeSingular: "1 evento não pôde ser publicado no seu horário automatizado programado.",
    missedAutomationNoticePlural: "{count} eventos não puderam ser publicados nos seus horários automatizados programados.",
    queuedAutomationNoticeSingular: "Limite de Taxa: 1 evento pendente está na fila, aguardando a liberação dos limites de taxa.",
    queuedAutomationNoticePlural: "Limite de Taxa: {count} eventos pendentes estão na fila, aguardando a liberação dos limites de taxa.",
    pending: {
      postNow: "Publicar agora",
      edit: "Editar",
      cancel: "Cancelar",
      publishAt: "Publicação em: {time}",
      missedHint: "Esta automação foi perdida. Publique agora ou exclua.",
      queuedDisabled: "Queued by rate limits. Post Now is disabled.",
      queuedHint: "Queued by rate limits. Waiting to publish.",
      posted: "Evento publicado com sucesso.",
      postFailed: "Não foi possível publicar o evento.",
      cancelled: "Evento pendente cancelado.",
      cancelFailed: "Não foi possível cancelar o evento pendente.",
      editSaved: "Evento pendente atualizado.",
      editFailed: "Não foi possível atualizar o evento pendente."
    },
    postingOptions: "Opções de publicação",
    badge: {
      modified: "Modificado"
    },
    filters: {
      heading: "Mostrar",
      modified: "Ocorrências modificadas",
      pending: "Eventos pendentes",
      standalone: "Eventos independentes"
    },
    filtersButton: "Filtros",
    timeRange: {
      "1month": "1 mês",
      "1week": "1 semana",
      "1year": "1 ano",
      "2weeks": "2 semanas",
      "3months": "3 meses",
      "6months": "6 meses",
      label: "Intervalo de tempo"
    }
  },
  profiles: {
    steps: {
      select: "Selecionar",
      basics: "Básico",
      schedule: "Agenda",
      audience: "Público"
    },
    section: {
      basics: "Básico do modelo",
      audience: "Público"
    },
    labels: {
    },
    buttons: {
      new: "Novo"
    },
    importSuccess: "Dados do modelo importados do JSON.",
    importWrongType: "Isto parece ser um JSON de evento. Use Importar evento em vez disso.",
    exportSuccess: "Dados do modelo exportados para JSON.",
    hints: {
      groupAccess: "Escolha um grupo com acesso ao calendário.",
      patternsInfo: "Padrões são usados para pré-gerar datas futuras."
    },
    existingProfilePlaceholder: "Selecione um modelo",
    displayName: "Nome do modelo",
    displayNamePlaceholder: "Modelo de encontro da comunidade",
    durationDefault: "Duração padrão (DD:HH:MM)",
    dateMode: "Modo de data",
    dateModePattern: "Baseado em padrão",
    dateModeManual: "Somente manual",
    dateModeBoth: "Padrões + manual",
    sendNotificationDefault: "Enviar notificação por padrão",
    patterns: {
      addButton: "Adicionar padrão",
      clearButton: "Limpar padrões",
      noPatterns: "Nenhum padrão ainda.",
      removeButton: "Remover",
      patternType: "Tipo de padrão",
      weekday: "Dia da semana",
      time: "Horário",
      confirmClear: "Limpar todos os padrões?",
      selectAll: "Selecione tipo de padrão, dia e horário.",
      selectPattern: "Selecione um padrão",
      selectWeekday: "Selecione um dia da semana",
      types: {
        every: "Toda [weekday]",
        everyOther: "A cada duas semanas [weekday]",
        nth1: "Todo 1º [weekday] do mês",
        nth2: "Todo 2º [weekday] do mês",
        nth3: "Todo 3º [weekday] do mês",
        nth4: "Todo 4º [weekday] do mês",
        last: "Todo último [weekday] do mês",
        annual: "Todo ano em [data]"
      },
      format: {
        every: "Toda {weekday} às {time}",
        everyOther: "A cada duas semanas {weekday} às {time}",
        last: "Última {weekday} às {time}",
        nth: "{ordinal} {weekday} às {time}",
        annual: "Todo ano em {month} {day} às {time}"
      },
      ordinal1: "1º",
      ordinal2: "2º",
      ordinal3: "3º",
      ordinal4: "4º",
      date: "Data",
      selectMonth: "Selecionar mês"
    },
    automation: {
      title: "Automação (Experimental)",
      description: "Publicar eventos automaticamente com base em seus padrões. Os eventos aparecerão como \"Pendentes\" em Modificar Eventos.",
      enableLabel: "Ativar automação",
      timingLabel: "Regra de agendamento",
      frequencyLabel: "Temporização (DD:HH:MM)",
      timingModes: {
        before: "Antes do início do evento",
        after: "Após o término do evento anterior",
        monthly: "Mensalmente em dia específico"
      },
      monthlyDay: "Dia do mês",
      monthlyTime: "Hora",
      repeatMode: "Repetir",
      repeatModes: {
        indefinite: "Indefinidamente",
        count: "Contagem fixa"
      },
      repeatCount: "Eventos a criar",
      patternsRequired: "Pelo menos um padrão é necessário para automação",
      confirmTitle: "Ativar automação?",
      confirmEnable: "A automação requer que o aplicativo esteja em execução para publicar eventos. Automações perdidas podem ser gerenciadas na aba Modificar Eventos.",
      offsetCorrected: "O deslocamento ({oldOffset} dias) excedeu a frequência do padrão ({frequency} dias). Alterado para o modo \"antes\" com deslocamento de {newOffset} dias.",
      offsetCapped: "O deslocamento ({oldOffset} dias) excedeu a frequência do padrão. Limitado a {newOffset} dias.",
      prose: {
        day: "1 dia",
        days: "{count} dias",
        hour: "1 hora",
        hours: "{count} horas",
        minute: "1 minuto",
        minutes: "{count} minutos",
        and: "e",
        noTime: "—",
        before: "Publicar o próximo evento {time} antes de começar.",
        after: "Publicar o próximo evento {time} após o término do evento anterior.",
        monthly: "O {day}º de cada mês às {time}"
      },
      helpers: {
      },
      offsetProse: "Publicar o próximo evento 7 dias antes de começar.",
      monthlyProse: "O 1º de cada mês às 6:00 PM",
      restoreButton: "Restaurar",
      restoreSuccess: "Foram restaurados {count} evento(s)",
      restoreNone: "Nenhum evento para restaurar",
      restoreFailed: "Falha ao restaurar eventos",
      restoreNoProfile: "Nenhum modelo selecionado",
      restorableCount: "{count} evento(s) excluído(s) podem ser restaurados"
    },
    created: "Modelo criado.",
    updated: "Modelo atualizado.",
    deleted: "Modelo excluído.",
    confirmDelete: "Excluir modelo \"{name}\"?",
  },
  common: {
    syncing: "Sincronizando dados...",
    ready: "Pronto",
    error: "Erro",
    offline: "Offline",
    online: "Online",
    resync: "Ressincronizar",
    update: "Atualizar",
    updating: "Atualizando",
    updateReady: "Reiniciar",
    updateDownloading: "Baixando atualização...",
    save: "Salvar",
    cancel: "Cancelar",
    enable: "Ativar",
    loading: "Carregando...",
    refresh: "Atualizar",
    edit: "Editar",
    delete: "Excluir",
    rateLimitError: "Limite de taxa. Aguarde e tente novamente mais tarde.",
    featuredEvent: "Evento em destaque",
    groupFairEvent: "Incluir na Feira de Grupos",
    noMatches: "Nenhuma correspondência.",
    noGroupsAccess: "Nenhum grupo com acesso ao calendário",
    selectGroupPlaceholder: "Escolher um grupo",
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
      monday: "Segunda-feira",
      tuesday: "Terça-feira",
      wednesday: "Quarta-feira",
      thursday: "Quinta-feira",
      friday: "Sexta-feira",
      saturday: "Sábado",
      sunday: "Domingo"
    },
    months: {
      january: "Janeiro",
      february: "Fevereiro",
      march: "Março",
      april: "Abril",
      may: "Maio",
      june: "Junho",
      july: "Julho",
      august: "Agosto",
      september: "Setembro",
      october: "Outubro",
      november: "Novembro",
      december: "Dezembro"
    },
    fields: {
      eventName: "Nome do evento",
      description: "Descrição",
      category: "Categoria",
      tags: "Tags (máx. 5)",
      accessType: "Tipo de acesso",
      imageId: "ID da imagem (opcional)",
      imageIdPlaceholder: "ex. file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      sendNotification: "Enviar notificação",
      timezone: "Fuso horário",
      duration: "Duração (DD:HH:MM)",
      languages: "Idiomas (máx. 3)",
      languagesHint: "{count} selecionados",
      filterLanguages: "Filtrar idiomas...",
      platforms: "Plataformas",
    },
    errors: {
      durationError: "A duração deve ser um número positivo.",
      maxLanguages: "No máximo 3 idiomas permitidos.",
      noGroup: "Selecione um grupo.",
      requiredMultiple: "{fields} são obrigatórios.",
      requiredSingle: "{field} é obrigatório."
    },
    exportJson: "Exportar JSON",
    importJson: "Importar JSON",
    labels: {
      group: "Grupo",
      schedule: "Agenda",
      series: "Série",
      templates: "Modelos"
    },
    section: {
      scheduleSelection: "Seleção de agenda"
    },
    selectTemplate: "Selecione um modelo"
  },
  wizard: {
    back: "Voltar",
    next: "Próximo"
  },
  conflict: {
    title: "Conflito de evento",
    message: "Um evento \"{title}\" já está agendado neste horário.",
    changeTime: "Selecionar horário novamente",
    continue: "Criar mesmo assim"
  },
  schedules: {
    announcements: {
      hint: "Alterne as ações a executar quando este modelo publicar um evento.",
      hintSeries: "Alterne as ações a executar quando esta série for criada ou modificada.",
      title: "Anúncios"
    },
    empty: {
      all: "Sem agendas para este grupo.",
      series: "Sem séries para este grupo.",
      templates: "Sem modelos para este grupo."
    },
    filter: {
      all: "Tudo",
      label: "Mostrar"
    },
    info: {
      series: {
        bullet1: "O VRChat pré-gera todas as ocorrências no servidor a partir de uma regra de recorrência.",
        bullet2: "Configure e esqueça — nenhum aplicativo é necessário após a criação.",
        bullet3: "Limitações: sem anúncios por evento; a regra de recorrência não pode ser alterada sem regenerar todas as ocorrências (modificações se perdem).",
        bullet4: "Ideal para eventos estáveis e repetitivos que não precisam de anúncios.",
        title: "Séries"
      },
      template: {
        bullet1: "Cada evento é publicado como uma entrada de calendário independente — modificável por ocorrência.",
        bullet2: "Anuncie opcionalmente cada evento via eventos agendados do Discord, webhooks e convites de calendário .ics.",
        bullet3: "Combine com a automação e o agendamento por padrões para publicação sem intervenção.",
        bullet4: "Requer que o aplicativo esteja em execução para publicação automática.",
        title: "Modelos"
      }
    },
    modeBlurb: {
      moreInfo: "(mais informações)",
      series: "Uma série é o agendador recorrente nativo do VRChat. O servidor pré-gera todas as ocorrências. Sem anúncios.",
      template: "Os modelos preenchem automaticamente eventos repetidos e publicam cada ocorrência individualmente, com anúncios opcionais."
    },
    saveButton: {
      seriesCreate: "Criar série",
      template: "Salvar modelo"
    },
    subtitle: "Modelos para agendamento com anúncios e séries recorrentes nativas do VRChat.",
    types: {
      templateButton: "Modelo"
    }
  },
  series: {
    confirmDelete: "Excluir \"{label}\"? Isso removerá a série e todas as suas ocorrências do VRChat.",
    confirmDeleteTitle: "Excluir série?",
    created: "Série \"{label}\" criada.",
    days: {
      fr: "Sex",
      mo: "Seg",
      sa: "Sáb",
      su: "Dom",
      th: "Qui",
      tu: "Ter",
      we: "Qua"
    },
    deleted: "Série \"{label}\" excluída.",
    disclaimer: "Uma série só pode ser reagendada antes do início da primeira ocorrência. Depois de iniciada, é preciso excluí-la para alterar data ou horário. Eventos podem ser agendados com até um ano de antecedência. A duração máxima de um evento é de 31 dias.",
    end: {
      afterDateLabel: "Em uma data específica",
      afterOccurrencesLabel: "Após N ocorrências",
      never: "Nunca",
      occurrencesLabel: "ocorrências"
    },
    errors: {
      createFailed: "Não foi possível criar a série.",
      deleteFailed: "Não foi possível excluir a série.",
      noDaysOfWeek: "Selecione pelo menos um dia da semana.",
      noEndDate: "Defina uma data de término.",
      noLabel: "O rótulo da série é obrigatório.",
      noSeries: "Nenhuma série selecionada.",
      noStartDate: "Data e horário da primeira ocorrência são obrigatórios.",
      noTitle: "O nome do evento é obrigatório.",
      notFound: "Série não encontrada.",
      regenFailed: "Não foi possível regenerar a série.",
      startInPast: "A primeira ocorrência deve estar no futuro. Atualize a data antes de salvar.",
      updateFailed: "Não foi possível atualizar a série."
    },
    frequency: {
      custom: "Personalizado",
      daily: "Diariamente",
      monthly: "Mensalmente",
      weekdays: "Dias úteis",
      weekends: "Fins de semana",
      weekly: "Semanalmente",
      yearly: "Anualmente"
    },
    labels: {
      daysOfWeek: "Repete em",
      endCondition: "Termina",
      frequency: "Frequência",
      interval: "Repetir a cada",
      startDate: "Data da primeira ocorrência",
      startTime: "Horário de início"
    },
    lockedHint: "Esta série já começou. Data, horário e regra de repetição estão bloqueados — mas ainda é possível ajustar quando termina. Para reagendar, clique em Desbloquear — ao salvar esta série será substituída por uma nova.",
    rasterize: {
      retryIn: "Próxima tentativa em {wait}.",
      retryNow: "Tentar agora",
      statusText: "{count} evento(s) aguardando criação.{wait}"
    },
    regen: {
      choiceMessage: "Esta série tem {count} evento(s) modificado(s). A série atual será substituída por uma nova.\n\n• Manter modificações: sobreposições no mesmo dia atualizam a nova série; eventos sem sobreposição se tornam independentes.\n• Descartar modificações: alterações nessas ocorrências são perdidas.",
      choiceTitle: "Substituir série?",
      confirmAction: "Substituir série",
      confirmMessage: "Isso substituirá a série atual por uma nova. Continuar?",
      discard: "Descartar modificações",
      keep: "Manter modificações",
      success: "Série \"{label}\" substituída.",
      successWithMods: "Série \"{label}\" substituída. {count} modificação(ões) na fila."
    },
    regenWarning: "A recorrência está desbloqueada. Se você alterar a recorrência, a série atual será substituída por uma nova.",
    regenWarningWithMods: "A recorrência está desbloqueada. Se você alterar a recorrência, a série atual será substituída por uma nova e será perguntado como lidar com seus {count} eventos modificados.",
    unit: {
      days: "dias",
      months: "meses",
      weeks: "semanas",
      years: "anos"
    },
    unlockButton: "Desbloquear",
    updateRequired: "Atualização disponível. Atualize antes de modificar séries.",
    updated: "Série \"{label}\" atualizada.",
    warnings: {
      confirmUpdate: "Atualizar série"
    }
  }
};