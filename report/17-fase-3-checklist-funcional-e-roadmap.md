# 17 — Fase 3: Checklist funcional e roadmap do TREG PWA

## 0. Base, método e limites

- **Branch de referência:** `fix/treg-pwa-c7-qrcode-fix`
- **Commit de referência:** `6218f0fd25a2047b5caba09cf854af74058db03d`
- **Data da investigação:** 2026-10-17
- **Relatórios consolidados:** `report/02`, `03`, `04`, `06`, `07`, `09` e `16`
- **Código lido:** `dashboard/pwa/index.html`, `app.js`, `app.css`, `sw.js`, `dashboard/plugin_api.py`, `dashboard/dist/index.js`, `dashboard/manifest.json`, `plugin.yaml`, `tests/`
- **Hermes consultado:** código upstream `NousResearch/hermes-agent`, HEAD `e6cf2a9b1e8f98d40408b09a9a55993c8459b4b4` (2026-10-17), apenas para conferir contratos de sessão, mensagens, runs e Kanban.
- **Fora de escopo nesta fase:** alterar código, instalar na VPS, reiniciar serviços, criar backups, tocar no `hermes-pwa` original ou fazer merge na `main`.

Este relatório separa **existência no código** de **validação em execução**. O `report/02` usava “confirmada” para recursos presentes no código; aqui esses itens foram reclassificados quando não há evidência de teste real.

### 0.1 Legenda de estado

| Código | Significado |
|---|---|
| **EV** | Existente e validado em execução/CI relevante |
| **EP** | Existente, mas parcial ou com lacuna conhecida |
| **ET** | Existente no código, pendente de teste real |
| **AD** | A desenvolver |

### 0.2 Marcas de evidência

- **[F]** fato comprovado no código, nos relatórios ou em execução registrada.
- **[H]** hipótese ou contrato que depende de validação no ambiente Hermes real.

### 0.3 Limitação principal

Não houve teste em navegador, celular, PWA instalado, câmera, microfone ou instância real do Hermes nesta fase. Portanto, nenhuma tela, instalação, upload real ou áudio é marcado como **EV** apenas por existir no código.

## 1. Sumário executivo

O TREG PWA já tem uma base funcional de mensageiro: lista de sessões, busca, chat com streaming, runs em segundo plano, markdown-lite, anexos, voz, perfis de agente, aprovação de comandos, tema automático, QR code e estrutura de PWA instalável.

O que está comprovadamente validado é limitado: geração e decodificação de QR Codes, contratos estáticos dos manifestos, sintaxe JavaScript, compilação Python, `pytest` e a CI da fase C7. O restante do produto está **existente, pendente de teste** ou **existente mas parcial**.

As maiores lacunas são:

1. Acabamento visual de mensageiro: tipografia pequena, balões densos, avatares só com letra, menus incompletos e ausência de alternância manual de tema.
2. Marcadores de status: não há recibo de entrega/leitura nem estado semântico de tarefa. O app só conhece o ciclo efêmero da execução (`run`).
3. Mídia: imagens são enviadas inline ao modelo, mas não há upload persistente de imagem como anexo; PWA, upload real, áudio e transcrição nunca foram testados em dispositivo.
4. Escala: não há paginação reversa, virtualização ou throttling de renderização para conversas longas.

A recomendação é **não começar por checkmarks**. Primeiro validar a linha de base em dispositivo, depois melhorar a experiência visual, depois definir um contrato de status. Checkmarks de “entregue/lido” não têm suporte de API no Hermes inspecionado; “tarefa resolvida” também não pode ser inferida de `run.completed`.

## 2. Fatos comprovados

