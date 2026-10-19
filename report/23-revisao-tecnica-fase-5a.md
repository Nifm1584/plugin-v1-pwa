# 23 — Revisão técnica da Fase 5A

## 1. Objetivo e método

Revisar integralmente as alterações da branch `feat/treg-pwa-fase-5a-p1` em relação ao commit-base `2701a28`, confrontando contratos, rotas, testes e compatibilidade com o Hermes Agent **v0.22.2**.

Esta revisão não alterou código, não instalou dependências globalmente, não acessou a VPS e não fez commit, push, merge, tag ou release.

## 2. Baseline revisado

| Item | Valor |
|---|---|
| Repositório | `Nifm1584/plugin-v1-pwa` |
| Branch | `feat/treg-pwa-fase-5a-p1` |
| Commit-base | `2701a28812792a834a90fc569a1fb3b175f1c7bd` |
| HEAD da branch | `2701a28812792a834a90fc569a1fb3b175f1c7bd` |
| Hermes de referência | `v0.22.2` (`d923a5eb487a17c0a68801bba9ef0f56c81040a8`) |
| Relatório de implementação | `report/22-implementacao-fase-5a-p1.md` |

A branch contém alterações não commitadas. O código não foi modificado durante esta revisão; foi apenas lido, comparado e testado.

## 3. Fontes oficiais consultadas

