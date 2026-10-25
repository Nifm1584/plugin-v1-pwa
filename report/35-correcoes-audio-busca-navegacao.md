# 35 — Correções de áudio, busca de conversas e navegação no chat

**Data:** 2026-10-25<br>
**Fase:** 4E — correções de áudio, busca e navegação<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch-base:** `feat/treg-pwa-identidade-whatsapp`<br>
**Commit-base:** `78a8eb2cbcfefd26c82a7d48dce0c4475e021ef5`<br>
**Branch de implementação:** `feat/treg-pwa-correcoes-audio-busca-chat`<br>
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-fixes-dev`

## 1. Base, escopo e confirmação inicial

Antes de editar:

- o repositório, o SHA-base e o estado do Git foram confirmados;
- o SHA-base remoto `78a8eb2cbcfefd26c82a7d48dce0c4475e021ef5` correspondia à branch `feat/treg-pwa-identidade-whatsapp`;
- os relatórios 32, 33 e 34 foram lidos;
- o código atual de `index.html`, `app.js`, `app.css`, `hermes-api.js` e dos testes foi inspecionado;
- a branch `feat/treg-pwa-correcoes-audio-busca-chat` foi criada explicitamente a partir do SHA-base, em worktree isolada e limpa.

A implementação ficou restrita às quatro correções pedidas. Não foram alterados o core do Hermes, o plugin original `hermes-pwa`, o backend, `dashboard/plugin_api.py`, `plugin.yaml`, `dashboard/dist/`, a versão `1.8.0b1`, o avatar/IndexedDB, o FAB, os temas ou os menus já validados, exceto a integração estritamente necessária.

## 2. Diagnóstico das causas reais

### 2.1 Transcrição de áudio sempre aberta

No código anterior, `bubble()` montava o bloco `.voice` já com:

- o player;
- a transcrição (ou “sem transcrição”) diretamente visível;
- nenhum menu de três pontos por áudio.

A bolha otimista do áudio recém-gravado repetia o mesmo padrão e mostrava “transcrevendo…” aberto. Não havia estado por mensagem para mostrar/ocultar a transcrição. A correção não podia ser só CSS: era necessário renderizar a transcrição oculta e criar um controle próprio para cada áudio.

### 2.2 Busca de conversas

Foram encontradas causas combinadas:

1. **A busca remota substituía a busca local.** Com dois ou mais caracteres, `performSearch()` definia `state.searchResults` apenas com `d.items` da API e `sessionListItems()` passava a usar exclusivamente essa lista. A busca local por título só era usada com menos de dois caracteres, como fallback de erro ou quando a API não existia.
2. **A rota de busca do Hermes é FTS de conteúdo de mensagens.** Em versões em que a rota não inclui a faixa suplementar de títulos, uma conversa renomeada cujo nome não aparece no texto das mensagens não é devolvida pelo servidor. Mesmo em versões com faixa de títulos, ela é suplementar e pode ficar fora do `limit`. O título local existia, mas era descartado ao renderizar a busca.
3. **Renomear atualizava apenas uma referência.** O handler fazia `s.title = t.trim()` no objeto do `sheet` e não atualizava, pelo mesmo `id`, a cópia em `state.sessions` e em `state.searchResults`. O título retornado pelo `PATCH` era ignorado.
4. **Resultados remotos não tinham o perfil aplicado.** `searchHistory()` devolve resultados normalizados sem `profile`. Ao abrir um resultado de um agente secundário, `loadMessages()` podia consultar o perfil `default`, misturando históricos.
5. **Abrir resultado remoto não o integrava à lista local.** O resultado só existia em `state.searchResults`; o envio de uma mensagem nele podia não atualizar a prévia da lista até o próximo carregamento.
6. **A mesclagem podia apagar um título local.** `mergeSessions()` deixava um `title` vazio da resposta sobrescrever um título salvo localmente.
7. **A busca estava visualmente fora do cabeçalho.** O campo ficava sempre abaixo do seletor de agente; não havia lupa no cabeçalho.

### 2.3 Rolagem do chat

- `renderMessages()` já decidia se deveria manter a posição, mas ainda não preservava explicitamente o `scrollTop` em uma re-renderização.
- `runEvent()` chamava `scrollBottom()` incondicionalmente em `message.delta`, `run.completed`, `run.failed` e `run.cancelled`.
- `approvalCard()` também chamava `scrollBottom()` incondicionalmente.
- Não existia botão para voltar ao fim da conversa.

Assim, quem estava lendo mensagens antigas podia ser levado ao fim durante a resposta do agente, e não havia atalho para retornar quando novas mensagens chegassem.

### 2.4 Envio do áudio gravado

A causa principal estava em `MediaRecorder.onstop`:

```js
attachAudio(blob, type, dur);
if (!state.streaming) send();
```

O microfone, além de encerrar a gravação, chamava `send()` automaticamente. O fluxo desejado é gravar, anexar e enviar somente pela seta. Além disso:

- o botão de envio não tinha um estado `sending` próprio;
- o envio limpava `state.attachments` antes do upload;
- em falha de upload, a bandeja era restaurada, mas a bolha otimista permanecia, como se a mensagem tivesse sido enviada;
- não havia proteção explícita contra dois submits no intervalo anterior ao estado de streaming.

## 3. Arquivos alterados e motivo

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/app.js` | Busca local+remota com perfil, atualização de título por `id`, sequência de carregamento de sessões, lupa e abertura/fechamento da busca, seta de rolagem, menu por áudio, transcrição oculta, preservação de scroll, estado de gravação/envio, remoção de mensagem otimista em falha |
| `dashboard/pwa/index.html` | Lupa `#btn-search` entre avatar e menu; linha `#search-row` oculta abaixo do cabeçalho; seta `#btn-scroll-bottom` dentro de `.messages-wrap`; correção do rótulo “Mais opções” |
| `dashboard/pwa/app.css` | `.messages-wrap`, `.scroll-bottom`, menu de áudio, transcrição oculta, nota de indisponibilidade, espaço de 40 px no player para a seta em telas estreitas |
| `dashboard/pwa/hermes-api.js` | `mergeSessions()` preserva título local não vazio; nova `mergeSearchSessions()` com mesclagem local/remota, deduplicação, título local e perfil |
| `dashboard/pwa/sw.js` | Cache do service worker atualizado de `treg-pwa-v3` para `treg-pwa-v4`, necessário para distribuir os arquivos alterados a um PWA já instalado |
| `tests/ui-contract.test.js` | Contratos dos novos IDs, busca, seta, menu de áudio, ausência de auto-envio e versão do SW |
| `tests/hermes-api.test.js` | Testes da mesclagem de busca, precedência do título local, deduplicação, perfil e preservação de título na mesclagem de sessões |