| Fato | Evidência | Consequência |
|---|---|---|
| QR Codes curtos, médios e longos são gerados e decodificados corretamente | `tests/qrcode.test.js`; CI run `39075301916` com success; execução local da suíte em 2026-10-17: 3/3 casos | O defeito de `setupPositionAdjustPattern()` está corrigido e coberto |
| Manifestos estáticos e comando do plugin passam nos testes | `tests/test_plugin.py`; CI C7; `pytest`: 2 passed | Contrato básico do plugin preservado |
| Sintaxe JavaScript e compilação Python passam | CI C7: `node --check` e `python -m py_compile` | Não há erro sintático conhecido nesses arquivos |
| Existe lista de sessões, chat, runs, aprovação, anexos e voz no app | `dashboard/pwa/app.js`; `dashboard/plugin_api.py` | Base funcional ampla, mas sem validação de dispositivo |
| O app trata `run.completed`, `run.failed`, `run.cancelled` e `run.interrupted` | `app.js:351-382` | O estado de execução é conhecido durante a sessão |
| O estado de execução não é gravado como status de mensagem | `app.js:447-457`; `loadMessages()` filtra apenas `role` e `content`; o `run_id` fica em `localStorage` e é apagado em `finishRun()` | Ao reabrir, a conversa mostra o texto, não um checkmark de execução |
| O app tem cartão de aprovação com estado local “Permitido/Negado” | `app.js:233-264` | O estado não é reconstruído do histórico ao reabrir |
| O tema é apenas automático por `prefers-color-scheme` | `app.css:1-13`; não há `data-theme`, toggle ou persistência | Tema manual é funcionalidade a desenvolver |
| Imagens são reduzidas e enviadas inline como `image_url` | `app.js:470-534`, `plugin_api.py:318-334` | O modelo recebe a imagem, mas o app não faz upload persistente de imagem como anexo |
| Áudio é gravado, enviado a `~/uploads` e transcrito quando configurado | `app.js:535-573`; `plugin_api.py:266-307` | Existe no código; falta teste real de gravação, playback e transcrição |
| O PWA tem manifest dinâmico, service worker e página de instalação | `plugin_api.py:106-121`; `pwa/sw.js`; `dist/index.js:99-134` | Estrutura existe; instalação real não foi executada |
| O Hermes upstream atual expõe `end_reason` e `ended_at` de sessão | `gateway/platforms/api_server.py:2928-2960` | São encerramento/compactação de sessão, não resolução de tarefa |
| O Hermes upstream atual expõe `finish_reason`, `display_kind`, `tool_calls` e `tool_name` em mensagens | `gateway/platforms/api_server.py:2965-2975`; schema em `hermes_state_common.py:477-508` | Metadados de transporte/execução; não são recibo de leitura nem status semântico |
| O Hermes mantém `last_read_at` no banco de sessão | `hermes_state_sessions.py:1040-1048` | Existe estado de leitura no banco, mas o payload atual de `/api/sessions` não o expõe |
| Kanban tem tarefas com status e vínculo opcional por `session_id` | `hermes_cli/kanban_db.py:655` e schema em `:883`; status em `hermes_cli/kanban_workflow.py:114-142` | É uma integração possível para tarefas semânticas, mas separada do chat |

## 3. Hipóteses e lacunas

| Hipótese/lacuna | Estado | Como validar |
|---|---|---|
| A primeira conversa tem formatação diferente por reconciliação entre bolha local e mensagem persistida | [H] H1 do `report/03`/`09`; causa não provada | Criar conversa limpa, enviar markdown/código, comparar `innerHTML` antes e depois de reload |
| Imagens não permanecem no histórico e reaparecem apenas como texto/marcador | [H] documentada no README original; não testada nesta fase | Enviar imagem, fechar, reabrir em outro dispositivo e conferir o histórico |
| A instalação PWA funciona em Android Chrome e iPhone Safari | [H] depende de HTTPS, manifest, SW e política de cada navegador | Instalar nos dois aparelhos e abrir em modo standalone |
| O onboarding por QR mostra as instruções de instalação | [H] o QR aponta para `/treg`, que redireciona para o app quando acessado diretamente | Escanear o QR no celular e verificar se a página de instalação aparece |
| A gravação de áudio funciona com os MIME types disponíveis em iOS/Android | [H] o código tenta `webm/opus`, `webm`, `mp4` e `ogg`, mas não há teste de dispositivo | Gravar 5 s, 1 min e 5 min no Safari/Chrome; ouvir e transcrever |
| A transcrição funciona e degrada sem chave | [H] o fluxo e o fallback existem no código | Testar com chave Groq válida, inválida e ausente |
| O campo `unread` pode ser usado para marcar conversa não lida | [H] o banco tem `last_read_at` e o PATCH aceita `unread`, mas o payload de `/api/sessions` no HEAD inspecionado remove o campo | Confirmar na versão Hermes instalada; sem campo de leitura, não prometer |
| Kanban pode fornecer status semântico de tarefa para a conversa | [H] tarefas têm `session_id` opcional; o plugin Kanban é separado e pode não estar instalado | Verificar se o Kanban está ativo, se `session_id` é preenchido e como listar tarefas por sessão |
| É possível associar uma tarefa a uma mensagem específica | [H] o vínculo conhecido é por sessão, não por mensagem | Validar modelo de dados ou criar associação explícita |

## 4. Checklist — design de mensageiro