| Fonte | Uso |
|---|---|
| [API Server v0.22.2](https://github.com/NousResearch/hermes-agent/blob/v0.22.2/website/docs/user-guide/features/api-server.md) | Sessões, mensagens, runs, capabilities, stop e áudio |
| [api_server.py v0.22.2](https://github.com/NousResearch/hermes-agent/blob/v0.22.2/gateway/platforms/api_server.py) | Tabela de rotas, flags, listagem, `pinned` e `has_more` |
| [sessions.py v0.22.2](https://github.com/NousResearch/hermes-agent/blob/v0.22.2/hermes_cli/web_routers/sessions.py) | `GET /api/sessions/search` no dashboard e busca FTS |
| [audio.py v0.22.2](https://github.com/NousResearch/hermes-agent/blob/v0.22.2/hermes_cli/web_routers/audio.py) | `POST /api/audio/transcribe` |
| [Extending the Dashboard v0.22.2](https://github.com/NousResearch/hermes-agent/blob/v0.22.2/website/docs/user-guide/features/extending-the-dashboard.md) | Temas, plugins e separação dashboard/gateway |
| Context7 `/nousresearch/hermes-agent` | Contratos do API server, plugins e áudio |

## 4. Rotas confirmadas no Hermes v0.22.2

| Rota | Evidência no v0.22.2 | Situação no TREG |
|---|---|---|
| `GET /v1/capabilities` | Tabela de rotas e `_handle_capabilities` | Encaminhada pelo novo `/api/capabilities` |
| Flags `session_chat`, `session_chat_stream`, `run_status`, `run_events_sse`, `run_stop`, `run_approval_response` | `_STATIC_FEATURE_FLAGS` | Usadas ou disponíveis para detecção |
| `GET /api/sessions` com `limit`, `offset` e `has_more` | `_handle_list_sessions` | Usada pela paginação |
| `PATCH /api/sessions/{id}` com `pinned` | `_handle_patch_session` | Usada pelo menu de fixar |
| `GET /api/sessions/{id}` | Tabela de rotas | Nova rota do plugin; ainda sem uso na UI |
| `GET /api/sessions/search` | Router de dashboard, FTS5 | Usada diretamente pela camada de API no dashboard |
| `POST /v1/runs/{id}/stop` | Tabela de rotas e flag `run_stop` | Encaminhada pelo novo proxy do plugin |
| `POST /api/audio/transcribe` | Router de áudio do dashboard | Usada pela transcrição |
| `GET /api/uploads/{name}` | Rota existente do plugin | Usada pelos links de download |

Pontos importantes confirmados:

- `/api/sessions/search` é uma rota do **dashboard**, não do API server do gateway. A implementação atual chama a rota absoluta no mesmo host do dashboard, o que está alinhado com o v0.22.2.
- `pinned` existe no `PATCH` do gateway v0.22.2, embora a tabela resumida da documentação não detalhe todos os flags.
- `run_stop` é anunciado como capacidade e tem endpoint real.
- `audio_api: false` no gateway não invalida o `/api/audio/transcribe`, que é uma rota do dashboard.
- `GET /api/sessions` retorna `has_more`; o plugin repassa a resposta sem alterá-la.

## 5. Revisão dos pontos prioritários

### 5.1 Camada `hermes-api.js`

**Aprovado com ressalvas.**

- Centraliza URL base, credenciais, JSON, timeout, parsing e erros.
- O `app.js` não chama `fetch` diretamente; o teste estático confirma isso.
- O SSE também passa pela camada.
- Há normalização de sessões, resultados de busca e capacidades.
- A ausência de `/v1/capabilities` é tratada como desconhecida, não como falsa.
- Erros `auth`, `not_found`, `unsupported`, `conflict`, `timeout` e `network` são distintos.

Ressalvas:

- `api.transcribe` não envia `profile`; em uma instalação multiplexada, a transcrição pode usar a configuração STT do perfil default em vez do agente selecionado. A rota oficial aceita `profile`.
- `api.upload` também não envia `profile`; o diretório `~/uploads` é resolvido no processo do dashboard, não necessariamente no perfil do agente selecionado.
- Essas duas falhas afetam principalmente o uso multi-perfil; o perfil default não é afetado.

### 5.2 Busca, paginação, fixação, stop, transcrição e download

**Busca:** implementada contra `/api/sessions/search`, com fallback local, debounce, controle de resposta antiga e abertura do resultado. A rota foi confirmada no dashboard v0.22.2.

**Paginação:** usa `offset`, `has_more` e mesclagem por ID. O scroll é preservado. Não foi testada contra um banco grande real.

**Fixação:** usa `PATCH` com `pinned`, confirmado no gateway v0.22.2. A ação some se `session_update` estiver explicitamente indisponível e mostra erro sem alteração otimista.

**Stop:** usa `POST /api/runs/{id}/stop` via proxy novo. O botão só aparece para a execução da conversa aberta e se a capacidade não estiver explicitamente desligada.

**Transcrição:** usa `/api/audio/transcribe`, confirmado no dashboard v0.22.2. O timeout é de 180 s; falha de transcrição mantém o áudio sem texto. Falta o `profile` descrito em 5.1.

**Download:** o histórico converte arquivos em links `api/uploads/<nome>` servidos pela rota existente. Não há prévia falsa de PDF. Não foi testado com arquivo removido do disco.

### 5.3 Compatibilidade futura

**Aprovado com ressalvas.**

- Capabilities são detectáveis.
- Respostas antigas em array e envelopes `data/sessions` são toleradas.
- Campos ausentes não quebram a normalização.
- Busca tem fallback local.
- Stop/pin podem ser ocultados quando a capacidade é explicitamente falsa.
- O código não depende da string de versão.
- Há testes para gateway sem capabilities e para autenticação.

Ressalvas:

- O fallback de `has_more` por tamanho da página pode mostrar uma página extra quando o servidor não retorna o campo; é conservador, não incorreto.
- A busca depende de uma rota do dashboard e não do gateway; isso está correto para o v0.22.2, mas precisa ser revalidado se a arquitetura do dashboard mudar.
- A transcrição e o upload multi-perfil precisam de validação específica.

### 5.4 Regressões no chat, streaming, anexos, aprovações, retomada, autenticação e PWA

Não foram encontradas regressões bloqueadoras por leitura estática:

- o fluxo de runs e SSE foi mantido;
- `runEvents` e `getRun` passaram para a camada de API;
- aprovações usam o mesmo endpoint, com proteção adicional contra duplicidade;
- a retomada por `localStorage` e `visibilitychange` continua;
- imagens e arquivos preservam os limites anteriores;
- o login usa a mesma rota `/auth/password-login`;
- o service worker foi versionado para `treg-pwa-v2` e inclui o novo arquivo.

Ressalvas de regressão/uso:

- O botão de stop não é exibido para uma execução pertencente a outra conversa, o que é intencional, mas o run continua em segundo plano.
- Abrir uma conversa encontrada pela busca não a insere imediatamente em `state.sessions`; o envio de uma mensagem nessa conversa pode não atualizar a prévia da sidebar até o próximo carregamento.
- O streaming continua atualizando o DOM da conversa mesmo se a pessoa voltar para a lista; o comportamento é herdado do app anterior, não introduzido por esta fase, mas deve ser validado em uso real.

### 5.5 Service worker e cache

**Aprovado.**

- `VERSION` passou de `treg-pwa-v1` para `treg-pwa-v2`.
- `hermes-api.js` entrou em `SHELL`.
- O activate remove caches antigos.
- `index.html` e os estáticos são servidos com `no-store`.
- O SW não intercepta `/api/sessions/search` nem `/api/audio/transcribe`, pois estão fora do prefixo do plugin.

Não foi validada a atualização em um PWA já instalado em celular real.

### 5.6 Testes e CI

Os testes Node existentes passam:

```text
PASS hermes-api: paginação, busca, pin, stop, SSE, capabilities e auth
PASS ui-contract: shell, menu, API layer e service worker
PASS QR 3/3
```

Os testes Python passam quando executados diretamente no ambiente local com as dependências do Hermes:

```text
PASS test_manifests
PASS test_register_command
PASS test_capabilities_tolerates_old_gateway
PASS test_hermes_api_is_served_as_static
PASS test_stop_run_proxies_to_gateway
PASS test_stop_run_rejects_invalid_id
```

`python -m py_compile` e `node --check` passaram.

## 6. Problemas encontrados

### 6.1 Bloqueador — CI não instala as dependências do teste backend

**Classificação: BLOQUEADOR de CI, não de execução local.**

O workflow instala apenas:

```text
python -m pip install --disable-pip-version-check pytest pyyaml
```

Mas `tests/test_plugin_api.py` importa `fastapi` no topo:

```python
from fastapi import HTTPException
```

E `dashboard/plugin_api.py` também importa FastAPI/Pydantic. Em um ambiente limpo com apenas `pytest` e `pyyaml`, a coleta falha antes de qualquer teste:

```text
ERROR collecting tests/test_plugin_api.py
tests/test_plugin_api.py:7: from fastapi import HTTPException
E   ModuleNotFoundError: No module named 'fastapi'
!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!
```

**Consequência:** o CI atual não consegue executar a suíte Python completa; o teste novo bloqueia a coleta.

**Correção necessária:** instalar `fastapi`/`pydantic` no job de testes, mover o teste para um job que tenha as dependências do Hermes, ou marcar o teste para skip quando `fastapi` não estiver disponível. Nenhuma correção foi aplicada nesta revisão.

### 6.2 Problema menor — transcrição sem `profile`

`api.transcribe` chama `/api/audio/transcribe` sem `profile`. Em multi-perfil, a transcrição pode usar o perfil default. A rota v0.22.2 aceita `profile`.

### 6.3 Problema menor — upload sem `profile`

`api.upload` usa a rota do plugin e `~/uploads` resolvido no processo do dashboard, sem escopo explícito do perfil selecionado. O comportamento pode falhar em agentes secundários. É uma limitação herdada, mas relevante para a Fase 5A.

### 6.4 Problema menor — busca não atualiza a lista carregada

Ao abrir um resultado de busca, a conversa não é adicionada a `state.sessions`. Enviar uma mensagem nela não atualiza a prévia da sidebar até um `loadSessions` posterior.

### 6.5 Problema menor — cobertura de testes

Não há teste automatizado para:

- `GET /api/sessions/{id}`;
- download de arquivo real;
- aprovação real;
- transcrição real;
- interação de UI em navegador;
- atualização de PWA instalado;
- comportamento em banco grande.

Os testes existentes usam mocks para os contratos HTTP; não comprovam o Hermes vivo.

### 6.6 Problema menor — CI não cobre a branch

O workflow só dispara em `fix/treg-pwa-c3-publicacao-segura`, `fix/treg-pwa-c7-qrcode-fix` e PRs para `main`. O push desta branch `feat/...` não dispara CI. O PR para `main` dispararia, mas o PR também encontraria o bloqueador 6.1.

## 7. Rotas confirmadas × implementação

| Contrato | v0.22.2 | Implementação | Resultado |
|---|---|---|---|
| `GET /api/sessions` + `has_more` | Confirmado | Proxy existente + paginação nova | OK estático |
| `PATCH /api/sessions/{id}` + `pinned` | Confirmado | Proxy existente + menu | OK estático |
| `GET /api/sessions/{id}` | Confirmado | Rota nova no plugin | OK, sem uso/teste |
| `GET /api/sessions/search` | Dashboard confirmado | Chamada absoluta no app | OK estático; não live |
| `POST /v1/runs/{id}/stop` | Confirmado | Rota nova no plugin + botão | OK estático; não live |
| `POST /api/audio/transcribe` | Dashboard confirmado | Camada + timeout + fallback | OK; falta profile |
| `GET /api/uploads/{name}` | Rota do plugin | Link real no histórico | OK estático; não live |
| `/v1/capabilities` | Confirmado | Proxy + normalização | OK estático |

## 8. Veredito

A implementação está **estruturalmente consistente** com o v0.22.2 e não foram encontrados bloqueadores de runtime por leitura estática. A busca, paginação, pin, stop, transcrição e download estão conectados a contratos confirmados.

Porém, **não está pronta para publicação/merge** enquanto o CI não conseguir coletar a suíte Python. O bloqueador 6.1 é reproduzível e impede a validação automatizada completa.

Também não há validação integrada com um Hermes vivo; todos os testes de contrato usaram mocks. Nenhuma função deve ser declarada validada em produção.

## 9. Próxima ação

Corrigir o bloqueador de CI 6.1 — garantir que o job Python instale `fastapi`/`pydantic` (ou que o teste seja condicional) — e rodar novamente a suíte completa antes de preparar a validação integrada.