Neste commit de implementação não foram alterados `plugin_api.py`, `plugin.yaml`, `dashboard/dist/`, README, versão ou qualquer arquivo de build.

## 4. Correção 1 — Transcrição oculta e menu por áudio

### Antes

- Player e transcrição apareciam juntos.
- Áudio sem transcrição exibia uma linha fixa.
- Não havia menu de três pontos por áudio.
- A bolha local recém-enviada exibia “transcrevendo…” aberto.

### Depois

- O player continua visível.
- O texto da transcrição começa com `.hidden`; não aparece até uma ação explícita.
- Cada bloco de áudio tem seu próprio botão de três pontos (`.voice-menu-btn`), com nome acessível, `aria-haspopup="menu"`, `aria-expanded` e `aria-controls` únicos.
- O menu contém:
  - **Mostrar transcrição**, quando há texto e ele está oculto;
  - **Ocultar transcrição**, quando está visível;
  - **Transcrição indisponível**, desabilitado, quando não há texto;
  - **Aguardando transcrição**, desabilitado, enquanto o áudio local está sendo transcrito.
- A nota “Sem transcrição disponível” fica visível para áudio sem transcrição, sem inventar conteúdo.
- O menu atua somente no bloco de áudio em que foi aberto. Ao abrir outro menu, o anterior fecha.
- O áudio recém-enviado usa o mesmo componente; quando a transcrição chega, o nó local é atualizado e a transcrição continua oculta.
- Mensagens antigas continuam usando `parseUserText()` e a mesma estrutura persistida. Nenhum campo ou endpoint foi alterado.

