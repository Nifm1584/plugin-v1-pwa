# 01 — Arquitetura e funcionamento do hermes-pwa

## 1. Identificação

- **Nome:** `hermes-pwa` · **Versão:** 1.7.1 (`plugin.yaml:2`, `dashboard/manifest.json:6`)
- **Descrição:** app móvel do Hermes em formato PWA, chat estilo mensageiro (sessões, agentes, imagens, arquivos, voz).
- **Autor:** AstraOnlineWeb · **Licença:** MIT · **Homepage:** `github.com/AstraOnlineWeb/hermes-plugins`
- **Kind:** `standalone` · `provides_tools: []` · `provides_hooks: []` · `python_dependencies: []`
- **Raiz confirmada:** `hermes-pwa/` com `__init__.py`, `plugin.yaml`, `README.md`, `dashboard/`, `tests/`.

## 2. Estrutura de diretórios

```text
hermes-pwa/
├── __init__.py                  # comando /pwa (register_command)
├── plugin.yaml                  # metadados do plugin
├── README.md                    # doc do plugin (142 linhas)
├── dashboard/
│   ├── manifest.json            # aba PWA: tab /pwa, entry dist/index.js, api plugin_api.py
│   ├── plugin_api.py            # backend FastAPI (619 linhas) — proxy + estático
│   ├── dist/index.js            # aba do painel (React via SDK, 156 linhas)
│   ├── dist/style.css           # estilos da aba (prefixo hp-, 18 linhas)
│   ├── dist/qrcode.js           # qrcode-generator vendored (MIT, ~2297 linhas)
│   └── pwa/
│       ├── index.html           # shell do app (114 linhas)
│       ├── app.js               # SPA vanilla (~685 linhas) — toda a lógica do chat
│       ├── app.css              # tema claro/escuro + layout (~175 linhas)
│       ├── sw.js                # service worker (32 linhas, v12)
│       ├── manifest.webmanifest # GERADO dinamicamente pelo backend (não é arquivo)
│       ├── icon.svg / icon-192.png / icon-512.png
└── tests/test_plugin.py         # 2 testes (manifestos + comando)
```

Divergência doc × código (menor): o README diz "os arquivos ficam em `dashboard/pwa/`" — correto; o teste cita os 7 arquivos esperados e todos existem. Não há `manifest.webmanifest` em disco: ele é sintetizado em `plugin_api.py:105-119` com `start_url/scope` relativos — decisão correta para instalação sob `/api/plugins/hermes-pwa/`.

## 3. Tecnologias por camada

| Camada | Tecnologia | Evidência |
|---|---|---|
| Registro/entrega | Plugin de dashboard Hermes (`manifest.json`: `tab`, `entry`, `css`, `api`) | `dashboard/manifest.json:1-11` |
| Backend | Python + FastAPI (`APIRouter`, `FileResponse`, `StreamingResponse`, Pydantic `BaseModel`) + `httpx` (import tardio) | `plugin_api.py:18-21,63-66` |
| Comando chat | `register(ctx)` → `ctx.register_command("pwa", …)` | `__init__.py:35-38` |
| App móvel | HTML + Vanilla JS (IIFE, `fetch`, SSE via `ReadableStream`, `MediaRecorder`, `canvas`) sem build | `pwa/app.js:1-7,384-411,548-566` |
| Aba painel | React via `window.__HERMES_PLUGIN_SDK__` (`SDK.React`, `SDK.components`, `SDK.hooks`, `SDK.fetchJSON`) | `dist/index.js:3-8,42,155` |
| Estilos app | CSS puro, variáveis `:root` + `prefers-color-scheme`, `100dvh`, `safe-area-inset` | `pwa/app.css:1-18` |
| PWA | Web manifest dinâmico + service worker network-first + `skipWaiting/clients.claim` | `plugin_api.py:105-119`, `pwa/sw.js:8-13` |
| QR | `qrcode-generator` (MIT, Kazuhiko Arase) no cliente; fallback `qrcode` Python + SVG no servidor | `dist/index.js:10-40`, `plugin_api.py:122-138` |
| STT config | Groq `whisper-large-v3` via `hermes_cli.config` + checagem `GET api.groq.com/openai/v1/models` | `plugin_api.py:504-554` |

Sem `package.json`, sem bundler, sem dependências Python declaradas. `httpx`, `qrcode`, `yaml`, `pydantic/fastapi` são providos pelo ambiente Hermes (não declarados — ver §6).

## 4. Mapa de componentes e integrações

