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
| 3 | [03-auditoria-interface-mobile.md](03-auditoria-interface-mobile.md) | Frontend mobile, legibilidade, primeira conversa, propostas visuais |
| 4 | [04-integracao-hermes-api.md](04-integracao-hermes-api.md) | APIs/hooks/eventos do Hermes, tabela de classificação, compatibilidade |
| 5 | [05-seguranca-e-privacidade.md](05-seguranca-e-privacidade.md) | Riscos estáticos: auth, XSS, upload, cache, segredos |
| 6 | [06-qualidade-e-testes.md](06-qualidade-e-testes.md) | Qualidade, desempenho, manutenção, testes existentes |
| 7 | [07-plano-de-evolucao.md](07-plano-de-evolucao.md) | Plano faseado (interface, avatares, menus, temas) com matriz por melhoria |
| 8 | [08-github-e-distribuicao.md](08-github-e-distribuicao.md) | Cópia independente: nomes, rotas, licença, conflitos |
| 9 | [09-evidencias-e-pendencias.md](09-evidencias-e-pendencias.md) | Arquivos analisados, evidências, lacunas, hipóteses, pendências de execução |

### Documentos e capturas adicionais desta branch

| Arquivo | Conteúdo |
|---|---|
| [38-validacao-versao-estavel.md](38-validacao-versao-estavel.md) | Validação funcional no computador e celular, coexistência com hermes-pwa, SHA congelado e limitação conhecida de imagens |
| [39-congelamento-oficial-tag-release.md](39-congelamento-oficial-tag-release.md) | Congelamento oficial da 1.8.0b1, tag, Release e branch da quarta atualização |
| [39-auditoria-multimidia.md](39-auditoria-multimidia.md) | Auditoria operacional do Hermes sobre persistência de imagens, rotas de mídia e saída de áudio/vídeo/arquivos; base técnica para a implementação multimídia |
| [40-correcoes-multimidia.md](40-correcoes-multimidia.md) | Implementação de imagens persistentes e renderização de imagens, áudio, vídeo e documentos de saída do Hermes |

| Arquivo | Conteúdo |
|---|---|
| [10-validacao-versao-estavel-c7.md](10-validacao-versao-estavel-c7.md) | Tag, Release, CI e validação da versão estável C7 |
| [13-fase-c4-auditoria-publicacao-e-vps.md](13-fase-c4-auditoria-publicacao-e-vps.md) | Auditoria da publicação e do impacto na VPS |
| [16-fase-c7-conferencia-exata-local-github.md](16-fase-c7-conferencia-exata-local-github.md) | Conferência local × GitHub da fase C7 |
| [17-levantamento-visual-treg-pwa.md](17-levantamento-visual-treg-pwa.md) | Levantamento visual inicial e referências consultadas |
| [18-auditoria-visual-funcional-treg-pwa.md](18-auditoria-visual-funcional-treg-pwa.md) | Auditoria funcional, limitação do Browser MCP e prints manuais do TREG |
| [19-analise-prints-whatsapp.md](19-analise-prints-whatsapp.md) | Análise dos três prints manuais do WhatsApp e matriz de compatibilidade |
| [20-inventario-final-sincronizacao.md](20-inventario-final-sincronizacao.md) | Inventário final local × GitHub, pendências e estado de preservação |
| [21-plano-funcional-visual-treg-pwa.md](21-plano-funcional-visual-treg-pwa.md) | Plano funcional/visual com matriz de compatibilidade e prioridades P1/P2/P3 |
| [22-implementacao-fase-5a-p1.md](22-implementacao-fase-5a-p1.md) | Implementação P1, testes, limitações e compatibilidade futura |
| [23-revisao-tecnica-fase-5a.md](23-revisao-tecnica-fase-5a.md) | Revisão técnica, bloqueador de CI, rotas confirmadas e testes |
| [24-correcao-bloqueador-b1-ci.md](24-correcao-bloqueador-b1-ci.md) | Correção do B1 de CI, dependências Python e resultados em ambiente limpo |
| [25-correcao-url-base-pwa.md](25-correcao-url-base-pwa.md) | Correção da URL base das chamadas do plugin e testes de caminhos |
| [26-implementacao-fase-5b-visual.md](26-implementacao-fase-5b-visual.md) | Identidade 1.8.0b1, cópia, temas, datas, avatares e testes visuais |
| [37-isolamento-cache-service-worker.md](37-isolamento-cache-service-worker.md) | Correção preventiva do isolamento de caches do service worker |
| [prints-aplicativo-treg-pwa/README.md](prints-aplicativo-treg-pwa/README.md) | Relação das capturas do TREG PWA |

> **Privacidade:** as três capturas manuais do WhatsApp analisadas no relatório 19 não foram publicadas por conterem nomes, telefone e conteúdo de conversas privadas. Elas permanecem no workspace local.

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