## 5. Correção 2 — Lupa no cabeçalho e busca correta

### Antes

- O campo “Buscar conversa” ficava sempre na lista.
- A busca remota substituía a local.
- Nome renomeado podia não aparecer.
- Resultado de perfil secundário podia abrir o histórico errado.

### Depois

- A lupa `#btn-search` fica no cabeçalho, entre o avatar e o menu de três pontos. Ela preserva o avatar e o menu.
- O campo fica em `#search-row`, inicialmente oculto, logo abaixo do cabeçalho e acima do seletor de agente. A lupa revela o campo e o foca; clicar de novo, ou pressionar Escape, fecha e limpa a busca.
- O layout em 320 px mediu: avatar `10–44`, lupa `234–272`, menu `274–312`; sem overflow horizontal.
- A linha de busca aberta mediu `0–320` e o input `10–310` em 320 px; sem overflow.
- O campo continua sendo `#search` e continua disparando a mesma busca com debounce.

### Busca e títulos

- `localSearch()` sempre pesquisa o título atual, a prévia e a origem nas sessões carregadas.
- `performSearch()` começa com os resultados locais e, quando a API responde, mescla local + remoto por `id`; um resultado remoto não elimina mais os títulos locais.
- `mergeSearchSessions()`:
  - deduplica por `session.id`;
  - aplica o perfil atualmente selecionado;
  - preserva o título local não vazio sobre um título remoto antigo;
  - preserva o trecho remoto quando disponível;
  - mantém resultados locais e remotos que não tenham par.
- `mergeSessions()` não deixa mais um `title` vazio apagar um título salvo.
- O `PATCH` de renomeação usa o `title` devolvido pelo servidor (quando presente) e atualiza, por `id`, `state.sessions`, `state.searchResults` e a sessão aberta. O novo nome aparece imediatamente na lista e passa a ser usado pela busca.
- Ao abrir um resultado, ele é incorporado a `state.sessions`; o histórico é carregado com o `profile` do resultado, inclusive para sessões fora da primeira página.
- O perfil é enviado na busca e no carregamento de sessões; a troca de agente fecha a conversa aberta e limpa a busca, evitando mistura de perfis.
- `sessionsSeq` impede que uma resposta antiga de paginação/perfil sobrescreva a lista do perfil atual.
- Apagar uma conversa remove o item de `state.sessions` e de `state.searchResults`.
- Após envio, `finishRun()` atualiza prévia, trecho e atividade nas duas listas.

### Limite conhecido da busca

A busca em sessões fora das 80 carregadas depende do endpoint de busca do servidor. Em versões antigas que só indexam conteúdo de mensagens, um título renomeado que não apareça em nenhuma mensagem e esteja fora da primeira página não pode ser garantido sem varrer todas as páginas; isso não foi feito, para não quebrar o mecanismo de paginação nem inventar endpoint. O teste com API simulada cobriu resultado remoto além da primeira página e a mesclagem com o título local.

## 6. Correção 3 — Seta para a última mensagem

### Antes

- Não havia controle.
- O streaming chamava `scrollBottom()` mesmo com a pessoa lendo o histórico.
- A re-renderização podia perder a posição.

### Depois

- `#btn-scroll-bottom` fica dentro de `.messages-wrap`, acima do composer e fora da lista de conversas.
- `updateScrollButton()` mostra a seta quando a distância até o fim é maior que 80 px e a esconde quando a pessoa já está no fim.
- A seta tem `aria-label="Ir para a última mensagem"`, 42×42 px (40×40 em 320 px) e foco visível.
- O clique chama `scrollBottom()` e esconde a seta.
- `renderMessages()` preserva `scrollTop` quando a pessoa não está no fim.
- `runEvent()` calcula `follow` antes de atualizar delta, conclusão, erro ou cancelamento; só rola automaticamente se a pessoa estava no fim.
- `approvalCard()` segue a mesma regra.
- A seta continua aparecendo quando chegam mensagens novas enquanto a pessoa está lendo o histórico.
- Ela se oculta quando um menu de áudio está aberto, para não cobrir o próprio menu.

