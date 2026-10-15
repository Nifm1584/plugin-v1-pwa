# 06 — Qualidade, desempenho, manutenção e plano de testes

## 1. Qualidade do código

**Pontos fortes:** separação clara (proxy Python × SPA vanilla × aba React); validação de entrada nos dois lados (`_PROFILE_RE`, `_RUN_ID_RE`, `_APPROVAL_CHOICES/MODES`, `ChatBody/RunBody/ApprovalBody/SttBody`); erros com mensagens PT-BR acionáveis (503 explica o `.env`); degradação graciosa (`profiles` com fallback, `transcribe` opcional, QR textual); `no-store` consistente no estático do app.

**Débitos (P2/P3):**
- `app.js` monolítico (~685 linhas, 1 IIFE, `state` global mutável) — extrair `api.js`, `md.js`, `sessions.js`, `chat.js`, `audio.js` sem build (ES modules ou concatenação) preservaria "sem build" e facilitaria teste.
- `chat/stream` no backend sem chamador (`plugin_api.py:369-403`) — remover ou cobrir com teste; hoje é superfície morta.
- Regex de perfil duplicada em dois idiomas (Python `_PROFILE_RE` × `pq()` JS) — centralizar a regra na doc.
- `dialog()` com `classList.remove/add("hidden")` redundante (`app.js:86`) — cosmético.
- `qrcode` Python importado sob demanda sem constar em dependências — documentar como opcional (fallback cliente já existe).
- Sem `aria-live`, sem `prefers-reduced-motion`, `noopener` ausente (ver 03/05).

## 2. Desempenho

- ✅ Polling contido (lista 30 s só sem chat aberto; mensagens 12 s só sem streaming; backoff 2,5/8 s em runs).
- ✅ Imagens com downscale (1600 px, JPEG 0.85) e limite de 6/mensagem; `readAsDataURL` + `canvas` — OK para mobile, mas base64 em memória duplica o custo: arquivos grandes (25 MB) podem estourar RAM em iPhone antigo. Recomendação (P2): upload em chunks ou `fetch` com `Blob` direto quando o backend aceitar multipart (exige mudança no contrato — registrar como evolução).
- 🟡 **P2:** `renderMessages` reconstrói todas as bolhas a cada `loadMessages` (`app.js:224-228`) e `renderSessions` reconstrói a lista — sem virtualização; conversas com centenas de mensagens terão jank. `limit=80` na lista e `limit≤500` em mensagens mascaram, mas o scroll infinito inexiste. Evolução: paginação reversa + `IntersectionObserver` + `content-visibility`.
- 🟡 **P2:** streaming re-faz `innerHTML = md(bot.content)` por delta (`app.js:359`) — O(n²) em respostas longas. Evolução: throttle de render (ex.: 150 ms) + append incremental.
- 🟡 **P3:** `visibilitychange` recarrega lista/mensagens ao voltar — correto, mas sem `ETag`/dedupe além de `changed` em mensagens; lista sempre re-renderiza. Aceitável hoje.
- Listeners: `pollMsgs/pollList/recTimer` limpos em `closeSession/stopTimer`; `ctx.onVisible` removido em `finishRun` — sem vazamento relevante. `controllerchange` com guarda `reloaded/streaming` — correto.

## 3. Testes existentes

`tests/test_plugin.py` (22 linhas): `test_manifests` (nomes, versão, `tab.path`, 7 arquivos) + `test_register_command` (registra `pwa`, handler contém "pwa"). **Só contrato estático.** Nada cobre `plugin_api.py` (proxy, upload, approvals, STT), `app.js`, CSS, SW, nem regressão de update do Hermes.

## 4. Plano de testes proposto

**Estáticos (sem ambiente, já possíveis):**
- [ ] `test_manifests` estendido: `plugin.yaml ↔ manifest.json` versão/nome, `entry/css/api` existem, `kind/tags/license`.
- [ ] Contrato do proxy: `_pfx/_PROFILE_RE/_RUN_ID_RE` (table-driven), `PatchSession` vazio → 400, `UploadBody` inválida → 400 (via `TestClient` com `hermes_cli` mockado).
- [ ] Lint: `python -m compileall`, `node --check app.js dist/index.js` (sintaxe), varredura de segredos (`.env`, chaves, `Bearer` no cliente).

**Automatizados (com host mockado):**
- [ ] Proxy sessions/runs/approval com gateway fake (SSE incluso); erro 502/503/400 mapeados.
- [ ] Upload: nome malicioso `../../x`, `data:` inválida, > 25 MB, SVG servido com content-type seguro.
- [ ] STT: chave inválida, Groq 401, idioma inválido.

**Manuais em ambiente isolado (pendências de execução — ver 09):**
- [ ] Primeira conversa: criar → enviar markdown/lista/código → comparar antes/depois do reload (hipótese H1, relatório 03).
- [ ] Sessões antigas, troca de perfil, `gateway.multiplex_profiles` off/on.
- [ ] Mensagens curta/longa, código multilinguagem, links, listas aninhadas.
- [ ] Anexos: 6 imagens, PDF 25 MB, paste de print, drag-drop, áudio 5 min, sem STT configurado.
- [ ] Teclado iOS/Android aberto/fechado, 320/360/390/768/1024 px, `100dvh` com barra de navegação.
- [ ] Tema claro/escuro do SO, reload com `?stay=1`, SW update (v12→v13 recarrega 1× sem perder rascunho).
- [ ] Sessão expirada (401 → login embutido → `boot()` retoma), avião on/off, SSE cortado no meio (retomada por polling), aprovação once/session/always/deny + expiração.
- [ ] Update do Hermes: repetir fumaça (sessões, envio, runs, aprovação, STT, aba QR, `/pwa`) + diff de `SDK.components` e `_config_profile_scope`.
