# Guia de configuração da integração de calendário

Este guia orienta você na configuração da geração de arquivos de calendário (.ics), publicação por webhook do Discord e eventos agendados do Discord no VRC Event Creator. Essas três funcionalidades são totalmente independentes — ative qualquer combinação que se adeque ao seu fluxo de trabalho.

---

## Visão geral

O VRC Event Creator oferece três ações pós-criação quando você cria ou automatiza um evento do VRChat. Cada uma pode ser ativada independentemente por modelo e por evento:

- **"Criar convite de calendário .ics"** — Gera um arquivo de calendário `.ics` padrão com lembretes opcionais, salvo automaticamente em um diretório local
- **"Publicar Webhook do Discord"** — Publica um anúncio em um canal do Discord via webhook (com arquivo `.ics` anexado opcional se o calendário também estiver ativado)
- **"Criar evento no Discord"** — Cria um evento agendado no seu servidor Discord via bot

Quando várias funcionalidades estão ativadas, elas se complementam naturalmente:

| Evento do Discord | Webhook | Calendário (.ics) | O que acontece |
|---|---|---|---|
| SIM | NÃO | NÃO | Apenas o evento agendado do Discord é criado |
| NÃO | SIM | NÃO | O webhook publica embed com detalhes do evento |
| NÃO | NÃO | SIM | Arquivo `.ics` salvo automaticamente no diretório local |
| SIM | SIM | NÃO | Evento do Discord criado + webhook publica link do evento |
| SIM | NÃO | SIM | Evento do Discord criado + `.ics` salvo |
| NÃO | SIM | SIM | Webhook publica embed + `.ics` anexado, também salvo |
| SIM | SIM | SIM | Evento do Discord + webhook com link do evento + `.ics` anexado + salvo |

---

## Etapa 1: Ativar a geração de arquivos de calendário

1. Abra **Configurações** > **Configurações avançadas**
2. Marque **"Ativar geração de arquivos de calendário"**

Isso torna o botão **"Criar convite de calendário .ics"** disponível nos modelos e na criação de eventos.

### Diretório de salvamento

Quando a geração de arquivos de calendário está ativada, os arquivos `.ics` são sempre salvos em um diretório local. O local padrão é `Documents/VRC Event Creator .ics/` e é criado no primeiro salvamento.

Os arquivos são salvos como `{diretório}/{Nome do grupo}/{Nome do evento - Data}.ics`. Para alterar o local, use o botão **Alterar** ao lado de **Diretório de salvamento do calendário** em **Configurações** > **Informações do aplicativo**.

---

## Etapa 2: Configurar o webhook do Discord (opcional)

Um webhook publica anúncios em um canal específico do Discord. É independente dos arquivos de calendário e dos eventos do Discord — você pode usá-lo com ou sem qualquer um deles.

1. No Discord, clique com o botão direito no canal onde deseja que os anúncios sejam publicados
2. Clique em **Editar canal** > **Integrações** > **Webhooks** > **Novo webhook**
3. Copie a URL do webhook
4. No VRC Event Creator, vá em **Configurações** > **Integração com Discord** > selecione seu grupo
5. Marque **"Ativar Webhook"** e cole a URL do webhook
6. Clique em **Testar Webhook** para verificar, depois em **Salvar**

Quando tanto o webhook quanto o calendário estão ativados para um evento, o arquivo `.ics` é anexado à publicação do webhook. Quando apenas o webhook está ativado (sem calendário), o webhook publica um embed com detalhes do evento sem anexo `.ics`.

Se um evento agendado do Discord também foi criado, a mensagem do webhook inclui o link do evento do Discord em vez de um embed.

---

## Etapa 3: Configurar modelos

1. Vá em **Gerenciar Modelos** e edite (ou crie) um modelo
2. Na aba **Básico**, você verá até três botões de publicação (dependendo da configuração):
   - **"Criar convite de calendário .ics"** — visível quando a geração de arquivos de calendário está ativada
   - **"Criar evento no Discord"** — visível quando um bot do Discord está configurado para o grupo
   - **"Publicar Webhook do Discord"** — visível quando uma URL de webhook está configurada para o grupo
