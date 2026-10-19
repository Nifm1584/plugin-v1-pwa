# 22 — Implementação da Fase 5A (P1)

## 1. Objetivo e escopo

Implementar a primeira rodada P1 aprovada no relatório 21, preservando a estrutura existente do TREG PWA e sem reescrever o plugin.

Esta execução:

- criou uma branch de implementação a partir do baseline `2701a28`;
- manteve o relatório 21 intacto;
- não alterou `main`, C7, tag ou Release;
- não acessou a VPS, não instalou o plugin e não fez deploy;
- não fez commit, push ou merge;
- não publicou prints privados do WhatsApp.

## 2. Baseline da implementação

| Item | Valor |
|---|---|
| Repositório | `Nifm1584/plugin-v1-pwa` |
| Branch | `feat/treg-pwa-fase-5a-p1` |
| Commit-base | `2701a28812792a834a90fc569a1fb3b175f1c7bd` |
| Clone | `C:\Users\NILTON~1\AppData\Local\Temp\opencode\plugin-v1-pwa-fase5` |
| Hermes de referência | v0.22.2 |
| Relatório de especificação | `report/21-plano-funcional-visual-treg-pwa.md` |

## 3. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/hermes-api.js` | Nova camada de contratos e capacidades do Hermes |
| `dashboard/pwa/app.js` | Busca, paginação, fixação, estados, anexos, áudio, stop e reconexão |
| `dashboard/pwa/index.html` | Elementos de status, skeleton, paginação, stop, cancelamento de áudio e acessibilidade |
| `dashboard/pwa/app.css` | Estados, skeleton, banner offline, arquivos, stop e ajustes responsivos |
| `dashboard/pwa/sw.js` | Cache da nova camada (`treg-pwa-v2`) |
| `dashboard/plugin_api.py` | Rotas de capacidades, sessão individual e parada de execução |
| `tests/test_plugin.py` | Verificação do novo arquivo estático |
| `tests/test_plugin_api.py` | Testes das rotas de capacidades, stop e estático |
| `tests/hermes-api.test.js` | Testes da camada de API, paginação, busca, pin, SSE e erros |
| `tests/ui-contract.test.js` | Testes estáticos do shell e da integração |
| `tests/package.json` | Scripts `test:api` e `test:ui` |
| `.github/workflows/treg-pwa-validation.yml` | Checagens e testes novos no CI |
| `report/README.md` | Índice dos relatórios 21 e 22 |
| `report/22-implementacao-fase-5a-p1.md` | Este relatório |

## 4. O que foi implementado

### 4.1 Camada de compatibilidade

Criado `dashboard/pwa/hermes-api.js` com:

- criação centralizada de URLs, JSON, credenciais e timeout;
- erros tipados (`auth`, `not_found`, `unsupported`, `conflict`, `gateway_unavailable`, `timeout`, `network`);
- métodos para sessões, mensagens, criação, patch, exclusão, busca, runs, SSE, aprovação, upload, transcrição e login;
- normalização de campos e descarte de propriedades adicionais;
- suporte a respostas antigas em array e em `{data|sessions}`;
- detecção tolerante de `/v1/capabilities`: se o gateway antigo não expõe a rota, as capacidades ficam desconhecidas em vez de serem tratadas como falsas;
- `feature()` para decidir se uma ação opcional pode aparecer;
- teste específico para gateway sem capacidades.

O restante do app deixou de chamar `fetch` diretamente. O SSE também passou pela camada (`runEvents`).

### 4.2 Backend do plugin

Adicionadas três rotas:

| Rota | Função |
|---|---|
| `GET /api/capabilities` | Encapsula `/v1/capabilities` e devolve `gateway: null` quando a versão antiga não tem a rota |
| `GET /api/sessions/{id}` | Leitura de uma sessão para integração e resultados de busca |
| `POST /api/runs/{id}/stop` | Proxy real para `POST /v1/runs/{id}/stop` |

`hermes-api.js` também foi incluído em `_STATIC` e no cache do service worker.

### 4.3 Busca completa do histórico