### Geometria validada

| Viewport | Seta | Composer | Player de áudio |
|---|---:|---:|---:|
| 320×568 | `x=270–310`, `y=455–495` | topo `505` | borda direita `241` |
| 390×844 | `x=336–378`, `y=729–771` | topo `781` | borda direita `311` |
| 1280×800 | `x=1226–1268`, `y=685–727` | topo `737` | borda direita `1201` |

A seta não intersecciona o player, o composer, o botão de enviar nem o microfone nesses tamanhos. Em 320 px, o player tem margem direita reservada para a seta; os controles continuam visíveis e utilizáveis.

## 7. Correção 4 — Gravação, anexo e envio pela seta

### Antes

- Ao parar a gravação, `rec.onstop` chamava `attachAudio()` e depois `send()` automaticamente.
- O microfone podia funcionar como envio.
- Não havia guarda `sending`.
- Em falha de upload, a bolha otimista permanecia.

### Depois

1. O microfone inicia a gravação via `getUserMedia`/`MediaRecorder`.
2. Enquanto grava:
   - `#rec` e o ponto piscante aparecem;
   - o botão do microfone fica vermelho, com `aria-pressed="true"` e rótulo “Parar gravação”;
   - o botão de enviar fica desabilitado;
   - o botão de microfone continua habilitado para encerrar;
   - “Cancelar” chama `stopRecording(true)`.
3. Ao encerrar pelo microfone:
   - as trilhas são interrompidas;
   - o timer para;
   - o áudio vira `File` e entra em `state.attachments`;
   - a bandeja mostra o áudio pendente;
   - **`send()` não é chamado**;
   - o toast informa “Áudio pronto. Toque em enviar.”.
4. Ao tocar na seta:
   - o submit normal chama `send()`;
   - o upload e a transcrição são feitos;
   - o corpo com o caminho e a transcrição é montado;
   - a execução é criada e o histórico é sincronizado.
5. Texto + áudio funcionam juntos; o texto é preservado e o corpo contém os dois.
6. `state.sending` e `state.streaming` desabilitam a seta; `state.micBusy` desabilita o microfone durante a inicialização/parada. Dois submits são bloqueados.
7. Se o upload falhar antes de existir `runId`:
   - a bolha otimista é removida de `state.messages` e do DOM;
   - o áudio volta para a bandeja;
   - o texto volta para o composer, se o campo estiver vazio;
   - aparece uma bolha de erro e um toast;
   - nenhuma execução é criada;
   - o botão de enviar volta ao estado normal.
8. O microfone nunca envia; cancelamento não cria anexo.

## 8. Testes automatizados

| Comando/teste | Resultado real |
|---|---|
| `npm.cmd run test:ui` | **PASS** |
| `npm.cmd run test:api` | **PASS** (inclui `mergeSearchSessions` e preservação de título) |
| `npm.cmd run test:uiutils` | **PASS** |
| `npm.cmd run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` (venv do projeto) | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `node --check` em `app.js`, `hermes-api.js`, `ui-utils.js`, `sw.js` e testes | **OK** |
| `git diff --check` | **OK** |

Os testes Node usaram `npm.cmd` porque `npm.ps1` está bloqueado pela política do PowerShell. A dependência de teste `jsqr` foi instalada apenas em `tests/node_modules` (ignorada), conforme o fluxo anterior; nenhuma dependência de runtime foi adicionada. Pytest foi executado pela venv `treg-test-venv` porque o Python global não tem pytest.

## 9. Validação em navegador

Foi usado Chromium via Playwright contra um servidor HTTP local com **API simulada**. **Não foi uma execução contra o Hermes real.**

### 9.1 Busca

