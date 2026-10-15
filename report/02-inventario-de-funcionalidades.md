# 02 — Inventário de funcionalidades

Legenda: ✅ confirmada · 🟡 parcial · 📄 documentada (sem código local) · ❌ não encontrada.
Prioridades: P0 crítico · P1 alto · P2 médio · P3 baixo.

## Conversas e sessões

| Funcionalidade | Estado | Arquivos / fluxo | Integração Hermes | Notas |
|---|---|---|---|---|
| Listar sessões (origem, prévia, horário) | ✅ | `app.js:96-123` → `GET api/sessions` → `plugin_api.py:219-224` → `GET /api/sessions` gateway | Gateway API server | Ordena fixados + `last_active`; filtra `hidden/archived` |
| Busca local | ✅ | `app.js:124` (`input` → `renderSessions`) | Nenhuma (filtro cliente) | Título+prévia+origem |
| Nova conversa (+ e `/new`) | ✅ | `app.js:126-133,279-288` → `POST api/sessions` → `plugin_api.py:227-232` | `POST /api/sessions {source:api_server}` | `/reset` também cria nova (não envia ao gateway) |
| Renomear | ✅ | `app.js:624-628` → `PATCH api/sessions/:id` → `plugin_api.py:235-240` | `PATCH /api/sessions/:id` | Modal próprio (sem `prompt`) |
| Apagar | ✅ | `app.js:629-633` → `DELETE` → `plugin_api.py:243-245` | `DELETE /api/sessions/:id` | Confirmação modal; P2: sem desfazer |
| Fixar/arquivar | 🟡 | Modelo `PatchSession{pinned,archived}` existe (`plugin_api.py:190-193`) mas **app.js não expõe** pin/archive na UI | Gateway (via PATCH) | Backend pronto, frontend ausente — oportunidade P3 |
| "Conversa cheia / compress" | 📄 | Só texto de ajuda no README:41-58; `/compress /model` "continuam indo ao agente" (pass-through de mensagem) | Agente via mensagem | Sem código dedicado — comportamento herdado |
| Polling lista 30 s / mensagens 12 s | ✅ | `app.js:145,670` | Gateway (leitura) | Sem push (limitação declarada) |

## Chat e streaming

| Funcionalidade | Estado | Arquivos / fluxo | Notas |
|---|---|---|---|
| Envio texto + Enter/Shift+Enter | ✅ | `app.js:268-273` | `enterkeyhint=send`, auto-resize até 140 px |
| Markdown-lite + código + links + listas | ✅ | `md()` `app.js:24-42`, `bubble()` `199-219` | Com escape prévio; sem highlight de linguagem (P3) |
| Indicador pensando / ferramenta em uso | ✅ | `setTyping`, eventos `tool.started/progress`, `_thinking` → "pensando…" (`app.js:267,362-363`) |  |
| Runs em 2º plano + retomada | ✅ | `RUN_KEY` localStorage, `streamRun/resumeRun/finishRun` (`app.js:347-467`); SSE `plugin_api.py:342-366`, status `335-339` | Diferencial; expira pending > 2 h |
| `chat/stream` legado | 🟡 | `POST api/sessions/:id/chat/stream` existe (`plugin_api.py:369-403`) mas **app.js não o chama** (usa runs) | Código morto potencial — validar ou remover (P3) |
| Preview pós-envio | ✅ | `finishRun` atualiza `preview/last_active/message_count` (`app.js:453-456`) | Otimista; sincroniza com `loadMessages(true)` |

## Agentes / perfis

| Funcionalidade | Estado | Arquivos | Notas |
|---|---|---|---|
| Seletor de agente + modelo | ✅ | `app.js:638-663`, `index.html:28-32`, `plugin_api.py:155-181` | `list_profiles()` + `profile.yaml:description`; persistido em `localStorage hermes-pwa-profile` |
| Multiplex (`gateway.multiplex_profiles`, `/p/:perfil`) | ✅ | `_pfx()` `plugin_api.py:145-152`; bloqueio com toast `app.js:660` | Exige config por perfil + mesma `API_SERVER_KEY` (README:80-90) |
| Modo de autorização por agente | ✅ | `app.js:583-615`, `plugin_api.py:461-496` (`manual/smart/off`, duplo-toque p/ `off`) | **P1:** usa `_config_profile_scope` privado (ver 04) |

## Mídia e anexos

| Funcionalidade | Estado | Arquivos | Notas |
|---|---|---|---|
| Imagens (anexar/colar/arrastar, até 6, shrink 1600 px JPEG 0.85) | ✅ | `app.js:470-534`, `index.html:54`, `plugin_api.py:196-204` (partes `image_url`) | Vão como `data:` URL no `input` do run — **não persistem** (limitação declarada) |
| Arquivos ≤ 25 MB → `~/uploads` | ✅ | `upload()` `plugin_api.py:266-291`, `uploadAttachment` `app.js:530-534` | Nome sanitizado + timestamp+uuid; agente lê via ferramentas |
| Player + lightbox | ✅ | `app.css:131-136`, `bubble/lightbox` `app.js:204-223` | Imagens `max 220 px`, zoom overlay; áudio `audio controls` |
| Voz + transcrição Groq | ✅ | Gravação `app.js:543-573`; `transcribe()` → `POST /api/audio/transcribe` `app.js:535-541`; config STT `plugin_api.py:499-604` + aba `dist/index.js:46-97` | Sem provedor: envia sem transcrever (fallback documentado) |
| Download `api/uploads/:nome` | ✅ | `plugin_api.py:294-307` (regex, sem subpastas, `private,max-age=86400`) | Só serve `~/uploads` plano |

## Aprovações, auth, PWA

| Funcionalidade | Estado | Arquivos | Notas |
|---|---|---|---|
| Card aprovação (once/session/always/deny) | ✅ | `approvalCard` `app.js:233-264` → `POST api/runs/:id/approval` → `plugin_api.py:419-433` | Expira cards em `run.completed/failed/cancelled` |
| Auth dashboard + login embutido | ✅ | Cookie `same-origin` (`app.js:50-62`); `401/403 → showLogin` → `POST /auth/password-login` (`app.js:66-73`); SW trata 401/403 (`sw.js:22-26`) | Sessão 12 h / 30 dias (só README — 📄) |
| Instalação PWA + QR + `/pwa` | ✅ | Manifest dinâmico, `sw.js`, `index.html:12-16`; aba `dist/index.js:99-134`; `__init__.py:27-32` | `theme-color` light/dark; ícones 192/512 + svg + maskable |
| Tema claro/escuro | 🟡 | `app.css:1-13` **só `prefers-color-scheme`**; sem toggle/persistência | Ver 03/07 — evolução planejada |
| Avatares | 🟡 | Letra inicial + cor por `source` (`app.js:18-19`, `app.css:40-42`); logo `☤` textual | Sem foto Hermes/usuário/agente (ver 03) |
| Acessibilidade base | 🟡 | `aria-label`s, `role=dialog`, `enterkeyhint`; sem `aria-live`, foco parcial | Ver 03/06 |

## Não encontradas (apesar de desejáveis)

- Push notifications ❌ (limitação declarada; 12 s polling).
- Busca no servidor, paginação infinita, virtualização de lista longa ❌ (só `limit=80`, sem scroll infinito).
- Edição de mensagem, reações, leitura/recibos, digitação remota ❌.
- Compartilhar localização/contato, chamadas ❌ (fora do escopo Hermes).
- Testes de qualquer item acima além de manifestos ❌ (ver 06).
