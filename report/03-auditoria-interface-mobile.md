# 03 — Auditoria da interface mobile

Método: leitura estática de `pwa/index.html`, `pwa/app.css` (175 linhas), `pwa/app.js` (685 linhas). Sem capturas (`print/` ausente) e sem execução em navegador — nada aqui afirma observação visual; problemas visuais são **confirmados no código** ou **hipóteses com plano de reprodução**.

## 1. Estrutura do frontend

- `index.html`: `aside#list` (brand + refresh/settings/new, `agentbar`, `search`, `ul#sessions`, `list-empty`) + `main#chat.hidden` (back, título/sub, menu ⋮, `#messages`, `#typing`, `#tray`, `#rec`, `form#composer` com attach/textarea/mic/send) + `#placeholder` (desktop) + `#sheet/#settings/#login/#modal/#toast`.
- Layout: `.app { height: 100dvh; grid-template-columns: 1fr }`; mobile alterna lista XOR chat via `.hidden` (`openSession/closeSession`, `app.js:136-152`); desktop ≥ 900 px exibe lado a lado (`app.css:107-116`), `#btn-back` some.
- Teclado: `textarea rows=1`, auto-resize até 140 px, `Enter` envia / `Shift+Enter` quebra (`app.js:268-271`); `safe-area-inset` no composer e barras (`app.css:23,73`); fonte do input 16 px (evita zoom iOS — correto).

## 2. Problemas relatados × evidência no código

### (1) Textos secundários e horários pequenos na lista — CONFIRMADO (P2)
- `.s-prev { font-size: 13px }`, `.s-meta { font-size: 11px }`, `.msg .time { font-size: 10px }`, `.badge { font-size: 10px }` (`app.css:45-47,60`).
- Em telas 360 px com `grid-template-columns: 48px 1fr auto`, o `⋯ (more)` dentro de `.s-meta` (`app.js:117-119`) comprime ainda mais a coluna de horário/badge.
- Recomendação (não implementada aqui): prévia ≥ 14 px, meta ≥ 12 px, altura de linha 1.4, badge sem `uppercase` apertado, mover `⋯` para `long-press`/swipe ou canto do título; validar com testes de largura 320–390 px (ver 07).

### (2) Avatares só com letras — CONFIRMADO (P2)
- `initial(s)` = 1ª letra do rótulo da origem (`app.js:19`); cores chapadas por `source` (`app.css:40-42`: whatsapp verde, telegram azul, etc.; `api_server/dashboard/desktop` = accent; `tui/cli` roxo; `cron` laranja; default `#7b8a90`).
- Sem `<img>`, sem foto do usuário, sem marca do Hermes (logo atual é o caractere `☤` em `.brand`/placeholder/login — `index.html:21,63,91`).
- Consequência: conversas do mesmo canal ficam indistinguíveis; vazio estético com poucas conversas. Proposta WhatsApp-like em 07 (avatar Hermes em SVG dedicado, cor+inicial por sessão como fallback, foto do usuário via preferência local + identificação por agente).

### (3) Interface vazia com poucas conversas — CONFIRMADO (P3)
- `#list-empty`: "Nenhuma conversa ainda. Toque em + para começar." (`index.html:35`) + `.placeholder` desktop "Escolha uma conversa…" (`index.html:62-64`). Sem ilustração, sem CTA secundário, sem onboarding (atalhos `/new`, voz, anexos).
- Melhoria: empty-state ilustrado + botões "Nova conversa" / "Como instalar" / "Ver agentes" (só frontend, baixo risco).

### (4) Legibilidade/espaçamento das mensagens — CONFIRMADO PARCIAL (P2)
- Pontos positivos: `max-width: min(82%, 640px)`, `overflow-wrap: anywhere`, `line-height 1.45`, balões com raio 14 px e cantos de cauda (4 px), `pre` com scroll horizontal.
- Débitos: corpo 15 px com parágrafos `margin 0 0 6px` e `gap 6px` entre balões (`app.css:56-61`) — denso em telas pequenas; `code` 13 px; timestamp 10 px com `opacity .6` (contraste duvidoso no claro); links `accent-strong` sem sublinhado; listas com `padding-left 20px` justo; sem agrupamento por autor/data, sem quebra dia-a-dia.
- Proposta: corpo 16 px / 1.5, `gap 8-10px`, `padding 10px 12px`, hora 11 px com contraste AA, separadores de data, cópia de código com 1 toque (ver 07).