3. Ative os que deseja para este modelo
4. Se o calendário estiver ativado, a aba **Agenda** mostra um cartão **"Lembretes de calendário .ics"**
5. Marque **"Ativar lembretes de calendário .ics"** e adicione seus intervalos de lembrete preferidos
6. Salve o modelo

Os lembretes usam intervalos predefinidos compatíveis com todos os principais aplicativos de calendário: 5 min, 10 min, 15 min, 30 min, 1 hora, 2 horas, 4 horas, 8 horas, 12 horas, 1 dia, 2 dias, 1 semana.

> **Nota:** Alguns aplicativos de calendário (como Outlook) usam apenas o primeiro lembrete. O lembrete mais longo é colocado primeiro para melhor compatibilidade. O Google Calendar ignora lembretes personalizados na importação e usa suas configurações de notificação padrão.

---

## Etapa 4: Criar eventos

Ao criar um evento (manualmente ou por automação):

- A etapa **Data** mostra **"Criar convite de calendário .ics"** (herdado do modelo, pode ser alterado)
- Abaixo, **"Ativar lembretes de calendário .ics"** permite personalizar lembretes por evento
- A etapa **Detalhes** mostra **"Criar evento no Discord"** e **"Publicar Webhook do Discord"** como botões separados
- Todas as configurações do modelo podem ser alteradas por evento

---

## Perguntas frequentes

### Quais aplicativos de calendário suportam arquivos .ics?

Todos os principais: Outlook, Apple Calendar, Google Calendar, Thunderbird e qualquer aplicativo compatível com o padrão iCalendar.

### Os lembretes funcionam em todos os aplicativos de calendário?

Múltiplos lembretes funcionam no Apple Calendar e no Thunderbird. O Outlook usa apenas o primeiro lembrete. O Google Calendar ignora lembretes na importação completamente.

### Posso usar webhooks sem arquivos de calendário?

Sim. O webhook publica um embed com detalhes do evento mesmo quando a geração de arquivos de calendário está desativada. Ative "Publicar Webhook do Discord" no seu modelo sem ativar "Criar convite de calendário .ics".

### Posso usar webhooks sem a criação de eventos do Discord?

Sim. O webhook, os eventos do Discord e os arquivos de calendário são totalmente independentes. Qualquer combinação funciona.

### A URL do webhook é confidencial?

Sim — qualquer pessoa com a URL do webhook pode enviar mensagens para esse canal. Trate-a como uma senha. Ela é criptografada e armazenada localmente usando o armazenamento seguro do seu sistema operacional.

---

## Solução de problemas

| Problema | Solução |
|---|---|
| Nenhum arquivo .ics gerado | Verifique se "Ativar geração de arquivos de calendário" está ativado nas Configurações avançadas, e se "Criar convite de calendário .ics" está marcado no modelo ou evento |
| Webhook não publica | Verifique a URL do webhook com "Testar Webhook" nas configurações do Discord. Confirme que "Ativar Webhook" está ativado para o grupo e "Publicar Webhook do Discord" está marcado no modelo |
| Webhook publica mas sem .ics anexado | "Criar convite de calendário .ics" também deve estar ativado para o evento. Sem isso, o webhook publica apenas um embed ou link de evento |
| Lembretes não funcionam no Outlook | O Outlook suporta apenas o primeiro lembrete. O aplicativo ordena o mais longo primeiro para compatibilidade |
| Lembretes não funcionam no Google Calendar | O Google Calendar ignora lembretes personalizados na importação de .ics. Configure lembretes manualmente após a importação |
| Arquivos salvos no local errado | Os arquivos são salvos em `{diretório}/{Nome do grupo}/`. O padrão é `Documents/VRC Event Creator .ics/`. Pode ser alterado em Configurações > Informações do aplicativo |
