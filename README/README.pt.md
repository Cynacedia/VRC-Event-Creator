<h1 align="center">
  <img src="../electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://img.shields.io/github/downloads/Cynacedia/VRC-Event-Creator/total?style=plastic&labelColor=555&color=blue" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文（简体）</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.ru.md">Русский</a>
</p>
Uma ferramenta tudo-em-um para criação de eventos no VRChat que elimina a configuração repetitiva.
Crie e salve modelos de eventos por grupo, gere datas futuras a partir de padrões recorrentes simples e preencha os detalhes instantaneamente - perfeita para agendar rapidamente encontros semanais, sessões de watch party e eventos da comunidade.


<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="Event creation flow (profile to publish)" />
</p>


## Recursos
- Perfis/modelos que preenchem automaticamente os detalhes do evento por grupo.
- Gerador de padrões recorrentes com lista de próximas datas e opção manual de data/hora.
- Assistente de criação de eventos para calendários de grupo.
- Tela de modificar eventos para próximos eventos (grade + modal de edição).
- Estúdio de temas com presets e controle total de cores da UI (suporta #RRGGBBAA).
- Seletor e upload de imagens da galeria para IDs de imagem.
- Localização com seleção de idioma no primeiro início (en, fr, es, de, ja, zh, pt, ko, ru).

## Download
- Lançamentos: https://github.com/Cynacedia/VRC-Event-Creator/releases
- O `.exe` portátil do Windows funciona de forma independente.

## Privacidade e armazenamento de dados
Sua senha não é armazenada. Apenas tokens de sessão ficam em cache.
O app armazena seus arquivos no diretório de dados do Electron (mostrado na seção Configurações > Informações do aplicativo):

- `profiles.json` (modelos de perfil)
- `cache.json` (tokens de sessão)
- `settings.json` (configura��es do aplicativo)
- `themes.json` (predefinições de tema e cores personalizadas)

Você pode substituir o diretório de dados com a variável de ambiente `VRC_EVENT_DATA_DIR`.
Na primeira execução, o app tentará importar um `profiles.json` existente da pasta do projeto.

__**Não compartilhe arquivos de cache nem pastas de dados do aplicativo.**__

## Notas de uso
- Os perfis exigem Nome do Perfil, Nome do Evento e Descrição antes de continuar.
- É necessário um e-mail de contato na primeira execução para uso da API do VRChat.
- Grupos privados só podem usar Tipo de acesso = Grupo.
- A duração usa DD:HH:MM e é limitada a 31 dias.
- As tags são limitadas a 5 e os idiomas a 3.
- Uploads da galeria: PNG/JPG, 64-2048 px, menos de 10 MB e 64 imagens por conta.
- O VRChat atualmente permite no máximo 10 eventos futuros por vez.

## Solução de problemas
- Problemas de login: exclua `cache.json` e faça login novamente (use a pasta de dados mostrada em Sobre).
- Grupos ausentes: sua conta precisa de acesso ao calendário no grupo alvo.
- Limite de taxa: o VRChat pode limitar a criação de eventos. Aguarde e tente novamente, e pare se várias tentativas falharem. Não fique spamando os botões de atualizar ou criar eventos.
- Atualizações: Alguns recursos ficam bloqueados quando há atualizações pendentes. Baixe e execute a versão mais recente.

## Aviso
- Este projeto não é afiliado ou endossado pela VRChat. Use por sua conta e risco.
- Os idiomas são traduzidos automaticamente e podem estar incorretos; contribua com correções, por favor.

## Requisitos (compilar a partir do código-fonte)
- Node.js 20+ (22.21.1 recomendado)
- npm
- Uma conta VRChat com permissão para criar eventos para pelo menos um grupo




