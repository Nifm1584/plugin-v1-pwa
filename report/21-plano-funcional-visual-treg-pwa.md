# 21 — Plano funcional e visual do TREG PWA

## 1. Objetivo e escopo

Planejar as melhorias visuais e funcionais do TREG PWA antes de qualquer implementação, separando o que é apenas inspiração visual do que o Hermes realmente oferece.

Esta fase é **somente de planejamento**:

- não alterou código, dependências, configuração, imagens ou relatórios já publicados;
- não acessou a VPS;
- não modificou `main`, C7, tag ou Release;
- não fez capturas, não usou Browser MCP e não pesquisou novamente o WhatsApp;
- não fez commit, push ou merge.

O relatório será revisado antes de qualquer autorização de implementação.

## 2. Baseline usado

| Item | Valor |
|---|---|
| Repositório | `Nifm1584/plugin-v1-pwa` |
| Branch | `docs/fase-4-analise-visual-e-prints` |
| Commit | `2701a28812792a834a90fc569a1fb3b175f1c7bd` |
| Clone de trabalho | `C:\Users\NILTON~1\AppData\Local\Temp\opencode\plugin-v1-pwa-fase5` |
| Estado do clone | Limpo antes da criação deste relatório |
| Pasta local sem `.git` | Não usada como repositório de trabalho |

### 2.1 Documentos consultados

- `README.md` do projeto;
- `report/17-levantamento-visual-treg-pwa.md`;
- `report/18-auditoria-visual-funcional-treg-pwa.md`;
- `report/19-analise-prints-whatsapp.md`;
- `report/20-inventario-final-sincronizacao.md`;
- `report/02-inventario-de-funcionalidades.md`;
- `report/03-auditoria-interface-mobile.md`;
- `report/04-integracao-hermes-api.md`;
- `report/07-plano-de-evolucao.md`;
- `report/README.md`.

### 2.2 Código lido

- `dashboard/pwa/index.html`;
- `dashboard/pwa/app.js`;
- `dashboard/pwa/app.css`;
- `dashboard/plugin_api.py`;
- `dashboard/manifest.json`;
- `plugin.yaml`.

## 3. Fontes oficiais e evidências

### 3.1 Context7

Biblioteca usada: `/nousresearch/hermes-agent`.

Consultas realizadas:

1. endpoints do API server para sessões, mensagens, runs, aprovações, streaming, autenticação e mídia;
2. plugins, abas de dashboard, hooks, comandos, `plugin.yaml`, manifest e SDK;
3. áudio, transcrição, uploads, recibos de leitura, mensagens não lidas, temas e metadados de sessão.

A consulta confirmou, entre outros pontos, as flags `session_chat`, `session_chat_stream`, `run_status`, `run_events_sse`, `run_stop`, `run_approval_response`, `audio_api: false` e `realtime_voice: false`.

### 3.2 Documentação oficial