| ID | Item | Estado | Evidência e lacuna | Critério objetivo de aceitação |
|---|---|---|---|---|
| D01 | Layout mobile com lista **ou** chat, botão voltar, `100dvh` e safe areas | ET | `app.css:17-20,107-116`; lista/chat alternados em `app.js:136-152` | Em 320, 360 e 390 px, sem sobreposição, corte ou salto ao abrir/fechar teclado |
| D02 | Legibilidade da lista: título, prévia, horário e badge | EP | `.s-prev` 13 px, `.s-meta` 11 px, `.badge` 10 px em `app.css:45-47` | Prévia ≥ 14 px, meta ≥ 12 px, horário ≥ 11 px, contraste AA e nomes longos com ellipsis |
| D03 | Busca, nova conversa, renomear, apagar e indicação de fixada | EP | Busca e ações existem; `pinned` só aparece como marcador, sem ação de fixar/arquivar na UI (`app.js:107-119`; `PatchSession` em `plugin_api.py:191-195`) | Todas as ações atuais alcançáveis; se pin/archive forem expostos, refletir no servidor após reload |
| D04 | Balões de mensagens, cores, largura e cauda | ET | `app.css:56-61`; `bubble()` em `app.js:199-222` | Balões de usuário/assistente distinguíveis; largura máxima; sem overflow horizontal |
| D05 | Tipografia, espaçamento e separadores de data | EP | Corpo 15 px, `gap 6px`, horário 10 px; não há separador por dia (`app.css:56-61`) | Corpo 16 px, linha 1.5, gap 8–10 px, data separada por dia e hora com contraste AA |
| D06 | Markdown, código, links e listas | EP | `md()` em `app.js:24-42`; `pre` com scroll, sem header de linguagem nem botão copiar | Bloco de código copiado byte a byte; links e listas preservados; sem HTML injetado |
| D07 | Avatares de contato/agente | EP | Apenas inicial e cor por `source` (`app.js:18-19`; `app.css:40-42`); sem foto do usuário ou identidade do agente | Cada agente e canal distinguível; fallback determinístico letra+cor; foto local opt-in se aprovada |
| D08 | Menus contextuais | EP | Sheet da sessão tem renomear, recarregar e apagar (`index.html:67-75`; `app.js:575-635`); não há menu de informações do chat nem sheet de anexos | Ações atuais em ≤ 2 toques; menu do chat mostra dados disponíveis da sessão; sheet “Anexar” separado |
| D09 | Anexos: clipe, colar, arrastar, tray e remoção | ET | `app.js:470-534`; `index.html:54`; até 6 imagens e 25 MB por arquivo | Anexar, colar e arrastar funcionam; remover antes do envio; sem duplicação de anexo |
| D10 | Sheet “Anexar” com câmera, galeria, arquivo e áudio | AD | Hoje o clipe abre o seletor direto; não há `capture` nem sheet | Sheet com quatro opções; câmera abre no Android/iOS quando suportado; fallback para seletor |
| D11 | Tema claro/escuro automático | ET | `app.css:1-13`; `theme-color` com media queries em `index.html:7-8` | Segue o tema do sistema sem flash perceptível e mantém contraste nos dois modos |
| D12 | Tema claro/escuro manual com persistência | AD | Não há toggle, `data-theme` nem `localStorage` de tema; manifest usa `theme_color` fixo escuro (`plugin_api.py:106-121`) | Três estados (Auto/Claro/Escuro), persistência após reload e PWA instalado; splash coerente |
| D13 | Navegação por celular e teclado | ET | `index.html:5`; `app.css:17-23`; `app.js:268-273` | Enter envia, Shift+Enter quebra; teclado não cobre a última bolha; voltar preserva estado |
| D14 | Layout desktop lado a lado | ET | `app.css:107-116` | ≥ 900 px mostra lista e chat; < 900 px mostra um painel por vez |
| D15 | Acessibilidade | EP | `aria-label` e `role=dialog` existem; faltam `aria-live`, foco gerenciado, `prefers-reduced-motion` e label explícito do seletor | Navegação por teclado; leitor de tela anuncia novas mensagens; contraste AA; movimento reduzido |
| D16 | Empty state e onboarding | AD | `#list-empty` é texto simples; placeholder desktop é mínimo (`index.html:35,62-64`) | Empty state com CTA “Nova conversa”, “Como instalar” e “Ver agentes”; sem layout vazio |
| D17 | Desempenho de conversas longas | EP | `renderMessages()` recria tudo; sem paginação/virtualização; `md()` re-renderiza por delta (`app.js:224-228,356-360`) | Conversa de 500 mensagens abre sem travar; scroll estável; streaming com throttle |
| D18 | Offline e reconexão | EP | SW guarda a casca e não cacheia API (`sw.js:1-35`); não há banner de offline | Abrir app sem rede mostra casca e aviso; reconexão recarrega sem duplicar mensagens |

### 4.1 Leitura do checklist de design

O app já tem a **estrutura** de um mensageiro, não o acabamento. Os itens de maior valor e menor risco são D02, D05, D06, D08, D12 e D15: todos são majoritariamente CSS/JavaScript de frontend e não dependem de mudança no Hermes.