```text
                    ┌─ /pwa ──────────────┐
                    │ dist/index.js (React│
 Celular/PC ──HTTPS─►│  SDK): QR + STT +  │──► API plugin ──► hermes_cli.config (STT save)
  /pwa (redirect      │  redirect p/ app   │
   p/ app)           └────────────────────┘
                    ┌─ /api/plugins/hermes-pwa/ ─────────────────┐
                    │ plugin_api.py (APIRouter, atrás do login   │
                    │  do dashboard — gate do Hermes)            │
                    │  estático: index/app.js/app.css/sw/icons   │
                    │  /api/* proxy + Bearer API_SERVER_KEY:     │──► Gateway API server
                    │   sessions CRUD, messages, /runs, events,  │    127.0.0.1:8642 (+ /p/:perfil)
                    │   approval, approvals.mode, upload,        │
                    │   profiles (hermes_cli.profiles), me      │──► hermes_cli / hermes_constants
                    └────────────────────────────────────────────┘──► /api/audio/transcribe, /auth/password-login
                    ┌─ pwa/app.js ───────────────────────────────┐    (dashboard core, via cookie)
                    │ lista sessões · chat SSE · runs bg · voz · │
                    │ anexos · aprovações · perfis · login      │
                    └────────────────────────────────────────────┘
```

Rotas servidas (conforme README + código):

| Rota | Função | Código |
|---|---|---|
| `/pwa` | aba painel; acesso direto redireciona ao app | `dist/index.js:99-110` |
| `/api/plugins/hermes-pwa/` | app (HTML; redirect 307 sem barra final) | `plugin_api.py:95-102` |
| `…/manifest.webmanifest` | manifest dinâmico (`id/start_url/scope` = base) | `plugin_api.py:105-119` |
| `…/qr.svg` | QR SVG server-side (aba) | `plugin_api.py:122-138` |
| `…/api/*` | proxy gateway + `me/profiles/upload/approvals/stt` | `plugin_api.py:206-604` |
| `…/{app.js,app.css,sw.js,icons}` | estático com `Cache-Control: no-store` | `plugin_api.py:608-619` |

## 5. Fluxos de execução principais

**Boot do app** (`app.js:665-684`): `state.profile ← localStorage` → `GET api/me` (modelo) → `GET api/profiles` → `GET api/sessions?limit=80` → render; registra SW (`sw.js`, `scope: ./`); `visibilitychange` recarrega; polling lista a cada 30 s (só com chat fechado), mensagens a cada 12 s (só com chat aberto e sem streaming).

**Enviar mensagem** (`app.js:273-345`): bolha local imediata → `POST api/upload` (áudio/arquivo, base64) + transcrição local opcional → monta `message` (str ou partes OpenAI `text/image_url`) → `POST api/sessions/:id/runs {input, session_id}` → `savePendingRun(localStorage)` → `streamRun` SSE (`GET api/runs/:id/events`) → fallback `resumeRun` por polling de `GET api/runs/:id` (2,5 s visível / 8 s oculto, até 240 tentativas) → `finishRun` (limpa pending, atualiza preview, `loadMessages(true)`).

**Aprovação** (`app.js:233-264`, `plugin_api.py:419-433`): evento `approval.request` → card com `once/session/always/deny` → `POST api/runs/:id/approval {choice, request_id}` → proxy `POST /v1/runs/:id/approval`.

**Voz** (`app.js:543-573`): `MediaRecorder` (webm→mp4→ogg) → `File` anexado → auto-`send()` → upload + `POST /api/audio/transcribe` (dashboard core) → texto com blocos de áudio/transcrição; player reconstrói de `api/uploads/<nome>` (`parseUserText`, `app.js:170-189`).

**Sessões** (`app.js:96-133`): listar/filtrar/ordenar (fixados primeiro, depois `last_active`), busca local, nova (`POST sessions`), renomear (`PATCH`), apagar (`DELETE`), `/new <nome>` e `/reset` interceptados no cliente criando sessão nova em vez de enviar ao gateway (`app.js:279-288`).

**Perfis/agentes** (`app.js:638-663`, `plugin_api.py:155-181`): `GET api/profiles` via `hermes_cli.profiles.list_profiles()` + `profile.yaml:description`; `?profile=` → prefixo `/p/<perfil>` no gateway; sem `multiplex_profiles`, troca é bloqueada com toast.

## 6. Dependências declaradas × reais

Declaradas: nenhuma (`python_dependencies: []`). Reais (importadas, providas pelo host): `fastapi`, `pydantic`, `httpx` (tardio, `plugin_api.py:63,354`), `yaml` (tardio), `qrcode` (tardio, opcional), `hermes_cli.config`, `hermes_cli.profiles`, `hermes_cli.web_server_profiles`, `hermes_constants`. Cliente externo: `api.groq.com` (checagem de chave). Risco: `hermes plugins validate` pode passar sem o host, mas em runtime falta de `httpx/qrcode/yaml` ou mudança no `hermes_cli` quebra o plugin — sem pinagem possível pelo plugin (ver 04 e 06).

## 7. Divergências código × documentação

1. README "Tema claro e escuro automáticos" — confirmado, mas **só via `prefers-color-scheme`**; não há toggle (ver 03/07).
2. README "imagens não ficam no histórico" — confirmado pelo design: imagens vão como `data:` URL efêmera no `input` do run; reabertura mostra texto + marcador (limitação documentada corretamente).
3. README "transcrição usa provedor do perfil `default`" — o endpoint STT grava config global (`load/save_config` sem escopo de perfil), consistente com a afirmação.
4. `plugin.yaml:provides_hooks: []` × uso de `_config_profile_scope` — o plugin declara não prover hooks, mas **consome API interna privada** do host (detalhe no relatório 04).
