# 05 — Segurança e privacidade (análise estática)

Sem segredos copiados neste relatório. Severidades: P0 crítico · P1 alto · P2 médio · P3 baixo.

## 1. Autenticação e autorização — sólido, com 1 acoplamento frágil

- ✅ Todas as rotas do plugin herdam a gate do dashboard (`/api/plugins/*` exige cookie; cliente usa `credentials:same-origin`, `app.js:50-62`). Nenhuma rota anônima criada.
- ✅ `API_SERVER_KEY` nunca vai ao navegador: `_api_key()` no servidor (`plugin_api.py:45-60`), `Authorization: Bearer` só em `httpx` server-side. `GET /api/me` expõe só `api_base` (host:porta — informação operacional, não segredo).
- ✅ Login embutido só em 401/403 e revalida via `POST /auth/password-login` do próprio dashboard (`app.js:66-73`); senha não é armazenada pelo plugin.
- 🟡 **P2 — potencial:** `GET /api/me` deriva `user ← request.state.user_id ou "admin"` (`plugin_api.py:215`). Se o atributo não existir no host, todo cliente aparece como "admin" na UI (não é bypass — a gate real é do dashboard — mas confunde auditoria). Recomendação: não exibir papel; exibir só o id quando presente, sem fallback "admin".
- 🟡 **P1 — fragilidade, não vuln:** `approvals_set` grava `approvals.mode` (inclui `off` = sem perguntas) via escopo de perfil (`plugin_api.py:478-496`). Com duplo-toque de confirmação no cliente, mas sem confirmação server-side nem trilha de quem mudou. Recomendação: logar perfil/modo/IP + exigir CSRF do dashboard (herdado) e, se possível, confirmação em 2 passos para `off`.

## 2. XSS e injeção de conteúdo — bem tratado, 2 pontos de atenção (P2)

- ✅ `esc()` em títulos, prévias, tempos, badges, nomes de arquivo (`app.js:9,114-116`); `md()` escapa **antes** de aplicar code/negrito/links/listas (`app.js:25-42`); blocos de código via placeholder `@@BLOCK` (conteúdo já escapado).
- ✅ Sem `innerHTML` com dados crus do servidor fora de `md()/bubble()`; links com `target=_blank rel=noreferrer` (falta `noopener` — P3, mesma proteção na prática moderna).
- 🟡 **P2:** `ctx.botEl.innerHTML = md(bot.content)` em streaming (`app.js:359`) re-renderiza markdown parcial a cada delta — blocos de código incompletos geram HTML transitório; o escape prévio impede script, mas `autolink` parcial pode criar link clicável no meio do stream. Mitigação: só autolinkar URLs completas (regex atual já exige 1+ char após `http` — manter) e sanitizar esquemas não-http (hoje só `http(s)` linka — OK).
- 🟡 **P2:** transcrição/voz e nomes de arquivo passam por `esc()` na exibição (`app.js:208-214`) — correto; garantir o mesmo em futuros "copiar código" e títulos de agentes vindos de `profile.yaml:description` (hoje `textContent`, seguro — `app.js:644`).

## 3. Upload e arquivos — bom, endurecer 2 detalhes (P1/P2)

- ✅ Limite 25 MB cliente+servidor (`MAX_FILE`, `_MAX_UPLOAD_BYTES`), base64 validado, MIME extraído do header `data:` sem confiar para execução, nome sanitizado + truncado + prefixo timestamp+uuid (`plugin_api.py:288-289`), diretório `~/uploads` criado com `mkdir -p`, download sem subpastas e com regex + bloqueio de dotfile (`plugin_api.py:294-307`).
- 🟡 **P2:** `serve_upload` usa `mimetypes.guess_type(name)` + override `.webm` — servir com `Content-Type` do nome permite `image/svg+xml` com JS embutido se alguém fizer upload de SVG (o `accept` do input não lista `.svg`, mas o endpoint aceita qualquer `data:`). Mitigação: `Content-Disposition: inline` só para audio/imagem raster; forçar `attachment` ou `text/plain` para svg/html/xml, e/ou `X-Content-Type-Options: nosniff` + `Content-Security-Policy: sandbox`.
- 🟡 **P2:** arquivos aceitos incluem `.zip/.doc/.xls/.ppt` executáveis por natureza; o risco é no agente que os lê (ferramentas de arquivo do Hermes), não no PWA — registrar como risco herdado + recomendar quarentena/extensão visível (já exibe nome+tamanho) e varredura no host se existir.
- ✅ `Cache-Control: private, max-age=86400` no download evita cache compartilhado; avaliar `max-age` menor para voz sensível (P3).