D07 (avatares) pode ser feito sem API nova, mas a “foto do usuário” não tem recurso correspondente no Hermes; deve ser preferência local opt-in ou ficar fora do escopo.

D10 e D16 são propostas de produto, não correções de defeito. D17 e D18 são dívidas de escala e resiliência, não bloqueios para a primeira versão visual.

## 5. Checklist — marcadores de status

### 5.1 Definições que não podem ser misturadas

| Conceito | Definição | Onde existe hoje |
|---|---|---|
| **Execução em andamento** | O run foi aceito e ainda está `queued`, `running` ou `waiting_for_approval` | `/api/runs/:id`; SSE `/api/runs/:id/events`; `app.js:347-445` |
| **Execução concluída** | O run terminou com `status=completed` e o evento terminal chegou | `run.completed`/`assistant.completed`; polling de status (`app.js:364-371,413-437`) |
| **Mensagem respondida** | Existe uma mensagem `assistant` persistida depois da mensagem do usuário | Pode ser inferida do transcript; não há campo `answered` |
| **Mensagem entregue/lida** | Recibo de entrega ou leitura no destinatário | Não há campo de mensagem; `unread` de sessão não é recibo por mensagem |
| **Tarefa concluída** | O resultado solicitado foi aceito como concluído | Não existe no modelo de mensagens; Kanban tem `done`, mas é outro domínio |
| **Tarefa resolvida semanticamente** | O problema do usuário foi resolvido, não apenas o turno do agente terminou | Não há evidência de campo, evento ou endpoint no chat |

**Regra:** `run.completed` prova apenas que o turno do agente terminou. Não prova que a tarefa foi resolvida, aceita ou revisada.

### 5.2 Estados existentes no TREG

| ID | Estado | Estado no checklist | Evidência | Persiste ao reabrir? |
|---|---|---|---|---|
| S01 | Execução ativa (“pensando”, ferramenta em uso) | EP | `setTyping()` e eventos `tool.started/progress` (`app.js:267,360-363`) | Não como mensagem; só enquanto o run está ativo |
| S02 | Execução concluída | EP | `run.completed`/`assistant.completed` (`app.js:364-371`); polling de `completed` (`app.js:420-423`) | Não há checkmark persistido; o texto aparece no transcript |
| S03 | Execução falhou/cancelada | EP | `run.failed`, `run.cancelled`, `run.interrupted` (`app.js:372-380`); status de polling (`app.js:423-426`) | Bolha de erro local; não é um estado canônico da mensagem |
| S04 | Aprovação pendente/respondida | EP | `approval.request` (`app.js:360-362`); cartão local (`app.js:233-264`); `approval.responded` upstream | Só enquanto o run pendente está no `localStorage`; cartão não é reconstruído do histórico |
| S05 | Mensagem respondida | AD | Não há campo; a presença de `assistant` é apenas heurística de transcript | Sim como texto, não como selo de status |
| S06 | Mensagem entregue/lida | AD | Nenhum campo `delivered`, `read`, `seen` no schema de mensagens (`hermes_state_common.py:477-508`) | Não |
| S07 | Conversa não lida | AD (requer contrato) | Banco tem `last_read_at` e PATCH aceita `unread` (`hermes_state_sessions.py:1040-1048`; `api_server.py:3156-3183`), mas o payload de `/api/sessions` do HEAD inspecionado não inclui `unread` | Não pelo app atual |
| S08 | Sessão encerrada/compactada | EP | `end_reason` e `ended_at` são expostos no objeto de sessão (`api_server.py:2928-2960`); o app ignora esses campos | Sim no servidor; não há UI |
| S09 | Tarefa concluída (`done`) | AD (integração [H]) | Kanban tem status `done` (`kanban_workflow.py:114-142`) e `tasks.session_id` opcional (`kanban_db.py:655,883`) | Depende de integração explícita com Kanban |
| S10 | Tarefa em revisão/bloqueada (`review`/`blocked`) | AD (integração [H]) | Mesmo modelo Kanban; `review` significa implementação pronta aguardando revisão, não “resolvida” | Depende de integração explícita |
| S11 | Marcador durável por mensagem | AD | Não há campo de status na mensagem; `finish_reason` e `display_kind` são metadados de transporte/execução | Requer modelo novo ou integração de tarefas |

### 5.3 Endpoints e campos comprovados

