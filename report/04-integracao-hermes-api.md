# 04 — Integração com o Hermes (APIs, hooks, eventos, auth, compatibilidade)

> Nenhum código do Hermes estava presente no workspace (só o plugin). A coluna "origem" abaixo indica **onde o uso foi observado no plugin**; a classificação segue a regra: sem doc/código do núcleo local, nada é afirmado como "público documentado" sem evidência.

## 1. Tabela de recursos do Hermes utilizados

| Recurso consumido pelo plugin | Observado em | Classificação | Reutilização / limite |
|---|---|---|---|
| Gate de auth do dashboard p/ `/api/plugins/*` (cookie) | `app.js:50-62` (`credentials:same-origin`, 401→login); `plugin_api.py:1-9` (docstring) | **Exige validação em execução** (contrato do host, não visível localmente) | Reutilizar sempre; não duplicar login. Limite: sessão 12 h/30 d só consta no README (não confirmado em código) |
| Montagem `APIRouter` de plugin (`api: plugin_api.py`) | `manifest.json:10` | **Observada sem contrato público confirmado** | Padrão de extensão; manter `router` + catch-all por último |
| Aba de painel (`tab.path /pwa`, `entry`, `css`) | `manifest.json:7-9` | **Observada sem contrato** | Reutilizar; `position: after:chat` pode mudar em redesign do painel |
| SDK `window.__HERMES_PLUGIN_SDK__` (`React, components, hooks, fetchJSON`), `__HERMES_PLUGINS__.register` | `dist/index.js:3-8,42,155` (`Card/Button/Input`) | **Exige validação** | Preferir a componentes próprios quando o visual divergir; testar a cada update do dashboard |
| `ctx.register_command("pwa", …)` | `__init__.py:35-38` | **Observada sem contrato** | Interface mínima e estável na prática; manter (1 chamada, `suppress`) |
| Gateway `GET/POST/PATCH/DELETE /api/sessions…` (+ `?source`, `limit/offset`) | `plugin_api.py:219-254` | **Exige validação** (nenhum schema local) | Núcleo do produto — consumir, nunca reimplementar |
| Gateway `POST /api/sessions/:id/chat/stream` (SSE legado) | `plugin_api.py:369-403` | **Exige validação** | Hoje sem chamador no app — candidato a remover |
| Gateway `POST /v1/runs`, `GET /v1/runs/:id`, `GET …/events` (SSE `message.delta/tool.*/approval.request/run.*`) | `plugin_api.py:318-366`, `app.js:353-445` | **Exige validação** | Base do "continua em 2º plano"; tratar eventos desconhecidos como no-op |
| Gateway `POST /v1/runs/:id/approval {choice,request_id}` | `plugin_api.py:419-433` | **Exige validação** | choices `once/session/always/deny` validados no proxy |
| `hermes_cli.config` (`load_config/read-only/save`, `get_env_path/value`, `save/remove_env_value`) | `plugin_api.py:20,449-593`, `__init__.py:19` | **Observada sem contrato** | Usar só o necessário (STT + approvals + public_url); isolar em módulo |
| `hermes_cli.profiles.list_profiles()` + `profile.yaml:description` | `plugin_api.py:159-174` | **Observada sem contrato** | Leitura tolerante (`try`, fallback `default`) — bom padrão |
| `hermes_cli.web_server_profiles._config_profile_scope` (privado `_`) | `plugin_api.py:449-459` | **Recurso interno sujeito a mudança (P1)** | Trocar por alternativa pública quando existir; hoje: fallback 501 + degradação |
| `hermes_constants.get_hermes_home()` → `~/uploads` | `plugin_api.py:259-263` | **Observada sem contrato** | Centralizar; nunca gravar fora de `uploads` |
| Dashboard `POST /auth/password-login {provider:basic,…}` | `app.js:66-73` | **Exige validação** (acoplado ao provider `basic`) | Se o Hermes trocar o IdP, o login embutido quebra — prever mensagem + redirect |
| Dashboard `POST /api/audio/transcribe {data_url,mime_type}` | `app.js:535-541` | **Exige validação** | Falha deve degradar para "sem transcrição" (já faz) |
| Sistema de temas do Hermes | — | **Não identificado** (nenhuma referência no plugin; só `prefers-color-scheme` local) | Implementar camada isolada no plugin (ver 07) |
| Hooks do Hermes (`provides_hooks`) | `plugin.yaml:14 = []` | **Não identificado / não usado** | Nada a reutilizar hoje |
| Push/notificações, contatos do usuário, foto de perfil | — | **Não identificado** | Não prometer; foto do usuário só local/opt-in |

