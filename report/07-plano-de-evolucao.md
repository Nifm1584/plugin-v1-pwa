# 07 — Plano de evolução (plugin independente, núcleo Hermes intacto)

Ordem de preferência em todas as fases: **(1)** reutilizar interface oficial do Hermes → **(2)** integrar a tokens/estilos compartilhados → **(3)** camada isolada no plugin. Nada abaixo exige alterar o núcleo.

## Fase 0 — Higiene (1ª semana, baixo risco)

- Extrair `hermes_compat.py` (config/profiles/scope/uploads) e `hermes-api.js` (fetch/SSE/perfis) — prepara todas as fases.
- Remover ou testar `chat/stream` morto; documentar `qrcode` Python como opcional.
- Registrar versão do Hermes testada + matriz de fumaça (06 §4).

## Fase 1 — Legibilidade mobile + menus (maior valor, só frontend)

## Fase 2 — Avatares e identidade (SVG próprio + foto local opt-in)

## Fase 3 — Tema claro/escuro com toggle (camada isolada — estratégia §8)

## Matriz por melhoria

### M1. Tipografia e lista de conversas (P2)
- **Objetivo:** prévia/horário legíveis, toque confortável.
- **Reutiliza Hermes?** Não — só apresentação de dados já disponíveis (`preview`, `last_active`, `source`).
- **Arquivos:** `pwa/app.css` (`.s-prev 13→14px`, `.s-meta 11→12px`, `.time 10→11px`, linha 1.4, `min-height 64px` por item), `pwa/app.js:111-122` (mover `⋯` para fora de `.s-meta` ou long-press).
- **Mudanças externas:** nenhuma. **Riscos:** mínimos (CSS escopado). **Aceitação:** legível a 30 cm em 360 px; Lighthouse legibility sem warning. **Testes:** 320/360/390 px, claro/escuro, nomes longos.

### M2. Balões, markdown e código (P2)
- **Objetivo:** leitura WhatsApp-like; código com copiar.
- **Reutiliza:** não (render local `md()/bubble()`).
- **Arquivos:** `app.js:24-42,199-228` (header de linguagem + botão copiar via `navigator.clipboard`, separador de data, agrupamento), `app.css:56-68` (corpo 16 px/1.5, `gap 8px`, hora com contraste AA, `pre` com header).
- **Riscos:** parser próprio — manter escape-prévio + testes table-driven. **Aceitação:** bloco copiado byte-a-byte; listas/links intactos. **Testes:** corpus markdown (06 §4).

### M3. Menu ⋮ do chat + sheet Anexar (P2)
- **Objetivo:** ações contextuais (ver dados da conversa, recarregar, fechar, apagar) e anexar (câmera, galeria, arquivo, áudio) estilo WhatsApp.
- **Reutiliza:** endpoints existentes (rename/reload/delete/upload); câmera/galeria via `<input accept>` + `capture` (capacidade do navegador, não do Hermes).
- **Arquivos:** `index.html:54,67-75` (novo `#attach-sheet`), `app.js:575-635` (generalizar `openSheet`), `app.css:79-82`.
- **Riscos:** baixo. **Aceitação:** 100% das ações atuais alcançáveis em ≤ 2 toques com uma mão. **Testes:** teclado aberto, iOS Safari `capture`, TalkBack/VoiceOver.

### M4. Avatares: Hermes próprio + usuário + agentes (P2)
- **Objetivo:** identidade visual sem cópia do WhatsApp.
- **Reutiliza:** `source` (cor/ícone por canal) + `profiles[].name/description/model` para cor/inicial por agente; **foto do usuário: não há recurso correspondente no Hermes (não identificado)** → preferência local opt-in (`localStorage`, nunca enviada ao servidor) ou reutilizar avatar do dashboard se o Hermes expuser no futuro.
- **Arquivos:** novo `pwa/avatar.js` + `icon.svg` dedicado (substituir `☤` textual), `app.js:18-19,111-116`, `app.css:40-42`.
- **Riscos:** médio-baixo (cache de `icon-*.png` no SW — versionar `VERSION`). **Aceitação:** cada agente distinguível; fallback letra+cor determinística. **Testes:** N agentes, modo escuro, PWA instalado (maskable).

### M5. Empty-state e header contextual (P3)
- **Objetivo:** app cheio mesmo com 0–2 conversas; header mostra agente/modelo/origem/online.
- **Reutiliza:** `me/profiles` + `navigator.onLine`.
- **Arquivos:** `index.html:35,62-64`, `app.css:48`, `app.js:136-140` (subtítulo), novo banner offline.
- **Riscos:** mínimo.

### M6. Voz e anexos grandes (P2, após M3)
- **Objetivo:** cancelar gravação, onda de áudio, upload sem estourar RAM.
- **Reutiliza:** `POST /api/audio/transcribe` (com fallback) + `api/upload`; multipart/chunked **exigiria contrato novo no backend do plugin** (mudança interna do plugin, não do núcleo Hermes).
- **Riscos:** médio (contrato upload). **Testes:** áudio 5 min, PDF 25 MB em iPhone antigo.

### M7. Desempenho de listas longas (P2, após M1/M2)
- Paginação reversa + `IntersectionObserver` + throttle de `md()` em streaming. Só plugin. Validar com conversa de 500 mensagens.

## Estratégia recomendada para tema claro/escuro

**Estado atual:** só `prefers-color-scheme` + variáveis `:root` (`app.css:1-13`); sem toggle, sem persistência, sem API do Hermes (não identificada). Risco de flash: `app.css` carrega de forma bloqueante (bom), mas `manifest theme_color #0f2f31` fixo escuro e `meta theme-color` duplo por media — splash pode divergir da página em Android.

**Recomendação (camada isolada no plugin, preferência 3):**
1. Migrar cores para `[data-theme="light|dark"]` + `auto` (segue SO); default `auto`.
2. Toggle no `#btn-settings`/avatar (Sol/Lua/Auto, 3 estados); persistir em `localStorage hermes-pwa-theme` (preferência puramente visual — sem dado sensível; nada indica API do dashboard para preferências, então local é o correto).
3. Script inline de ~10 linhas no `<head>` aplicando `data-theme` antes do CSS (elimina flash); `meta theme-color` atualizado via JS.
4. Isolar com escopo (`.app[data-theme]` ou `:root[data-theme]`) para nunca vazar ao dashboard; aba React herda tema do painel (não forçar).
5. Contraste AA em balões/menus/modais/erros nos dois temas (ferramenta: Axe/Lighthouse); `color-scheme: light dark` por tema.
- **Se o Hermes publicar um sistema de temas no futuro:** mapear `auto` para o token oficial e manter `light/dark` manuais como override — 1 adaptador, sem reescrita.
- **Arquivos:** `index.html` (script head + botão), `app.css` (blocos por tema), `app.js` (store/apply). **Testes:** SO claro/escuro × escolha Auto/Claro/Escuro, reload, PWA instalado, splash/manifest.

## O que NÃO fazer

- Não duplicar auth/sessões/transporte/agentes no plugin; não importar CSS global do dashboard; não depender de path interno (`/dashboard-plugins/…`) sem fallback; não prometer push sem o Hermes oferecer.