| Recurso | Evidência | Prova o quê | Não prova |
|---|---|---|---|
| `GET /v1/runs/{id}` | `gateway/platforms/api_server_runs.py:1192-1200`; status `queued`, `running`, `waiting_for_approval`, `completed`, `failed`, `cancelled`, `interrupted` | Ciclo de vida da execução | Resolução semântica da tarefa |
| `GET /v1/runs/{id}/events` | `api_server_runs.py:1199`; eventos `message.delta`, `tool.*`, `approval.request`, `run.completed`, `run.failed`, `run.cancelled` | Progresso e terminal do run | Status da mensagem no histórico |
| `POST /v1/runs/{id}/approval` | `api_server_runs.py:1304`; `approval.responded` | Autorização de comando | Conclusão da tarefa |
| `GET /api/sessions` | `api_server.py:3014-3055`; campos `ended_at`, `end_reason`, `message_count`, `tool_call_count`, `pinned`, `archived`, `hidden` | Estado administrativo da sessão | Entrega/leitura ou resolução |
| `GET /api/sessions/{id}/messages` | `api_server.py:3225-3257`; campos `role`, `content`, `timestamp`, `tool_calls`, `finish_reason`, `display_kind` | Transcript e metadados | Recibo de leitura ou tarefa concluída |
| `PATCH /api/sessions/{id}` com `unread` | `api_server.py:3156-3183`; `hermes_state_sessions.py:1040-1048` | Pode marcar lida/não lida no banco | Ler o estado de volta no payload atual; é por sessão, não por mensagem |
| Kanban `GET /api/plugins/kanban/board` e `/tasks/{id}` | `plugins/kanban/dashboard/plugin_api.py:359-412`; status e `session_id` | Status de tarefa e vínculo com sessão de origem | Vínculo com uma mensagem específica; disponibilidade no host |

### 5.4 Como o estado poderia continuar visível ao reabrir

1. **Estado de execução:** hoje só o run ativo é retomado por `localStorage` (`RUN_KEY`), com expiração de 2 horas. Depois de `finishRun()`, a chave é removida e o histórico é recarregado. Para persistir, seria necessário gravar o resultado do run em um campo de mensagem ou em um modelo de tarefa; o transcript atual não tem esse campo.
2. **Aprovação:** o cartão é local e não é reconstruído de `/messages`. Ao reabrir, só reaparece se o run ainda estiver pendente, no mesmo dispositivo, com a mesma sessão e dentro da janela de retomada.
3. **Resposta:** a existência de uma mensagem `assistant` após a mensagem do usuário pode ser derivada do transcript, mas isso só indica “há resposta”, não “foi lida” ou “resolveu o pedido”.
4. **Tarefa:** a única via durável comprovada é um modelo externo de tarefa. O Kanban tem `done`, `review`, `blocked` e `session_id`; isso pode ser mostrado se o Kanban estiver disponível e se o vínculo por sessão for confiável. Ainda assim, não há vínculo por mensagem.
5. **Leitura:** o banco tem `last_read_at`, mas o payload atual de sessões não expõe `unread`; sem isso, um selo de “lido” no app seria inventado ou local.

### 5.5 Recomendação para status

Adotar três camadas separadas, sem misturar semântica:

| Camada | Exemplos | Onde persistir | Recomendação |
|---|---|---|---|
| **Execução** | pensando, usando ferramenta, aguardando aprovação, falhou | Run/status + timestamp da mensagem | Mostrar apenas durante a execução; não usar checkmark verde |
| **Entrega/leitura** | enviado, entregue, lido | Não existe contrato no Hermes | Não implementar até haver API; não simular recibo |
| **Tarefa** | aberta, em revisão, bloqueada, concluída | Kanban ou modelo explícito | Só mostrar com tarefa vinculada e status comprovado; `done` ≠ `review` ≠ `blocked` |

## 6. Checklist — áudio, mídia e PWA