### (5) Primeira conversa com formatação diferente — HIPÓTESE, sem causa definitiva (P2)
Evidência relevante, sem prova:
- **H1 — bolha local × render do servidor:** `send()` cria `bubble(userMsg)` otimista com texto cru (`esc + <br>`, `app.js:299-307`) e só depois `userMsg.content` é reescrito com blocos de áudio/arquivo; o assistente chega via `md()` incremental (`runEvent`, `app.js:356-360`). A primeira mensagem de uma sessão nova pode exibir o estado "cru" (sem markdown) até `loadMessages(true)` em `finishRun` (`app.js:456`) reconciliar. Sessões seguintes já vêm renderizadas do servidor. **É a hipótese mais forte.**
- **H2 — sessão recém-criada sem `model/preview`:** `openSession` monta `chat-sub` com fallback de modelo (`app.js:139`); sessão nova tem `model` vazio → subtítulo/título provisório até o primeiro `loadSessions`. Diferença cosmética real.
- **H3 — viewport/teclado no primeiro foco:** `setTimeout(focus, 50)` (`app.js:146`) + `100dvh` recalculado com teclado aberto pode deslocar `scrollBottom` antes das fontes/carregamento; `scrollBottom` é chamado após cada append sem rAF nem âncora de scroll.
- **H4 — race `loadMessages` × `resumePendingRun`:** `openSession` dispara `loadMessages()` e encadeia `resumePendingRun` (`app.js:141-144`); em sessão nova vazia, `renderMessages` com lista vazia pode "piscar" antes do primeiro delta.
- **Como validar:** teste manual (relatório 06/07): criar conta limpa → + → enviar `# Título` + lista + bloco código → fotografar antes/depois de recarregar; repetir na 2ª conversa; inspecionar `innerHTML` da bolha local vs. pós-`loadMessages`.

## 3. Navegação, menus e anexos (estado atual)

- Menu ⋮ (`#btn-menu`) e `⋯` por conversa abrem o mesmo `#sheet` (renomear/recarregar/apagar) — sem menu de anexos dedicado: anexo é só o clipe no composer (foto/arquivo/paste/drag + mic). Proposta WhatsApp: sheet "Anexar" (câmera, galeria, arquivo, áudio) + menu ⋮ do chat (ver conversa, recarregar, fechar, apagar) — só frontend + endpoints já existentes.
- Composer: attach 40 px + send 44 px atendem one-hand; mic vira botão de gravação com `recording` vermelho + barra `#rec` com timer — bom. Falta: rótulo acessível de estado, cancelamento de gravação, envio com teclado aberto sem cobrir a última bolha (adicione `padding-bottom` dinâmico via `visualViewport`, hipótese a validar).
- Estados: `typing` ("pensando…/escrevendo…/usando <tool>…/aguardando aprovação…/o agente continua…"), `toast`, `.msg.error`, `.empty`, `#rec`. Sem banner de offline/reconexão — só falha pós-tentativa; polling silencioso. Proposta: indicador de conexão via `navigator.onLine` + falha de `loadMessages` (P2).

## 4. Acessibilidade (débitos P2)

- OK: `aria-label` nos botões ícone, `role=dialog aria-modal`, `enterkeyhint=send`, alvos ≥ 40 px, `color-scheme` declarado.
- Faltam: `aria-live="polite"` em `#messages/#typing/#toast`, `role=log`, foco gerenciado ao abrir/fechar chat e modais, contraste AA verificado (timestamp 10 px, `.muted #667781` no claro, `code` sobre fundo), navegação por teclado no sheet, `prefers-reduced-motion` para `dots/blink`, label do `select#agent`.

## 5. Propostas visuais priorizadas (detalhe e matriz no 07)

1. Tipografia mobile (P2) — só CSS + testes de largura.
2. Avatares Hermes/usuário/agente (P2) — SVG próprio + cor determinística + foto local opcional.
3. Empty-state e placeholder (P3) — só frontend.
4. Balões e markdown (código com header + copiar) (P2) — `app.js md()/bubble()` + CSS.
5. Menu ⋮ + sheet Anexar WhatsApp-like (P2) — só frontend.
6. Header contextual + indicadores (modelo, perfil, online) (P3) — usa `me/profiles` existentes.
7. Toggle de tema com persistência (P2) — ver 07 (isolado no plugin).