- Base carregada: 80 sessões.
- Busca `nome atual`:
  - a API simulada devolveu um resultado remoto com título antigo;
  - a lista mostrou **“Nome atual salvo”**, título local correto;
  - o resultado abriu a conversa e o histórico correto.
- Renomeação para **“Conversa Renomeada”**:
  - o novo nome apareceu imediatamente na lista;
  - a busca pelo novo nome encontrou a conversa;
  - após recarregar, o servidor devolveu o título persistido e a lista continuou correta.
- Limpar a pesquisa restaurou as 80 conversas.
- Perfil `work`:
  - lista com 2 conversas do trabalho;
  - busca enviou `profile=work`;
  - resultado abriu somente histórico do trabalho;
  - trocar de perfil fechou a conversa aberta e não misturou sessões.
- Resultado remoto além da primeira página (`s-remote`) foi aberto com o histórico correto, confirmando que o perfil acompanha o resultado.

### 9.2 Transcrição

- Histórico com dois áudios:
  - os dois players apareceram;
  - as duas transcrições começaram ocultas;
  - cada áudio tinha seu menu de três pontos;
  - “Mostrar transcrição” revelou somente a transcrição do primeiro;
  - o segundo continuou oculto;
  - “Ocultar transcrição” voltou a ocultar o primeiro;
  - o segundo exibiu “Sem transcrição disponível” e opção desabilitada.
- Áudio recém-enviado: player presente, transcrição oculta, menu disponível e opção “Mostrar transcrição”.
- Abrir o menu de um áudio ocultou a seta de rolagem para não cobrir o menu.

### 9.3 Rolagem

- A 390×844, com `scrollTop=0`, a seta apareceu; o clique levou a `scrollTop=scrollHeight-clientHeight` e ela desapareceu.
- Com a pessoa no topo, uma recarga de mensagens via `visibilitychange` adicionou uma mensagem e manteve `scrollTop=0`; a seta permaneceu visível.
- Com o streaming simulado (2 s de atraso no SSE), a pessoa foi ao topo antes dos eventos `message.delta`/`run.completed`; a posição permaneceu no topo e a seta apareceu.
- Com a pessoa no fim, o streaming manteve a distância do fim em 0.
- A 320/390/1280, a seta ficou acima do composer e não interseccionou o player de áudio.

### 9.4 Áudio

- Microfone iniciou; indicador apareceu; enviar ficou desabilitado.
- Parar pelo microfone criou o anexo pendente e **não** fez upload nem execução.
- Cancelar removeu a gravação e não criou anexo.
- Setar enviou áudio isolado; upload e transcrição foram registrados; a mensagem entrou no histórico.
- Texto + áudio enviou os dois; o corpo da execução continha o texto e o bloco de áudio com transcrição.
- Dois submits síncronos geraram **um único** upload e **uma única** execução.
- Falha simulada de upload:
  - nenhuma execução foi criada;
  - a bolha otimista foi removida;
  - o áudio voltou para a bandeja;
  - bolha e toast de erro apareceram;
  - o botão de enviar voltou a funcionar.

### 9.5 Layout, temas e console

- Viewports: **320×568**, **390×844** e **1280×800**.
- Temas: **Auto claro**, **Auto escuro**, **Light** e **Black**.
- Tokens Auto preservados: claro `--accent:#0f8a7e`, `--bg:#f0f2f5`, `--bar:#ffffff`; escuro `--accent:#2bb39a`, `--bg:#0b1416`, `--bar:#0f2f31`.
- Light: `#00a884`, `#f0f2f5`, `#ffffff`; Black: `#00a884`, `#000000`, `#111b21`.
- Capturas de 390 Light/Black e 320 Light/Black inspecionadas diretamente.
- **69 IDs**, **0 duplicados**.
- **0 erros de JavaScript** no carregamento final; 1 aviso pré-existente sobre a meta tag Apple.
- Sem overflow horizontal em 320, 390 ou 1280.
- O FAB, os temas, o avatar local, o menu geral e o menu da conversa permaneceram funcionando.