| ID | Item | Estado | Evidência e lacuna | Critério objetivo de aceitação |
|---|---|---|---|---|
| M01 | Selecionar, colar e arrastar imagens; limitar a 6; reduzir para 1600 px/JPEG 0.85 | ET | `app.js:470-534`; `index.html:54` | Foto de câmera, print colado e drag-drop entram no tray; nenhuma excede 1600 px; remoção funciona |
| M02 | Enviar imagem para o modelo como `image_url` | ET | `send()` monta partes `text`/`image_url` (`app.js:320-332`); `plugin_api.py:318-334` | Modelo descreve conteúdo visual da imagem; envio com texto e com múltiplas imagens |
| M03 | Upload real de imagem como anexo persistente | AD | O fluxo de imagem não chama `api/upload`; usa data URL inline. O endpoint de upload existe para arquivos/áudio (`plugin_api.py:266-307`) | Imagem permanece acessível após reload e em outro dispositivo, com caminho/URL servido por `api/uploads`; ou decisão explícita de manter inline |
| M04 | Upload de arquivo até 25 MB para `~/uploads` | ET | `app.js:530-534`; `plugin_api.py:266-291`; nome sanitizado e limite | PDF próximo de 25 MB sobe; download funciona; nome malicioso é neutralizado; > 25 MB retorna 413 |
| M05 | Gravação de voz com MediaRecorder, timer e limite de 5 min | ET | `app.js:543-573`; `MediaRecorder` com fallback de MIME | Gravar 5 s, 1 min e 5 min em Android/iOS; parar, ouvir e enviar; áudio muito curto é rejeitado |
| M06 | Transcrição via Hermes/Groq com fallback sem chave | ET | `transcribe()` (`app.js:535-541`); configuração em `plugin_api.py:499-604` | Com chave válida, transcrição aparece; sem chave, áudio é enviado com aviso “sem transcrição” |
| M07 | Player de áudio e transcrição na bolha | ET | `app.js:204-219`; `app.css:131-136` | Player toca no iOS/Android; transcrição longa quebra linha; áudio inexistente mostra fallback |
| M08 | Vídeo como anexo | EP | `accept` inclui `video/*` (`index.html:54`), mas vídeo é tratado como arquivo genérico; não há player | Decidir entre suportar preview/player ou remover `video/*` da promessa visual |
| M09 | Captura de câmera no anexo | AD | Não há `capture` nem sheet de câmera | Botão “Câmera” abre câmera traseira quando suportado; fallback para galeria |
| M10 | Instalação PWA: manifest, ícones, SW e modo standalone | ET | `plugin_api.py:106-121`; `sw.js`; `index.html:7-16`; instalação real não testada | Android Chrome e iPhone Safari instalam; abre standalone; ícone e nome corretos; scope/start_url corretos |
| M11 | QR code de instalação | EV | Correção C7; `tests/qrcode.test.js`; CI C7 success | QR de URL curta/média/longa decodifica para a URL exata; leitor físico abre a URL |
| M12 | Offline shell e atualização do SW | ET | `sw.js` cacheia casca, não API; versão `treg-pwa-v1` | Abrir sem rede mostra app; update de versão recarrega uma vez; API nunca vem do cache |
| M13 | Onboarding de instalação via QR | EP | QR aponta para `/treg`; acesso direto a `/treg` redireciona para o app (`dist/index.js:99-116`), podendo pular a página de instruções | Escanear QR e chegar à instrução de instalação, ou documentar que o QR abre o app e a instalação é feita pelo menu do navegador |

### 6.1 O que já foi realmente testado em mídia/PWA

- **QR code:** sim, geração e decodificação independente com `jsqr@1.4.0`; 3/3 casos; CI success.
- **Manifesto e arquivos estáticos:** presença e contrato testados; não é teste de instalação.
- **PWA instalada:** não.
- **Upload real de imagem/arquivo:** não.
- **Áudio real, transcrição e player:** não.
- **Câmera, colar print e drag-drop em dispositivo:** não.

## 7. Priorização recomendada

### 7.1 Ordem

| Ordem | Pacote | Por que agora | Dependências | Arquivos prováveis | Risco principal | Gate de aceitação |
|---|---|---|---|---|---|---|
| **P0** | Validação de linha de base em ambiente de teste | Evita construir UI sobre suposições; descobre falhas de PWA, mídia e áudio antes de investir | HTTPS, Hermes de teste, Android e iPhone; nunca VPS de produção | Nenhum código; novo checklist de evidências (futuro `report/18`) | Ambiente indisponível; dados de teste | PWA instala; imagem chega ao modelo; arquivo sobe; áudio grava/toca/transcreve; navegação mobile passa |
| **P1** | Legibilidade e estrutura da conversa | Maior valor percebido, menor risco; só frontend | P0 para baseline visual | `pwa/app.css`, `pwa/app.js`, `pwa/index.html` | Regressão de CSS e parser markdown | 320/360/390 px sem overflow; horários/prévias legíveis; código copiável; contraste AA |
| **P2** | Menus, avatares e tema manual | Completa a experiência “mensageiro” e identidade | P1 (tokens/espaçamento) | `index.html`, `app.js`, `app.css`, `sw.js`, novo `pwa/avatar.js`, ícones | Cache do SW/ícones; flash de tema; captura iOS | Ações em ≤ 2 toques; avatares distinguíveis; tema persiste após reload/PWA |
| **P3** | Contrato e UI de status; tarefas | Evita checkmarks falsos; exige decisão de produto e contrato | P0; API Hermes; Kanban se aplicável | `app.js`, `app.css`, novo `pwa/status.js`; `plugin_api.py` se precisar proxy | Semântica incorreta; API instável; status obsoleto | Execução ativa/falha visível; nenhum “resolvido” sem tarefa; `done` ≠ `review` ≠ `blocked` |
| **P4** | Mídia persistente e captura | Fecha lacuna real de imagens e câmera | P2 (sheet de anexos); contrato de upload | `app.js`, `plugin_api.py`, `app.css` | RAM com base64/25 MB; MIME iOS; privacidade | Imagem persiste ou decisão inline documentada; câmera funciona; áudio cancelável |
| **P5** | Escala, offline e notificações | Necessário para uso prolongado, menor urgência | P1/P4; push depende do Hermes | `app.js`, `sw.js`, `app.css` | Complexidade de paginação; push sem API | 500 mensagens sem travar; reconexão sem duplicar; push só se houver contrato |