## 4. Armazenamento no navegador e PWA — dados mínimos, 1 ajuste (P2)

- ✅ `localStorage` guarda só `{sid, profile, run_id, text, started}` (`RUN_KEY`) + `hermes-pwa-profile`. Sem tokens, sem chave, sem histórico.
- 🟡 **P2:** `run_id` + texto da última mensagem ficam em `localStorage` até `finishRun` (ou 2 h em `resumePendingRun`). Em aparelho compartilhado, outro usuário do mesmo navegador vê o `run_id`/rascunho. Mitigação: `sessionStorage` em vez de `localStorage` para o run pendente (mantém retomada em reload, some ao fechar aba) + botão "encerrar execução".
- ✅ SW (`sw.js`) nunca cacheia `api/*` nem `qr.svg`; casca com `no-store` na rede e `caches.match` só como fallback; `VERSION` com limpeza de caches antigos. Sem dados privados em cache — correto.

## 5. Rede, logs e dependências

- ✅ HTTPS exigido para instalação (README); `HERMES_PWA_API_HOST` default `127.0.0.1` (não expõe gateway); timeouts `30 s / read 300–600 s` evitam hang eterno; erros truncados (≤300–400 chars) evitam vazar paths/keys em `toast`.
- ✅ Nenhum segredo no repo (`.gitignore` cobre `.env`; `key_preview` só mostra início/fim, `plugin_api.py:525`).
- 🟡 **P3:** `stt_save` valida o formato da chave por regex + checagem live no Groq — bom; garantir que a chave nunca seja logada (`_log.exception` só em `save_config`, sem a chave — OK, manter).
- 🟡 **P2:** dependências externas em runtime: `api.groq.com` (checagem STT), js `qrcode-generator` vendored (bom — sem CDN), Python `qrcode` opcional no servidor. Sem SRI/CDN no app — correto; manter tudo same-origin.
- 🟡 **P3:** `QR_LIB` carregado de `/dashboard-plugins/hermes-pwa/dist/qrcode.js` (`dist/index.js:11`) — path fora do prefixo `/api/plugins/`; se o dashboard mudar o mount de assets, a aba perde o QR (fallback já mostra "QR code" textual — OK, mas monitorar).

## 6. Resumo de riscos

| # | Risco | Severidade | Tipo |
|---|---|---|---|
| 1 | SVG/HTML enviado servido como executável em `api/uploads` | P2 | Potencial (exige upload + abertura) |
| 2 | `run_id`/rascunho em `localStorage` em aparelho compartilhado | P2 | Potencial |
| 3 | Fallback `user="admin"` confunde identidade na UI | P2 | Potencial |
| 4 | `approvals off` sem trilha/auditoria | P2 | Potencial |
| 5 | Autolink parcial durante streaming | P3 | Potencial |
| 6 | Falta `noopener`/`nosniff`/CSP em downloads | P3 | Endurecimento |

Nenhum P0/P1 de segurança confirmado estaticamente. Revalidar em execução: expiração real de sessão, `Secure/HttpOnly/SameSite` dos cookies (definidos pelo dashboard, fora do plugin), e comportamento com `API_SERVER_KEY` ausente/errada (503/502 já tratados).
