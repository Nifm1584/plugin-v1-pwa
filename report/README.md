# Auditoria do plugin hermes-pwa — Índice e resumo executivo

**Projeto:** `hermes-pwa` v1.7.1 (AstraOnlineWeb, MIT), em `hermes-pwa/`
**Data da auditoria:** 2026-10-15 (somente leitura de código local + READMEs do monorepo)
**Escopo:** auditoria estática, sem executar o Hermes, sem modificar código, sem instalar dependências, sem acesso a VPS/GitHub.
**Pasta dos relatórios:** `hermes-pwa/report/` (esta pasta; única alteração permitida nesta fase).

## Documentos

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 1 | [01-arquitetura-e-funcionamento.md](01-arquitetura-e-funcionamento.md) | Arquitetura, tecnologias, estrutura, fluxos, mapa de componentes |
| 2 | [02-inventario-de-funcionalidades.md](02-inventario-de-funcionalidades.md) | Funcionalidades por estado (confirmada/parcial/documentada/não encontrada) |
| 3 | [03-auditoria-interface-mobile.md](03-auditoria-interface-mobile.md) | Frontend, responsividade, legibilidade, primeira conversa e propostas visuais |
| 4 | [04-integracao-hermes-api.md](04-integracao-hermes-api.md) | APIs, hooks, eventos, autenticação, sessões e compatibilidade |
| 5 | [05-seguranca-e-privacidade.md](05-seguranca-e-privacidade.md) | Riscos, armazenamento, comunicação, cache e dependências |
| 6 | [06-qualidade-e-testes.md](06-qualidade-e-testes.md) | Qualidade do código, desempenho, testes e validação |
| 7 | [07-plano-de-evolucao.md](07-plano-de-evolucao.md) | Plano faseado de melhorias, incluindo interface, avatares, menus e temas |
| 8 | [08-github-e-distribuicao.md](08-github-e-distribuicao.md) | Cópia independente, nomenclatura, licença, instalação e riscos de conflito |
| 9 | [09-evidencias-e-pendencias.md](09-evidencias-e-pendencias.md) | Arquivos analisados, evidências, lacunas, hipóteses e pendências |

## Resumo executivo

O `hermes-pwa` é um **plugin de dashboard (kind: standalone)** que entrega um chat móvel estilo mensageiro como **PWA servido pelo próprio painel do Hermes**, atrás do login do dashboard. O navegador nunca recebe a `API_SERVER_KEY`; um backend FastAPI (`dashboard/plugin_api.py`, montado em `/api/plugins/hermes-pwa/`) faz proxy autenticado para o **API server do gateway** (porta 8642: sessões, mensagens, `POST /api/sessions/:id/chat/stream`, `POST /v1/runs`, `GET /v1/runs/:id/events`, aprovações). O frontend é **JavaScript puro sem build** (`dashboard/pwa/app.js` ~685 linhas, `app.css`, `index.html`, `sw.js`) + uma **aba do painel em React via SDK** (`dashboard/dist/index.js`, `style.css`, `qrcode.js` vendored MIT) + um **comando de chat `/pwa`** (`__init__.py`).

**Arquitetura em uma frase:** thin-backend proxy + SPA vanilla com SSE/polling + service worker network-first + aba React para instalação/QR/STT.

**Pontos fortes confirmados no código:**
- Chave do gateway isolada no servidor (`_api_key()` lê env ou `.env` via `hermes_cli.config`; nunca exposta ao cliente).
- Streaming resiliente via `/v1/runs` com retomada (`localStorage hermes-pwa-run`, polling de status, `visibilitychange`) — resposta continua em segundo plano.
- Sanitização consistente: `esc()` + markdown-lite com escape prévio no cliente; `re.sub` + regex de nome + `FileResponse` sem subpastas no servidor; `data_url` validada + limite 25 MB.
- PWA correto: manifest dinâmico com `start_url/scope` sob o prefixo do plugin, `sw.js` com `no-store` em API e limpeza de caches antigos (`hermes-pwa-v12`).
- Baixo acoplamento declarativo: `plugin.yaml` sem `python_dependencies`, sem `provides_tools/hooks`.

**Riscos/limitações principais (detalhes nos relatórios 04/05/06):**
1. **Dependência interna privada** `hermes_cli.web_server_profiles._config_profile_scope` (plugin_api.py ~L455) para salvar `approvals.mode` por perfil — P1, quebra sem aviso em update do Hermes.
2. **Contratos não confirmados localmente:** rotas do gateway (`/api/sessions`, `/v1/runs`, SSE), `/api/audio/transcribe`, `/auth/password-login`, SDK `window.__HERMES_PLUGIN_SDK__` — todo o núcleo Hermes estava ausente do workspace; classificados como "exige validação em execução".
3. **Sem sistema de temas do Hermes identificado:** tema atual é só `prefers-color-scheme` + variáveis CSS locais; sem toggle manual, sem persistência, com risco de flash/mismatch (P2).
4. **Mobile com débito de legibilidade:** prévias 13 px, metadados 11 px, horários 10 px; avatares só com letra inicial; primeira conversa com hipótese de divergência não provada (P2, ver relatório 03).
5. **Cobertura de testes mínima:** 2 testes (`tests/test_plugin.py`) só checam manifestos e registro do comando; nenhum teste de `plugin_api.py`, frontend ou regressão de update (P2).

## Escopo e limitações desta auditoria

- **Lido integralmente:** `README.md`, `plugin.yaml`, `__init__.py`, `dashboard/manifest.json`, `dashboard/plugin_api.py` (619 linhas), `dashboard/pwa/{index.html,app.js,app.css,sw.js,icon.svg}`, `dashboard/dist/{index.js,style.css}`, `tests/test_plugin.py`, `README.md` do monorepo. `qrcode.js` lido parcialmente (cabeçalho MIT + uso em `dist/index.js`).
- **Não disponível localmente:** código do Hermes Agent (gateway, dashboard, `hermes_cli`, `hermes_constants`), documentação oficial de plugin SDK/API. Todas as afirmações sobre o núcleo são **inferências a partir do uso observado no plugin**, marcadas como tal.
- **Não executado:** sem `pytest`, sem `hermes plugins validate`, sem navegador, sem `print/` com capturas (pasta ausente — análise mobile é estática).
- **Sem segredos nos relatórios:** nenhum token/senha/chave copiado; caminhos de upload citados de forma genérica.
- **Nenhum arquivo original modificado:** a única escrita foi `report/*.md`.

## Como ler os relatórios

- Prioridades: **P0** crítico · **P1** alto · **P2** médio · **P3** baixo (justificativa em cada item).
- Estados de funcionalidade: **confirmada** (código lido) · **parcial** · **documentada** (só README) · **não encontrada**.
- Classificação Hermes (relatório 04): **pública documentada / observada sem contrato / não identificada / exige validação**.
- Hipóteses (ex.: primeira conversa) estão separadas de fatos e listam como reproduzir/validar.