### 7.2 P0 — Validação de linha de base (gate, 2–3 dias)

**Objetivo:** provar o que funciona em ambiente isolado antes de alterar a UI.

**Dependências:** dashboard HTTPS, API server do gateway, instância Hermes de teste, Android Chrome e iPhone Safari. Não usar produção.

**Arquivos:** nenhum código nesta fase; registrar resultados em `report/18` ou checklist de QA.

**Riscos:** falta de aparelho iOS; diferenças de versão do Hermes; uploads de teste com dados sensíveis.

**Critérios de aceitação:**

- PWA instala nos dois sistemas e abre em standalone.
- QR abre a URL correta e o fluxo de instalação é compreensível.
- Foto de câmera, print colado e drag-drop chegam ao modelo.
- PDF próximo de 25 MB sobe, é listado e baixa; arquivo maior é rejeitado.
- Áudio de 5 s, 1 min e 5 min grava, toca e transcreve; sem chave, fallback funciona.
- Lista/chat funcionam em 320/360/390 px com teclado aberto e fechado.
- Run em segundo plano, reload, reconexão e aprovação se comportam como documentado.

### 7.3 P1 — Legibilidade e estrutura da conversa (3–5 dias)

**Objetivo:** transformar a base existente em uma conversa confortável no celular.

**Dependências:** P0; nenhuma API nova.

**Arquivos:** `dashboard/pwa/app.css` (tipografia, espaçamento, contraste, date separators), `dashboard/pwa/app.js` (`md()`, `bubble()`, `renderMessages()`), `dashboard/pwa/index.html` (estados vazios, labels).

**Riscos:** regressão no parser markdown; excesso de CSS; perda de desempenho ao adicionar separadores.

**Critérios de aceitação:**

- Prévia ≥ 14 px, meta ≥ 12 px, horário ≥ 11 px; corpo 16 px/1.5; contraste AA.
- Sem overflow horizontal em 320 px; nomes longos com ellipsis.
- Separadores de data entre dias; agrupamento visual previsível.
- Bloco de código com header de linguagem e botão copiar; cópia byte a byte.
- Empty state com CTA de nova conversa e instruções de instalação.
- `aria-live` para mensagens/typing/toast; foco visível; `prefers-reduced-motion`.

### 7.4 P2 — Menus, avatares e tema (4–6 dias)

**Objetivo:** completar a sensação de mensageiro e a identidade visual.

**Dependências:** P1; nenhum endpoint novo para menu/avatar/tema.

**Arquivos:** `index.html` (sheet de anexos, menu do chat), `app.js` (ações, avatar, tema), `app.css` (sheet, avatares, temas), `sw.js` (versão do cache), `pwa/avatar.js` (novo), `icon.svg`/PNGs.

**Riscos:** cache de ícones no SW; iOS não oferece todas as opções de câmera; tema fixo no manifest; foto local não deve ir ao servidor.

**Critérios de aceitação:**

- Sheet “Anexar” com Câmera, Galeria, Arquivo e Áudio; todas as ações atuais em ≤ 2 toques.
- Menu do chat mostra apenas dados disponíveis (origem, agente, modelo, mensagens, timestamps); sem inventar contato.
- Avatar Hermes, avatar por agente e avatar de canal distinguíveis; fallback letra+cor.
- Tema Auto/Claro/Escuro; persistência em `localStorage`; `theme-color` atualizado; sem flash.
- Nenhuma imagem de usuário é enviada ao servidor sem opt-in explícito.

### 7.5 P3 — Status duráveis e tarefas (descoberta 1–2 dias + implementação 3–5 dias)

**Objetivo:** oferecer status úteis sem falsificar recibos ou resolução.

**Dependências:** P0; contrato do Hermes instalado; Kanban se for a fonte de tarefas. Se o campo `unread` não estiver no payload, a parte de leitura fica bloqueada até o host expor.

**Arquivos:** `app.js` (status da execução e renderização), `app.css` (chips), novo `pwa/status.js` se necessário; `plugin_api.py` apenas para proxy de um contrato aprovado; `tests/` para o parser.