- Busca remota via `GET /api/sessions/search?q=...&profile=...`.
- Debounce de 350 ms e cancelamento lógico por sequência para impedir resposta antiga de sobrescrever busca nova.
- Resultado normalizado com `session_id`, título, trecho, origem e atividade.
- Clique no resultado abre a conversa correspondente usando o mesmo fluxo de mensagens.
- Resultados são deduplicados por ID.
- Se a rota não existir, retornar 404/405 ou falhar, a busca cai para os dados já carregados e informa a limitação.
- Busca local continua funcionando para 0–1 caractere e como fallback.

### 4.4 Paginação

- Estado explícito de `offset`, `has_more`, carregamento e erro.
- Botão “Carregar mais” usa o próximo offset.
- Sessões mescladas por ID, sem duplicatas.
- Scroll da lista preservado durante a renderização.
- `has_more` é lido da resposta; respostas antigas sem o campo recebem fallback conservador pelo tamanho da página.
- Histórico já carregado não é substituído ao paginar.

### 4.5 Fixar e desafixar

- Ação adicionada ao menu da conversa.
- Usa `PATCH /api/sessions/{id}` com `{pinned: true|false}`.
- Atualiza o item local, a ordenação e a persistência no servidor.
- A ação é ocultada quando a capacidade `session_update` está explicitamente desligada.
- Erros são exibidos sem alterar o item.

### 4.6 Estados, erros e reconexão

- Skeleton de lista durante carregamento.
- Status de lista para busca, erro e retry.
- Status de chat para carregamento, erro e conversa vazia.
- Banner fixo para offline.
- Ao voltar a conexão, lista ou mensagens são recarregadas.
- Erros de lista e mensagens têm botão “Tentar novamente”.
- A mensagem e os anexos são restaurados quando o envio falha antes de criar a execução.

### 4.7 Composer, imagens, arquivos e PDF

- Imagens continuam com limite de 6, compressão, colar e arrastar.
- Arquivos continuam indo para `~/uploads`, com limite de 25 MB.
- Arquivos no histórico agora são links reais de download servidos pela rota `api/uploads/<nome>`.
- Não foi criada prévia de PDF; o cartão oferece nome, tamanho e download real.
- O texto digitado e os anexos são preservados em falhas de envio.

### 4.8 Áudio e transcrição

- Gravação mantém o limite de 5 minutos.
- Novo botão “Cancelar” descarta a gravação sem anexar.
- Transcrição usa `/api/audio/transcribe` com timeout de 180 s.
- Se a transcrição falhar ou não estiver configurada, o áudio continua sendo enviado e o chat mostra “sem transcrição”.
- Player continua usando o arquivo de `~/uploads` após recarregar.
- O pedido de transcrição não bloqueia permanentemente o envio.

### 4.9 Aprovações, stop e retomada

- Aprovações usam a camada de API e mantêm `once/session/always/deny`.
- Pedidos duplicados do mesmo `request_id` são ignorados.
- Botão real de parar execução aparece somente quando há run ativo da conversa aberta.
- `POST /api/runs/{id}/stop` é chamado via proxy; se o Hermes não oferecer o recurso, o botão é ocultado após a resposta.
- Retomada em segundo plano continua usando `/v1/runs`, polling e `visibilitychange`.
- O botão de stop não aparece em outra conversa enquanto a execução pertence à anterior.

### 4.10 Responsividade e teclado

- `visualViewport` atualiza a altura efetiva do app quando o teclado abre.
- O composer e a última bolha permanecem visíveis ao focar o campo.
- Scroll do chat não salta para o final quando a pessoa está lendo mensagens antigas.
- Lista e chat mantêm o layout de uma coluna no celular e duas colunas a partir de 900 px.
- `safe-area-inset` continua aplicado no topo e no compositor.

## 5. Testes executados

### 5.1 Sintaxe

```text
node --check dashboard/pwa/app.js
node --check dashboard/pwa/hermes-api.js
node --check dashboard/pwa/sw.js
node --check tests/hermes-api.test.js
node --check tests/ui-contract.test.js
node --check tests/qrcode.test.js
```

Resultado: todos passaram.

### 5.2 Testes Node

```text
npm.cmd run test:api
npm.cmd run test:ui
npm.cmd run test:qrcode
```

Resultados:

- API: passou — paginação, mesclagem, busca, fallback 404, pin, create run, stop, SSE, capabilities e auth.
- UI contract: passou — shell, menu, ordem dos scripts, service worker e ausência de `fetch` direto no `app.js`.
- QR: 3/3 casos passaram.

### 5.3 Testes Python

O interpretador local não tem `pytest` instalado:

```text
python -m pytest tests -q
No module named pytest
```

Os mesmos testes foram executados importando os módulos e chamando as funções diretamente:

```text
PASS test_manifests
PASS test_register_command
PASS test_capabilities_tolerates_old_gateway
PASS test_hermes_api_is_served_as_static
PASS test_stop_run_proxies_to_gateway
PASS test_stop_run_rejects_invalid_id
```

Também passou:

```text
python -m py_compile dashboard/plugin_api.py __init__.py
```

O CI continua configurado para executar `pytest` no ambiente de integração.

## 6. O que foi validado e o que não foi

### Validado com testes automatizados/mocks

- contratos HTTP da camada de API;
- paginação e deduplicação;
- busca e fallback;
- pin e stop;
- capacidades ausentes/antigas;
- autenticação;
- rotas backend com proxy mockado;
- shell e arquivos estáticos;
- QR Codes.

### Não validado no ambiente real

- execução contra um Hermes v0.22.2 vivo;
- latência e autorização real de `/api/sessions/search`;
- persistência real de `pinned` e `run_stop`;
- transcrição real com Groq/local;
- comportamento em navegador móvel real;
- teclado físico/visualViewport em iOS/Android;
- upload de 25 MB em dispositivo antigo;
- instalação/atualização do PWA no celular.

Nenhuma dessas funções deve ser declarada “validadas em produção” nesta fase.

## 7. Compatibilidade com versões futuras

A implementação usa o v0.22.2 como baseline, mas evita acoplamento à string de versão:

1. capacidades são lidas de `/v1/capabilities`;
2. ausência da rota não desliga recursos centrais;
3. campos desconhecidos são preservados/ignorados de forma tolerante;
4. respostas em formatos antigos e novos são normalizadas;
5. busca tem fallback local;
6. stop e pin podem ser ocultados quando a capacidade for explicitamente falsa;
7. erros HTTP são convertidos em códigos estáveis;
8. a camada de API é o único ponto de acesso aos contratos do gateway;
9. testes cobrem gateway sem capacidades e autenticação.

### Checklist para validar uma nova versão estável

1. Confirmar `/v1/capabilities` e as flags `session_chat`, `session_chat_stream`, `run_status`, `run_events_sse`, `run_stop` e `run_approval_response`.
2. Confirmar `GET /api/sessions` com `limit/offset/has_more`.
3. Confirmar `PATCH /api/sessions/{id}` com `pinned`.
4. Confirmar `POST /v1/runs/{id}/stop`.
5. Confirmar `GET /api/sessions/search` no dashboard e o escopo por perfil.
6. Confirmar `/api/audio/transcribe` e o provedor STT configurado.
7. Rodar `npm.cmd run test:api`, `test:ui` e `test:qrcode`.
8. Rodar `python -m pytest tests -q` em ambiente com pytest instalado.
9. Testar em celular real: teclado, anexo, áudio, busca, paginação, pin e stop.

## 8. Pendências reais

- Validar os contratos em um Hermes real, sem VPS e sem produção.
- Executar os testes Python via pytest no CI ou em ambiente com pytest.
- Testar a busca FTS em base grande e com perfil secundário.
- Testar o botão de stop com run em andamento e conexão instável.
- Testar download de arquivos antigos e arquivos removidos de `~/uploads`.
- Testar áudio real com microfone, permissão negada e transcrição indisponível.
- Validar iOS/Android com teclado aberto e PWA instalado.
- Não implementar ainda: arquivamento com restauração, não lidas, recibos, reações, chamadas e status.

## 9. Estado final

- Branch: `feat/treg-pwa-fase-5a-p1`
- Commit-base: `2701a28812792a834a90fc569a1fb3b175f1c7bd`
- Nenhum commit, push, merge ou deploy.
- `main`, C7, tag e Release intactos.
- Relatório 21 preservado sem alteração.
- VPS não acessada.
