# Guia de configuração da integração de calendário

Este guia orienta você na configuração da geração de arquivos de calendário (.ics) e do envio por webhook do Discord para o VRC Event Creator. Após a configuração, ao criar um evento no VRChat, um arquivo de convite de calendário pode ser gerado automaticamente e, opcionalmente, publicado em um canal do Discord.

---

## Visão geral

A integração de calendário cria arquivos `.ics` padrão que podem ser importados no Outlook, Apple Calendar, Google Calendar e outros aplicativos de calendário. Esses arquivos incluem os detalhes do evento e lembretes opcionais.

Existem dois métodos de entrega (mutuamente exclusivos por evento):

- **Webhook do Discord** — Publica o arquivo `.ics` em um canal do Discord com um embed do evento ou link para o evento do Discord
- **Salvamento automático** — Salva o arquivo `.ics` em um diretório local automaticamente

Se um webhook do Discord estiver configurado e o evento estiver definido para ser publicado no Discord, o webhook é utilizado. Caso contrário, os arquivos são salvos no diretório local configurado.

---

## Etapa 1: Ativar a geração de arquivos de calendário

1. Abra **Configurações** > **Geral**
2. Marque **"Ativar geração de arquivos de calendário"**

Isso torna as opções de calendário disponíveis nos modelos e na criação de eventos.

## Etapa 2: Configurar o método de entrega

### Opção A: Webhook do Discord (recomendado)

Um webhook publica o arquivo de calendário em um canal específico do Discord. Nenhum bot é necessário para o webhook em si.

1. No Discord, clique com o botão direito no canal onde deseja que os arquivos de calendário sejam publicados
2. Clique em **Editar canal** > **Integrações** > **Webhooks** > **Novo webhook**
3. Copie a URL do webhook
4. No VRC Event Creator, vá em **Configurações** > **Integração com Discord** > selecione seu grupo
5. Marque **"Publicar .ics no Discord"** e cole a URL do webhook
6. Clique em **"Testar Webhook"** para verificar, depois em **"Salvar"**

Se você também tiver a criação de eventos do Discord configurada (token de bot), o webhook publicará um link para o evento do Discord em vez de um embed independente. O arquivo `.ics` é anexado em ambos os casos.

### Opção B: Salvamento automático em diretório local

Quando nenhum webhook está configurado, os arquivos `.ics` são salvos automaticamente em um diretório local. O local padrão é `Documents/VRC Event Creator .ics/` e é criado no primeiro salvamento.

Os arquivos são salvos como `{diretório}/{Nome do grupo}/{Nome do evento - Data}.ics`. Para alterar o local, use o botão **Alterar** ao lado de **Diretório de salvamento do calendário** em **Configurações** > **Informações do aplicativo**.

---

## Etapa 3: Configurar modelos

1. Vá em **Gerenciar Modelos** e edite (ou crie) um modelo
2. Na aba **Básico**, marque **"Criar convite de calendário .ics"**
3. Na aba **Agenda**, um novo cartão **"Lembretes de calendário .ics"** aparecerá
4. Marque **"Ativar lembretes de calendário .ics"** e adicione seus intervalos de lembrete preferidos
5. Salve o modelo

Os lembretes usam intervalos predefinidos compatíveis com todos os principais aplicativos de calendário: 5 min, 10 min, 15 min, 30 min, 1 hora, 2 horas, 4 horas, 8 horas, 12 horas, 1 dia, 2 dias, 1 semana.

> **Nota:** Alguns aplicativos de calendário (como Outlook) usam apenas o primeiro lembrete. O lembrete mais longo é colocado primeiro para melhor compatibilidade. O Google Calendar ignora lembretes personalizados na importação e usa suas configurações de notificação padrão.

---

## Etapa 4: Criar eventos

Ao criar um evento (manualmente ou por automação):

- A etapa **Data** mostra um botão **"Criar convite de calendário .ics"** (herdado do modelo selecionado ou configurável manualmente)
- Abaixo, **"Ativar lembretes de calendário .ics"** permite personalizar lembretes por evento
- A etapa **Detalhes** mostra **"Publicar no Discord"**, que controla tanto o evento do Discord quanto o envio por webhook

Todas as configurações do modelo podem ser alteradas por evento.

---

## Como funciona em conjunto

| Eventos do Discord | Webhook | Calendário | O que acontece na criação do evento |
|---|---|---|---|
| Ativado + configurado | Configurado | Ativado | Evento do Discord criado, webhook publica link do evento + .ics |
| Desativado ou não configurado | Configurado | Ativado | Webhook publica embed com detalhes do evento + .ics |
| Qualquer | Não configurado | Ativado | Arquivo .ics salvo automaticamente no diretório local |

---

## Perguntas frequentes

### Quais aplicativos de calendário suportam arquivos .ics?

Todos os principais: Outlook, Apple Calendar, Google Calendar, Thunderbird e qualquer aplicativo compatível com o padrão iCalendar.

### Os lembretes funcionam em todos os aplicativos de calendário?

Múltiplos lembretes funcionam no Apple Calendar e no Thunderbird. O Outlook usa apenas o primeiro lembrete. O Google Calendar ignora lembretes na importação completamente.

### Posso usar webhooks sem a criação de eventos do Discord?

Sim. O webhook e o token de bot são funcionalidades independentes. Você pode usar webhooks para entrega de calendários sem configurar um bot do Discord.

### A URL do webhook é confidencial?

Sim — qualquer pessoa com a URL do webhook pode enviar mensagens para esse canal. Trate-a como uma senha. Ela é criptografada e armazenada localmente usando o armazenamento seguro do seu sistema operacional.

---

## Solução de problemas

| Problema | Solução |
|---|---|
| Nenhum arquivo .ics gerado | Verifique se "Ativar geração de arquivos de calendário" está ativado em Configurações > Geral, e se "Criar convite de calendário .ics" está marcado no modelo ou evento |
| Webhook não publica | Verifique a URL do webhook com "Testar Webhook" nas configurações do Discord. Confirme que "Publicar .ics no Discord" está ativado para o grupo |
| Lembretes não funcionam no Outlook | O Outlook suporta apenas o primeiro lembrete. O aplicativo ordena o mais longo primeiro para compatibilidade |
| Lembretes não funcionam no Google Calendar | O Google Calendar ignora lembretes personalizados na importação de .ics. Configure lembretes manualmente após a importação |
| Arquivos salvos no local errado | Os arquivos são salvos em `{diretório}/{Nome do grupo}/`. O padrão é `Documents/VRC Event Creator .ics/`. Pode ser alterado em Configurações > Informações do aplicativo |
