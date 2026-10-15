# 09 — Evidências, lacunas, hipóteses e pendências

## 1. Arquivos analisados (todos lidos integralmente, salvo nota)

| Arquivo | Linhas aprox. | Papel na conclusão |
|---|---|---|
| `hermes-pwa/README.md` | 142 | Capacidades declaradas, rotas, env, limitações (confrontado com código em 01/02) |
| `hermes-pwa/plugin.yaml` | 15 | Nome 1.7.1, MIT, standalone, sem tools/hooks/deps |
| `hermes-pwa/__init__.py` | 38 | Comando `/pwa`, `pwa_url()` (env + `load_config_readonly`) |
| `dashboard/manifest.json` | 11 | Aba `/pwa`, `entry/css/api` |
| `dashboard/plugin_api.py` | 619 | Proxy gateway, upload, runs/SSE, approvals, STT, manifest/QR/estático |
| `dashboard/pwa/index.html` | 114 | Shell, composer, sheets, login, modal |
| `dashboard/pwa/app.js` | 685 | Toda a lógica do app (sessões, chat, runs, voz, perfis) |
| `dashboard/pwa/app.css` | 175 | Tema `prefers-color-scheme`, layout, débitos de fonte |
| `dashboard/pwa/sw.js` | 32 | `hermes-pwa-v12`, network-first, sem cache de API |
| `dashboard/pwa/icon.svg` | 1 | Marca atual (balão + 3 pontos) |
| `dashboard/dist/index.js` | 156 | Aba React (SDK, QR, STT, redirect `/pwa`→app) |
| `dashboard/dist/style.css` | 18 | Estilos `hp-` da aba |
| `dashboard/dist/qrcode.js` | ~2297 (só cabeçalho + uso) | QR client-side MIT |
| `tests/test_plugin.py` | 22 | 2 testes de contrato estático |
| `../README.md` (monorepo) | 91 | Instalação Docker/volume, 3 plugins, Hermes ≥ v0.21 |
| `../.gitignore`, `LICENSE` (repo) | — | `.env` ignorado; MIT |

Binários `icon-192/512.png` não inspecionados pixel a pixel (existência confirmada pelo teste).

## 2. Evidências por afirmação central

- Proxy com chave isolada: `plugin_api.py:45-66,318-366`.
- Runs com retomada: `app.js:347-467` + `plugin_api.py:335-366`.
- Markdown com escape: `app.js:24-42`.
- Upload sanitizado 25 MB: `plugin_api.py:266-291`; download sem subpastas: `294-307`.
- Tema só-automático: `app.css:1-13` (nenhum `data-theme`, nenhum `localStorage` de tema).
- Avatares-letra: `app.js:18-19`, `app.css:40-42`.
- Fontes pequenas: `app.css:45-47,60`.
- Dependência privada: `plugin_api.py:449-459` (`_config_profile_scope`).
- Contratos externos sem definição local: `/v1/runs`, `/api/sessions`, `/api/audio/transcribe`, `/auth/password-login`, `__HERMES_PLUGIN_SDK__` (usos citados em 04; definição ausente do workspace).

## 3. Lacunas (não confirmáveis sem o Hermes)

1. Schemas/envelopes do gateway (versões, paginação, erros, eventos SSE além dos tratados).
2. Semântica `multiplex_profiles` e `/p/:perfil` (só README + `_pfx`).
3. Ciclo de vida da sessão dashboard (12 h/30 d), cookies, CSRF.
4. SDK da aba (`components`, `fetchJSON`, `hooks`, mount `/dashboard-plugins/`).
5. `approvals.mode smart` (o que o "modelo auxiliar" avalia).
6. Transcrição (`/api/audio/transcribe`: formatos, limites, idioma).
7. Requisitos de versão (README do monorepo pede Hermes ≥ v0.21; sem matriz por recurso).

## 4. Hipóteses (primeira conversa — ver 03 §2.5)

- **H1 (mais forte):** bolha local crua × reconcile pós-`loadMessages`. Validar: inspecionar `innerHTML` antes/depois do reload na 1ª vs 2ª conversa.
- **H2:** sessão nova sem `model/preview` → subtítulo/título provisório.
- **H3:** `100dvh`/teclado/`scrollBottom` sem `rAF` no primeiro foco.
- **H4:** race `loadMessages` × `resumePendingRun` em sessão vazia.
- Nenhuma declarada definitiva. Pasta `print/` com capturas inexiste — auditoria complementar possível quando fornecida.

## 5. Pendências que exigem execução

- `python -m pytest tests -q`, `hermes plugins validate .`, boot real com gateway + dashboard HTTPS.
- Matriz de fumaça e testes manuais (06 §4) + checagem Axe/Lighthouse + `100dvh`/teclado em iOS/Android.
- Confirmar `hermes_cli.web_server_profiles._config_profile_scope` na versão instalada e buscar alternativa pública.
- Medir `md()` por delta em resposta longa e RAM de upload 25 MB em aparelho real.

## 6. Limitações desta auditoria

Estática, sem Hermes local, sem navegador, sem capturas, `qrcode.js`/PNGs parcialmente inspecionados, sem varredura de segredos além de leitura (nada encontrado no código lido), sem execução de testes.