**Riscos:** confundir execução com resolução; API mudar; Kanban não estar instalado; status ficar obsoleto; privacidade de tarefas entre perfis.

**Critérios de aceitação:**

- Chip de execução aparece só enquanto o run está ativo e some no terminal.
- Falha/cancelamento é visível e não recebe selo de sucesso.
- Nenhum checkmark de entregue/lido é exibido sem campo comprovado.
- Status de tarefa só aparece se houver tarefa explicitamente vinculada; `done`, `review` e `blocked` têm rótulos distintos.
- Ao reabrir, o usuário não vê “resolvido” baseado apenas em `run.completed`.
- Se Kanban não estiver disponível, a UI degrada sem erro e sem promessa.

### 7.6 P4 — Mídia persistente e captura (3–5 dias)

**Objetivo:** resolver a lacuna de imagem como anexo real e melhorar câmera/áudio.

**Dependências:** P2 (sheet de anexos); decisão de contrato de imagem persistente.

**Arquivos:** `app.js` (upload, tray, câmera, cancelamento de áudio), `plugin_api.py` (se o fluxo de imagem usar `api/upload`), `app.css` (preview de vídeo/player), testes de upload.

**Riscos:** memória com base64 de 25 MB; MIME de áudio no iOS; imagens em `~/uploads` e privacidade; duplicação inline + arquivo.

**Critérios de aceitação:**

- Imagem inline continua chegando ao modelo.
- Se imagem persistente for aprovada, ela sobrevive a reload e outro dispositivo, com URL servida por `api/uploads`; se não, a limitação é declarada na UI.
- Câmera abre quando suportada e tem fallback.
- Áudio pode ser cancelado antes do envio; gravação de 5 min não estoura memória.
- Vídeo é suportado com player ou removido do `accept` para não prometer o que não existe.

### 7.7 P5 — Escala, offline e notificações (5–8 dias)

**Objetivo:** sustentar uso real com histórico longo e rede instável.

**Dependências:** P1/P4; push depende de API do Hermes, que não foi encontrada.

**Arquivos:** `app.js` (paginação, IntersectionObserver, throttle), `sw.js` (offline), `app.css` (estados), possível endpoint de paginação no proxy.

**Riscos:** duplicação de mensagens; scroll instável; push inexistente; cache agressivo.

**Critérios de aceitação:**

- Conversa de 500 mensagens abre e rola sem travar; sem duplicação.
- Streaming longo não re-renderiza o documento inteiro a cada delta.
- Offline mostra casca e aviso; reconexão recupera mensagens sem perder rascunho.
- Nenhuma notificação push é prometida sem contrato comprovado.

## 8. Decisões pendentes

1. **Qual status o produto quer mostrar?** Execução, leitura, tarefa ou os três? A resposta muda o modelo de dados.
2. **O Kanban está disponível no ambiente de destino?** Sem ele, status semântico de tarefa não tem fonte.
3. **Imagem deve persistir no histórico?** Se sim, é preciso decidir entre inline + upload ou um novo contrato de anexo.
4. **Qual versão do Hermes será suportada?** O HEAD inspecionado expõe `ended_at`/`end_reason` e esconde `unread`; a versão instalada pode divergir.
5. **Push é requisito?** Não há API de push identificada; deve ficar fora do roadmap até existir contrato.

## 9. Não objetivos e promessas que devem ser evitadas

- Não exibir checkmarks de entregue/lido sem recibo real.
- Não chamar `run.completed` de “tarefa resolvida”.
- Não prometer foto de usuário sincronizada; o Hermes não expõe essa API no que foi inspecionado.
- Não prometer push notifications.
- Não assumir Kanban instalado nem vínculo por mensagem.
- Não alterar o núcleo do Hermes para obter status; a integração deve ser por interface existente ou contrato aprovado.
- Não substituir o `hermes-pwa` original nem instalar na VPS nesta fase.

## 10. Conclusão

O TREG PWA já é um mensageiro funcional em código. O próximo ganho não é “mais uma função”, e sim **confiança**: validar PWA, mídia, áudio e mobile em aparelho real; depois elevar a legibilidade e o acabamento visual; só então definir status.

A ordem recomendada é:

1. **P0:** validar a linha de base.
2. **P1:** legibilidade, balões, código, datas e acessibilidade.
3. **P2:** menus, avatares e tema manual.
4. **P3:** status de execução e, se houver contrato, tarefas; nunca recibos falsos.
5. **P4:** imagem persistente, câmera e robustez de áudio.
6. **P5:** escala, offline e push somente com API comprovada.

Nenhum código foi alterado nesta fase. Este documento é a base para a próxima decisão de produto e para a implementação incremental.