## 10. O que foi e o que não foi validado no Hermes real

**Validado com API simulada e Chromium:**

- mesclagem de busca local/remota;
- precedência do título local;
- renomeação, limpeza e recarga da lista;
- abertura de resultado e uso do perfil;
- paginação com resultado remoto;
- renderização, ocultação e menu de transcrição;
- fluxo de gravação/envio com `MediaRecorder` falso;
- tratamento de falha de upload;
- rolagem e comportamento da seta;
- layout, temas e acessibilidade básica dos novos controles.

**Não validado no Hermes real:**

- `/api/sessions/search` com banco real, FTS e faixa de títulos;
- renomeação real persistida no gateway;
- upload real, transcrição real e reprodução de áudio real;
- permissão de microfone, formatos de áudio e limite real de 5 minutos em aparelho;
- perfil/gateway multiplexado real;
- PWA instalado, cache `treg-pwa-v4` e modo offline;
- teste em celular físico, teclado virtual, câmera/galeria e zoom de fonte;
- auditoria WCAG completa ou teste exaustivo de hover/focus/disabled;
- CI do GitHub para esta branch; os resultados acima são testes locais.

O player nos testes exibiu 0:00/0:00 porque o stub devolveu áudio sem bytes decodificáveis; isso valida o layout e os controles, não a reprodução real.

## 11. Preservação

Não foram alterados:

- o core do Hermes ou o plugin original `hermes-pwa`;
- `main`, as branches anteriores, as tags ou as releases;
- `plugin.yaml`, `dashboard/plugin_api.py`, `dashboard/dist/` ou a versão `1.8.0b1`;
- o avatar local, IndexedDB, o botão de nova conversa, os temas ou os menus já validados;
- o contrato da API existente. A busca usa `GET /api/sessions/search` já existente; não foi criado endpoint nem campo.

O único ajuste fora dos quatro arquivos funcionais principais foi a atualização do cache do service worker para `treg-pwa-v4`, necessária para que um PWA instalado receba os arquivos alterados. Não houve build em `dashboard/dist/`.

## 12. Git e publicação

- **Commit de implementação:** `d406e4320469a5c585e9bf114e010aaf88a3e3ad`
  - Mensagem: `feat(treg-pwa): corrigir audio busca e navegacao do chat`
  - 7 arquivos alterados, 528 inserções e 81 remoções.
- **Commit deste relatório:** o HEAD final da branch, criado depois da implementação.
- **Branch:** `feat/treg-pwa-correcoes-audio-busca-chat`.
- **SHA final da branch:** o commit deste relatório, informado no resumo de encerramento e conferido no remoto após a publicação.
- **Publicação:** somente esta branch é enviada ao GitHub. Não haverá PR, merge, tag, release, instalação ou deploy.

## 13. Encerramento

- **Fase concluída:** 4E — áudio, busca e navegação.
- **Base:** `78a8eb2cbcfefd26c82a7d48dce0c4475e021ef5`.
- **Branch:** `feat/treg-pwa-correcoes-audio-busca-chat`.
- **Implementação:** `d406e4320469a5c585e9bf114e010aaf88a3e3ad`.
- **Resultado:** transcrição oculta com menu por áudio; busca no cabeçalho com títulos locais + resultados remotos e perfil correto; seta funcional sem cobrir composer/player; microfone prepara o áudio e a seta envia, com erro real e sem envio automático.
- **Testes:** UI, API, UI utils, QR 3/3, pytest 7 passed, `py_compile`, `node --check`, `git diff --check`; Playwright com API simulada em 320/390/1280 e Auto/Light/Black.
- **Pendências:** Hermes real, dispositivo físico, áudio/transcrição reais, busca FTS real, PWA instalado/offline, validação de teclado e auditoria de acessibilidade.
- **Caminho completo:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-fixes-dev\report\35-correcoes-audio-busca-navegacao.md`.
- **Próximo passo:** revisar este relatório e validar no Hermes real/celular antes de qualquer fase posterior. Não avançar automaticamente.
