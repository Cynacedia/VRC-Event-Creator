# Guia de configuração da integração com o Discord

Este guia orienta você na configuração da integração com o Discord para o VRC Event Creator. Após a configuração, ao criar um evento no VRChat, um **evento no Discord** correspondente será criado automaticamente no seu servidor.

---

## Visão geral

A integração utiliza um **bot do Discord** que você mesmo cria e controla. Ele precisa de apenas uma permissão: **Criar eventos**. Ele não lê mensagens, não entra em canais de voz e não faz mais nada. O token do bot é criptografado e armazenado localmente — ele só é enviado para a API do Discord ao criar eventos.

Cada grupo do VRChat pode ser vinculado a um servidor do Discord. Você pode reutilizar o mesmo bot em vários grupos/servidores ou usar bots separados.

---

## Etapa 1: Criar um aplicativo no Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em **"New Application"** no canto superior direito
3. Dê um nome e clique em **Create**

## Etapa 2: Criar o bot

1. Clique em **"Bot"** na barra lateral esquerda
2. Clique em **"Reset Token"** (ou em **"Copy"** se o token ainda estiver visível)
3. **Copie o token imediatamente** — você não poderá vê-lo novamente
4. Mantenha os Privileged Gateway Intents desativados — o bot não precisa de nenhum

> **Mantenha o token do bot em sigilo.** Qualquer pessoa com o token pode agir como seu bot. Se você compartilhá-lo acidentalmente, redefina-o imediatamente no Developer Portal.

## Etapa 3: Convidar o bot para o seu servidor

1. Clique em **"OAuth2"** na barra lateral esquerda
2. Role até **"OAuth2 URL Generator"**
3. Em **Scopes**, marque **`bot`**
4. Em **Bot Permissions**, marque **`Create Events`**
5. Copie a URL gerada na parte inferior, abra-a no navegador, selecione seu servidor e autorize

O bot aparecerá na lista de membros, mas ficará offline — ele não precisa estar "em execução". O aplicativo se comunica diretamente com a API do Discord usando o token.

## Etapa 4: Obter o ID do seu servidor

1. No Discord, vá em **Configurações do usuário** > **Avançado** e ative o **Modo de desenvolvedor**
2. Clique com o botão direito no nome do servidor e selecione **"Copiar ID do servidor"**

## Etapa 5: Configurar no VRC Event Creator

1. Abra **Configurações** > **Opções avançadas** > marque **"Ativar integração com o Discord"**
2. Selecione o grupo do VRChat que deseja vincular, insira o token do bot e o ID do servidor e salve
3. Use **"Verificar token do bot"** para confirmar que o token funciona

Cada modelo de evento possui um botão **"Sincronizar com o Discord"** na aba Basics. Ele fica ativado por padrão quando a integração com o Discord está ativa. Você pode desativá-lo para eventos que não deseja publicar no Discord.

**A sincronização com o Discord nunca bloqueia a criação de eventos no VRChat.** Se algo der errado no lado do Discord, seu evento no VRChat será criado normalmente.

---

## Perguntas frequentes

### Posso usar um bot que já tenho?

Sim, desde que ele tenha a permissão **Criar eventos** no servidor de destino.

### E se várias pessoas da equipe criam eventos?

Cada pessoa que cria eventos precisa do token do bot em sua máquina. Opções:
- **Compartilhar o token** com membros de confiança
- **Designar uma pessoa para gerenciar a sincronização com o Discord** enquanto os outros desativam "Sincronizar com o Discord"
- **Criar bots separados** por membro da equipe

### Meu token de bot está seguro?

Seu token de bot é criptografado usando o armazenamento seguro do seu sistema operacional (Windows DPAPI / macOS Keychain / Linux Secret Service) e armazenado localmente. Ele só é enviado para a API do Discord.

### Posso excluir eventos do Discord pelo aplicativo?

Não, o aplicativo apenas os cria. Gerencie os eventos do Discord diretamente no Discord.

---

## Solução de problemas

| Problema | Solução |
|---|---|
| "Token de bot inválido" | Redefina o token no Developer Portal e cole o novo |
| "O bot não tem permissão para criar eventos" | Convide o bot novamente com a permissão Criar eventos, ou adicione-a em Configurações do servidor > Cargos |
| "Servidor do Discord não encontrado" | Verifique o ID do servidor (clique com o botão direito no servidor > Copiar ID do servidor) |
| "Limite de requisições do Discord atingido" | Aguarde um minuto e tente novamente |
| Eventos criados no VRChat, mas não no Discord | Verifique se "Sincronizar com o Discord" está ativado e se o grupo possui um token de bot + ID de servidor válidos |