Nenhum item pôde ser marcado como "interface pública documentada" porque a documentação oficial não estava disponível localmente — ver 09 (pendências).

## 2. Autenticação e sessões (como funciona hoje)

1. Painel autentica o usuário (fora do plugin); o plugin herda o cookie em todas as rotas (`same-origin`).
2. Backend guarda `API_SERVER_KEY` (env ou `.env` via `get_env_path`, `plugin_api.py:45-60`) e assina `Authorization: Bearer` para o gateway (`_client`, `plugin_api.py:63-66`). Erro 503 explica como configurar (`API_SERVER_ENABLED/HOST/KEY`).
3. App detecta 401/403 em `fetch` e no SW e exibe `#login` sem perder a rota (`app.js:54-73`, `sw.js:22-26`).
4. Sessões de chat = sessões do gateway (`source` preservada: whatsapp/telegram/…; `api_server` = criadas no app). Troca de perfil = `?profile=` → `/p/<perfil>`; validação de nome com regex restrita (`_PROFILE_RE`).
5. Execuções (`runs`) desacoplam "enviar" de "acompanhar": `POST runs` retorna `run_id` persistido em `localStorage`; SSE acompanha; polling assume em queda. Sem duplicar fila/agente no plugin — correto pelo princípio 4.4.

## 3. Eventos e contratos observados (defensivo)

- SSE run: `message.delta|assistant.delta` (acumula `delta`), `tool.started|tool.progress` (typing), `approval.request`, `run.completed|assistant.completed` (`output|content`), `run.failed|error`, `run.cancelled|run.interrupted` (`app.js:353-382`). Recomendação: ignorar eventos desconhecidos + versionar parser (logar sem quebrar).
- HTTP gateway: respostas lidas via `data||sessions` (lista) e `session||objeto` (criação) — tolerante a dois envelopes (`app.js:100,130`). Manter.
- Upload: `POST api/upload {name,data_url,kind}` → `{ok,path,name,size,mime,kind}`; `data:` URL obrigatória, base64 validado, 25 MB (`plugin_api.py:266-291`).
- Erros: proxy repassa `status` + `detail` (JSON ou texto ≤300) e mapeia exceção de conexão em 502 (`plugin_api.py:69-87`). Cliente exibe `detail|error|message` — manter o teto de 160–300 chars para não vazar paths.

## 4. Acoplamento e compatibilidade com updates (P1/P2)

**Frágil (tratar primeiro):**
- `_config_profile_scope` privado — qualquer rename do módulo quebra `POST /api/approvals?profile=X`. Mitigação: import tardio já aplicado; adicionar teste de import + fallback "somente default" + alerta na aba; propor ao Hermes um `config scope` público por perfil.
- `dist/index.js` depende de `SDK.components.Card…/fetchJSON/hooks` — snapshot do SDK em cada update do dashboard; mitigação: graceful-degrade (`if (!SDK) return` já existe), pinar versão testada do Hermes na doc, teste de fumaça da aba.
- `/auth/password-login` e `/api/audio/transcribe` sem contrato — mitigação: feature-detect + mensagens claras + fallback sem transcrição.

**Estável na prática:** `register_command`, `APIRouter` + `manifest.json {tab,entry,css,api}`, rotas `/api/sessions` e `/v1/runs` (núcleo do gateway; mudanças seriam breaking para outros canais também).

**Estratégia de manutenção (sem reescrever a cada versão):**
1. Isolar todo acesso ao Hermes em 1 módulo (`hermes_compat.py`: config, profiles, scope, gateway proxy) + 1 módulo JS (`hermes-api.js`): nenhum outro arquivo importa `hermes_*` nem chama `/auth|/api/audio` direto.
2. Registrar a versão do Hermes testada (`README` + `/api/me {hermes_version?}` se o host expuser) e rodar a matriz de fumaça (06) a cada update: sessões, envio, runs retomada, aprovação, STT config, aba QR, `/pwa`.
3. Preferir degradação a quebra: `try/except` com fallback documentado em `profiles`, `multiplex`, `transcribe`, `qrcode` (padrão já usado — estender).
4. Não fixar CSS global do dashboard: manter prefixo `hp-` na aba e `:root` isolado no app (hoje o app é página própria — sem vazamento; não importar `app.css` no painel).