| Chave | Fonte | Uso neste relatório |
|---|---|---|
| S0 | Código local do TREG | `dashboard/pwa/app.js`, `app.css`, `index.html`, `dashboard/plugin_api.py` |
| S1 | [API Server](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/api-server.md) | Sessões, mensagens, runs, aprovações, imagens, limites de conteúdo |
| S2 | `/v1/capabilities` e `gateway/platforms/api_server.py` | Flags reais do gateway, incluindo `audio_api: false` e `run_stop` |
| S3 | [Web Dashboard](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/web-dashboard.md) | `GET /api/sessions/search`, filtros, listagem e mutações |
| S4 | [Sessions router](https://github.com/NousResearch/hermes-agent/blob/main/hermes_cli/web_routers/sessions.py) | Implementação de busca, filtros e mutações por perfil |
| S5 | [Gateway API server](https://github.com/NousResearch/hermes-agent/blob/main/gateway/platforms/api_server.py) | `PATCH` de `pinned`/`archived`/`unread`, listagem e `has_more` |
| S6 | [Extending the Dashboard](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/extending-the-dashboard.md) | Temas do dashboard, plugins, CSS e SDK |
| S7 | [Session Storage](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/session-storage.md) | Esquema de sessões/mensagens, busca FTS5 e ausência de recibos |
| S8 | [Audio router](https://github.com/NousResearch/hermes-agent/blob/main/hermes_cli/web_routers/audio.py) e [Voice Mode](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/voice-mode.md) | `/api/audio/transcribe` e limites de escopo do áudio |
| S9 | [Plugins](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/plugins.md) | Hooks, platform actions e escopo de plugins |

### 3.3 O que já existe no TREG

- busca local na lista (`app.js:104-124`);
- lista de até 80 sessões (`app.js:96-103`);
- nova conversa (`app.js:126-133` e `app.js:279-288`);
- conversa, streaming, runs em segundo plano e retomada (`app.js:273-467`);
- aprovações (`app.js:231-264`);
- anexos de imagem, arquivo e áudio (`app.js:470-573`);
- transcrição via `/api/audio/transcribe` (`app.js:535-541`);
- menu de sessão com renomear, recarregar e apagar (`app.js:575-635`);
- perfis e modo de autorização (`app.js:638-663`);
- tema automático por `prefers-color-scheme` (`app.css:1-13`);
- PWA com manifest e service worker (`index.html:6-15`, `app.js:672-682`).

## 4. Recursos do Hermes confirmados

| Recurso | Situação real | Evidência |
|---|---|---|
| Listar/criar/renomear/apagar sessões | Confirmado | S1, S5; `plugin_api.py:220-254` |
| Ler histórico | Confirmado | S1; `plugin_api.py:249-254` |
| Chat e streaming | Confirmado | S1, S2; `plugin_api.py:319-433` |
| Runs em segundo plano, status e eventos | Confirmado | S1, S2; `plugin_api.py:319-367` |
| Aprovação de comandos | Confirmado | S1, S2; `plugin_api.py:420-433` |
| Parar execução | Confirmado no gateway | S2 (`run_stop`), S1 (`POST /v1/runs/{id}/stop`) |
| Imagens inline | Confirmado | S1; `app.js:329-331` |
| Arquivos genéricos como anexo da API | **Não** aceitos como `file`/`input_file` | S1 retorna `400 unsupported_content_type`; o TREG usa upload próprio para `~/uploads` |
| Busca full-text | Confirmado no dashboard | S3 (`GET /api/sessions/search`), S4, S7 |
| Busca full-text no API server do gateway | Não documentada como endpoint de busca | S1 lista apenas `limit`, `offset`, `source`, `include_children` |
| `pinned`/`archived`/`hidden` no `PATCH` | Confirmado no código do gateway | S5; a documentação do API server está defasada nesse ponto |
| `unread` no `PATCH` | Aceito no gateway, mas **não retornado na listagem** | S5; não há contagem automática de não lidas |
| Contagem de não lidas | Não confirmada | S5, S7; o schema/listagem não expõe contagem de mensagens não lidas |
| Recibos de leitura por mensagem | Não confirmado para o chat do PWA | S7; os adaptadores de WhatsApp/Photon/BlueBubbles têm recibos, não a API de sessões |
| Reações no chat do PWA | Não disponível | S9: `platform_actions` v1 só cobre Telegram e Discord |
| Chamadas, status e presença | Não disponíveis na API de sessões | S1, S2, S7 |
| Áudio no API server | Não disponível (`audio_api: false`) | S2 |
| Transcrição por upload | Confirmada no dashboard | S8 (`/api/audio/transcribe`) |
| Temas do dashboard | Confirmados, mas aplicados ao dashboard | S6 |
| Tema do PWA | Não usa o tema do dashboard; CSS próprio | `app.css:1-13`, `index.html:6-7` |
| Push web | Não confirmado | S1/S3 não oferecem endpoint de push; o app usa polling |
| Instalação PWA | Confirmada | `index.html`, `manifest.webmanifest`, `sw.js` |

## 5. Matriz de planejamento

Legenda de decisão: **Implementar** · **Investigar** · **Não incluir**. A prioridade é uma sugestão de sequência, não uma autorização de implementação.

| # | Elemento ou função desejada | Estado atual do TREG | Suporte real e evidência | Decisão | Critérios para concluir |
|---|---|---|---|---|---|
| 1 | Hierarquia e densidade da lista | Avatar, título, prévia, horário e badge; tipografia pequena; `⋯` dentro da coluna de metadados | Somente apresentação; S0 (`app.css:34-48`, `app.js:104-123`) | **Implementar — P1** | Em 320–390 px, título e prévia legíveis a 30 cm; horário/badge sem colisão; nomes longos truncados sem quebrar a linha |
| 2 | Busca local imediata | Filtra somente as 80 sessões carregadas; sem estado “sem resultados” dedicado | Cliente; `app.js:104-124` | **Implementar — P1** | Busca filtra por título, prévia e origem; limpar restaura a lista; estado vazio e erro visíveis; sem requisição por tecla |
| 3 | Busca no histórico completo | Ausente; não encontra mensagens fora das 80 sessões | S3/S4: `GET /api/sessions/search?q=...`, FTS5; rota do dashboard, não do gateway | **Implementar — P1** | Busca em todo o histórico do perfil; retorna sessão e trecho; clicar abre a sessão; respeita `profile`; fallback local se a rota não existir |
| 4 | Paginação da lista | `limit=80`; `has_more` não é usado | S1: `limit`/`offset`; S5: `has_more` na resposta | **Implementar — P1** | Botão “Carregar mais” busca offset seguinte; sem duplicatas; mantém posição; erro não perde a página atual |
| 5 | Fixar/desafixar conversa | Lista ordena por `pinned` e mostra 📌; não há ação | S5: `PATCH` aceita `pinned`; `plugin_api.py:191-241`; a documentação do API server está defasada | **Implementar — P1** | Ação no menu altera `pinned`; ordem atualiza; persiste após recarregar; erro reverte e informa |
| 6 | Arquivar/restaurar conversa | `archived` é escondido no cliente; não há ação de arquivar nem lista de arquivadas | S5: `PATCH` aceita `archived`, mas a listagem do gateway não inclui arquivadas por padrão; S3 oferece listagem de arquivadas no dashboard | **Investigar — P2** | Só implementar se houver restauração e listagem de arquivadas com contrato confirmado; sem isso, não incluir |
| 7 | Badge/contagem de não lidas | Não existe; não há contagem de mensagens não lidas | S5: `unread` é flag mutável, mas não aparece na listagem; S7 não tem contador de não lidas | **Não incluir** | Não exibir badge numérico sem dado real; se o Hermes expuser contagem no futuro, reavaliar |
| 8 | Filtros/chips | Sem chips; lista única | `pinned` pode ser filtrado no cliente; “não lidas” não tem dado | **Implementar — P2** | Apenas “Todas” e “Fixadas” com dados reais; sem chip “Não lidas” decorativo |
| 9 | Cabeçalho da lista e do chat | Marca TREG, atualizar/configurações/novo; chat com voltar, título, subtítulo e menu | Somente apresentação; `index.html:19-48`, `app.js:136-140` | **Implementar — P2** | Ações reais mantidas; sem câmera/telefone/status falsos; hierarquia clara em 320 px; subtítulo não rouba o título |
| 10 | Avatares | Inicial e cor por origem; sem foto | S7 não expõe foto de contato; `app.js:18-19`, `app.css:40-42` | **Implementar — P2** | Inicial e cor determinísticas; contraste AA; fallback consistente para origem desconhecida; nenhuma foto de terceiro inventada |
| 11 | Menu da conversa | Renomear, recarregar, apagar | `app.js:575-635`; PATCH/DELETE reais | **Implementar — P1** | Inclui fixar; ações destrutivas confirmadas; foco e teclado funcionam; menu fecha ao concluir |
| 12 | Menu de mensagem | Não existe | Copiar texto via `navigator.clipboard` é local; citar/encaminhar/editar não têm contrato | **Implementar — P2 (somente copiar)** | Copiar conteúdo sanitizado; feedback “copiado”; sem botões de reação/encaminhar sem backend |
| 13 | Nova conversa | Modal com nome opcional; erro em toast | S1: `POST /api/sessions`; `app.js:126-133` | **Implementar — P1** | Campo validado, foco no nome, criar desabilitado durante envio; erro inline; abre a sessão criada |
| 14 | Composer | Texto, auto-resize, Enter/Shift+Enter, anexo, microfone, enviar | Cliente; `app.js:268-273`, `app.css:73-76` | **Implementar — P1** | Enter envia e Shift+Enter quebra; teclado não cobre a última bolha; botões desabilitados durante envio; foco preservado |
| 15 | Anexos de imagem | Até 6, compressão, colar, arrastar, lightbox | S1 aceita `image_url` inline; `app.js:470-534` | **Implementar — P2** | Prévia correta; limite e erro claros; imagem enviada não desaparece do histórico sem aviso |
| 16 | Arquivos e PDF | Upload até 25 MB para `~/uploads`; exibe nome; sem cartão rico ou download explícito | S1 rejeita `file` genérico; o caminho do plugin é upload + referência para as ferramentas do agente | **Implementar — P1** | Cartão com nome, tamanho, tipo e download real; nenhuma prévia de PDF simulada; falha de upload mostra retry |
| 17 | Áudio: gravação e player | Grava até 5 min; player; sem cancelar; transcrição após envio | S8: dashboard aceita transcrição; S2: gateway não expõe `audio_api` | **Implementar — P1** | Cancelar antes de enviar; limite de 5 min; permissão negada tratada; player toca após reload; estado de upload visível |
| 18 | Transcrição | `/api/audio/transcribe` com fallback para áudio sem transcrição | S8 documenta o endpoint de upload do dashboard; S2 confirma que não é API do gateway | **Implementar — P1** | Com STT configurado, texto aparece no chat; sem STT, áudio é enviado e o estado “sem transcrição” é explícito; timeout não bloqueia o envio |
| 19 | Tema claro/escuro | Segue o sistema; sem toggle manual; `theme-color` fixo no manifest | S6: temas do dashboard não regem o PWA standalone; `app.css:1-13` | **Implementar — P2** | Auto/Claro/Escuro persistido localmente; sem flash; `theme-color` acompanha; contraste AA; não afirma sincronizar com o dashboard |
| 20 | Responsividade e teclado | Uma coluna abaixo de 900 px; duas colunas acima; safe areas básicas | Cliente; `app.css:18-30,73,107-116` | **Implementar — P1** | 320/360/390/768/900/1280 px sem sobreposição; teclado aberto não cobre composer; orientação preservada |
| 21 | Estados de carregamento | Sem skeleton; lista vazia enquanto carrega; “pensando…” no chat | Cliente; `app.js:96-103,153-164,266` | **Implementar — P1** | Skeleton na lista e no chat; controles desabilitados durante carga; sem salto de layout; erro não parece lista vazia |
| 22 | Erros, reconexão e offline | Toasts e bolha de erro; sem banner offline; retomada por polling | S1/S2: erros HTTP e eventos de run; `app.js:406-444` | **Implementar — P1** | Banner offline/reconectando; retry inline em falha de lista/mensagens; run retomado sem duplicar; 401 leva ao login |
| 23 | Acessibilidade | Vários `aria-label`; falta `aria-live`, foco em modais, teclado no sheet e reduced motion | Cliente; `report/03 §4` | **Implementar — P2** | Navegação por teclado; foco preso em modal; `aria-live` em mensagens/status; contraste AA; `prefers-reduced-motion` |
| 24 | Aprovações | Card com once/session/always/deny; expira ao terminar | S1/S2; `app.js:231-264` | **Implementar — P1 (validação e robustez)** | Quatro escolhas funcionam; erro 409 é explicado; card expira; foco e leitor de tela acessíveis |
| 25 | Parar execução | Não há botão; run continua no servidor | S2: `run_stop`; S1: `POST /v1/runs/{id}/stop` | **Implementar — P2** | Botão “Parar” durante run; status vira cancelado; UI não deixa run órfão; falha mostra estado |
| 26 | Retomada em segundo plano | Runs em `/v1/runs`, localStorage, polling e `visibilitychange` | S1/S2; `app.js:347-467` | **Implementar — P1 (endurecer)** | Recarregar/fechar e voltar retoma; não duplica mensagem; expiração de 2 h explicada; erro de rede não perde run |
| 27 | Agentes/perfis | Seletor, modelo, multiplex e autorização por agente | S9/profiles; `app.js:638-663`; `plugin_api.py:155-181` | **Implementar — P2 (estado e erro)** | Perfil ativo visível; troca recarrega sessões; falta de multiplex explicada; sem seletor falso |
| 28 | Instalação PWA | Manifest, SW, QR e aba do painel | `index.html`, `manifest.webmanifest`, `sw.js`; S6 | **Implementar — P3 (verificação)** | Instalação em Android/iOS documentada; atualização do SW não prende código antigo; QR abre o app |
| 29 | Push/notificações | Sem push; polling de 12/30 s | S1/S3 não oferecem push web | **Não incluir** | Não prometer push; manter polling e indicar a limitação |
| 30 | Recibos de leitura | Não existem; `run.completed` não é leitura | S7 não tem recibo por mensagem; S1 só informa execução | **Não incluir** | Não exibir duplo check; não rotular conclusão de run como “lida” |
| 31 | Reações | Não existem no chat do PWA | S9 platform actions só Telegram/Discord | **Não incluir** | Sem botão de reação enquanto não houver contrato no chat |
| 32 | Chamadas e status | Não existem | S1/S2/S7 não oferecem chamadas, presença ou status | **Não incluir** | Sem ícones de telefone/vídeo/status decorativos |
| 33 | Grupos/comunidades e fotos | Apenas badge de origem; sem gestão nem foto | S7 expõe `source`; não há gestão de grupo nem avatar de contato | **Não incluir** | Manter origem como texto; não criar tela de grupo/foto |
| 34 | Separadores de data e agrupamento | Só horário por mensagem | Cliente; `app.js:199-228` | **Implementar — P2** | Separador por dia; agrupamento visual sem alterar conteúdo; datas corretas no fuso local |
| 35 | Emoji/câmera no composer | Sem botão de emoji; anexo abre seletor do sistema | Sem contrato de emoji; câmera pode usar `capture` do navegador, não API | **Não incluir por agora** | Não adicionar emoji decorativo; câmera só se o fluxo de anexo existente já cobrir |

## 6. Priorização recomendada

### Fase 5A — fundação funcional (P1)

1. Validar contratos reais antes da UI: busca de sessões, `pinned`, `run_stop` e `/api/audio/transcribe`.
2. Implementar busca no histórico com fallback local.
3. Implementar paginação da lista e ação de fixar.
4. Completar estados de carregamento, erro, offline e reconexão.
5. Ajustar composer, anexos/PDF, áudio e transcrição.
6. Fortalecer aprovações e retomada de runs.
7. Testar responsividade e teclado em 320–1280 px.

### Fase 5B — leitura e identidade (P2)

1. Hierarquia da lista e cabeçalhos.
2. Avatares determinísticos.
3. Tema Auto/Claro/Escuro local.
4. Copiar mensagem, separadores de data e acessibilidade.
5. Estado/erro do seletor de agentes.
6. Parar execução.

### Fase 5C — polimento (P3)

1. Empty states.
2. Filtro “Fixadas”.
3. Onda de áudio e cópia de blocos de código.
4. Verificação de instalação PWA e atualização do service worker.

## 7. O que não será feito

- Não adicionar câmera, chamada, vídeo, status ou “online” sem API real.
- Não adicionar badge de não lidas, contagem ou duplo check sem dados de leitura.
- Não adicionar reações, respostas citadas, encaminhamento ou edição de mensagem sem contrato.
- Não criar fotos de contato ou grupos fictícios.
- Não exibir “digitando” remoto; o indicador atual é apenas estado local de execução.
- Não sincronizar o tema do PWA com o tema do dashboard; o PWA tem CSS próprio.
- Não substituir o upload de arquivos por uma prévia de PDF; o Hermes recebe o arquivo e o agente o lê por ferramentas.
- Não usar `run.completed` como prova de entrega ou leitura.

## 8. Critérios globais de aceitação

- Toda ação visível deve chamar um endpoint real ou executar uma função local verificável.
- Toda chamada assíncrona deve ter estado de carregamento, sucesso, vazio e erro.
- Nenhum botão pode existir apenas para “parecer WhatsApp”.
- Testes mínimos: 320, 360, 390, 768, 900 e 1280 px; claro/escuro; teclado aberto; rede lenta; 401; offline; run retomado.
- Testes de contrato: busca, `pinned`, `run_stop`, upload, transcrição e aprovação.
- Acessibilidade: foco, teclado, `aria-live`, contraste AA e `prefers-reduced-motion`.
- Performance: lista de 100 sessões e conversa de 500 mensagens sem travar a rolagem.
- Nenhum dado pessoal de prints privados deve entrar em código, fixture ou captura pública.

## 9. Riscos e dependências

| Risco | Mitigação |
|---|---|
| `/api/sessions/search` é rota do dashboard, não do API server do gateway | Chamar na mesma origem; perfil explícito; fallback para busca local; testar antes da UI |
| `pinned`/`archived`/`unread` estão no código do gateway, mas a documentação do API server está defasada | Teste de contrato; se o host recusar, esconder a ação e registrar |
| `archived` não tem listagem/restauração clara no gateway | Não implementar arquivamento até existir caminho de restauração |
| `/api/audio/transcribe` é endpoint do dashboard e `audio_api` é `false` no gateway | Manter fallback sem transcrição; timeout; não bloquear o envio do áudio |
| Upload de 25 MB em memória no celular | Limite, feedback, compressão de imagem e teste em dispositivo antigo |
| Tema do dashboard ≠ tema do PWA | Deixar claro que o toggle é local ao PWA; não prometer sincronização |
| Sem push, sem recibos e sem reações | Documentar como limitações; não simular |
| Regressão de acessibilidade com novos menus | Foco preso, teclado, rótulos e testes com leitor de tela |

## 10. Conclusão

O TREG já tem o núcleo funcional de um mensageiro: lista, busca local, conversa, streaming, runs em segundo plano, aprovações, imagens, arquivos, áudio, transcrição, perfis e PWA.

O que falta é principalmente **acabamento funcional e visual**, não uma reescrita:

- busca no histórico e paginação;
- fixação de conversas;
- estados de carregamento, erro e reconexão;
- composer, anexos e áudio mais claros;
- responsividade e acessibilidade;
- tema manual;
- hierarquia visual e avatares.

Recursos como não lidas, recibos, reações, chamadas e status **não devem ser implementados** enquanto não houver contrato real no Hermes. A regra é simples: se a capacidade não existe, a UI não deve fingir que existe.

## 11. Próxima ação

Revisar este relatório e autorizar ou rejeitar a Fase 5A. Nenhuma implementação deve começar antes dessa revisão.
