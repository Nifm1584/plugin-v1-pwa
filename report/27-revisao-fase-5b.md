# 27 — Revisão técnica da Fase 5B

## 1. Escopo

Revisar a implementação visual da Fase 5B antes de qualquer publicação, confrontando o código, o relatório 26, os testes e o estado do Git.

Esta revisão não alterou código, testes, manifestos, relatórios anteriores, `main`, C7, tag, Release ou VPS. Não houve commit, push, merge, instalação ou deploy.

## 2. Estado do projeto

| Item | Valor |
|---|---|
| Repositório | `Nifm1584/plugin-v1-pwa` |
| Branch | `feat/treg-pwa-fase-5a-p1` |
| Commit-base | `52418ca89b9e0b51000c315a261cdf07bca2f59b` |
| HEAD | `52418ca89b9e0b51000c315a261cdf07bca2f59b` |
| Alterações da Fase 5B | Não commitadas no worktree |
| Commits da Fase 5B | Nenhum |
| Push/merge da Fase 5B | Nenhum |

Arquivos modificados/não rastreados incluem `plugin.yaml`, `dashboard/manifest.json`, `dashboard/dist/index.js`, `dashboard/plugin_api.py`, `dashboard/pwa/*`, `README.md`, testes, workflow e `report/26-implementacao-fase-5b-visual.md`.

## 3. Verificação de identidade

**Aprovado.**

- `plugin.yaml` declara `1.8.0b1`.
- `dashboard/manifest.json` declara `1.8.0b1`.
- `dashboard/dist/index.js` mostra `TREG 1.8.0b1 · Fase 5B — teste visual`.
- Configurações do app mostram `TREG · Fase 5B · 1.8.0b1`.
- `README.md` registra a versão de teste.
- Nenhum SHA é usado como versão.
- O nome do plugin permanece `treg-pwa`; a versão distinta permite reconhecer a instalação de teste sem confundir com `1.7.1`.

## 4. Auditoria funcional

### 4.1 Copiar mensagem

**Aprovado por código e testes unitários; validação real pendente.**

- `bubble()` adiciona ação para mensagens de usuário e assistente com texto.
- O texto do usuário usa `parseUserText().text`, excluindo marcadores de áudio/arquivo.
- O texto do assistente usa o conteúdo textual, não HTML nem botões.
- `ui.copyText()` tenta Clipboard API e tem fallback por `textarea`/`execCommand`.
- Sucesso e falha geram toast.
- `addCopyAction()` é reaplicado após updates de streaming, evitando perder o botão quando o HTML é reescrito.
- Teste `ui-utils` cobre clipboard, fallback, texto vazio e versão.
- Não foi testado em dispositivo real nem com permissão de clipboard negada no navegador.

### 4.2 Tema

**Aprovado por código e testes unitários; validação visual pendente.**

- Opções Auto/Claro/Escuro em Configurações.
- Preferência em `localStorage` com chave exclusiva `treg-pwa-theme`.
- Auto usa `prefers-color-scheme`; mudanças do sistema são escutadas.
- `data-theme` controla as variáveis CSS.
- Script inline aplica o tema antes do CSS.
- `meta theme-color` é atualizado.
- Não há sincronização com o tema do dashboard.
- Testes cobrem normalização e resolução `auto`.
- Contraste real em todos os componentes e persistência em PWA instalado não foram validados.

### 4.3 Datas

**Aprovado com ressalva média.**

- `ui.groupMessages()` agrupa por dia local; `Hoje`/`Ontem` e data por extenso.
- Mensagens sem timestamp não recebem separador inventado.
- O histórico recarregado recebe separadores.
- O conteúdo e a ordem das mensagens não são alterados pela função.

**Ressalva:** novos envios e mensagens de streaming são anexados diretamente ao DOM (`app.js:543`, `app.js:599`, `app.js:614`) sem chamar `renderMessages()` (`app.js:417`). O separador aparece depois de uma recarga, polling ou `loadMessages` no fim do run; não aparece imediatamente quando uma nova mensagem começa um novo dia durante a sessão.

### 4.4 Avatares, layout e acessibilidade

**Aprovado por código; validação visual pendente.**

- Iniciais derivadas do título com fallback para origem.
- Cores determinísticas por origem; nenhuma foto inventada.
- Avatar compacto no cabeçalho do chat.
- Título da lista em 15 px, prévia em 14 px e metadados em 12 px.
- CSS de até 380 px compacta ações, metadados e avatar do chat.
- Foco visível, `aria-pressed` nos temas, `aria-label` no copiar e `role="separator"` nas datas.
- O painel de Configurações cresceu com o bloco de tema; não há `max-height`/`overflow` no `.sheet-card` (`app.css:106`). Em alturas curtas isso pode exigir rolagem ou cortar conteúdo. Não foi confirmado sem navegador real.

### 4.5 Service worker e cache

**Aprovado.**

- `VERSION` passou para `treg-pwa-v3`.
- `ui-utils.js` está no `SHELL` e em `_STATIC`.
- `index.html` carrega `ui-utils.js` antes de `hermes-api.js` e `app.js`.
- O activate remove caches antigos.
- Rotas de API não são cacheadas.
- Teste de contrato cobre versão, inclusão no SW e ordem dos scripts.
- Atualização real de um PWA instalado não foi validada.

### 4.6 Compatibilidade e regressões da Fase 5A

**Aprovado por leitura e testes; sem validação real no Hermes.**

- Busca remota/local, paginação, pin, anexos, áudio, transcrição, aprovações, retomada e stop continuam no código.
- A camada de API continua centralizando caminhos; os testes de caminhos passam.
- `app.js` não faz `fetch` direto.
- Não foram introduzidos endpoints novos sem contrato.
- Não foram encontrados usos de `innerHTML` com conteúdo não escapado nos novos textos; o botão de copiar não injeta o texto em HTML.
- O teste visual anterior com Browser MCP permanece inválido por timeout; nenhuma validação de navegador foi inventada.

## 5. `dashboard/dist/index.js`

Não há fonte de build no repositório (`dashboard` contém apenas `dist/`, `manifest.json` e `plugin_api.py`). O arquivo é mantido diretamente.

- A versão `1.8.0b1` foi adicionada à página de instalação.
- Não há evidência de que o arquivo seja gerado por outro fonte fora do repositório.
- A ausência de build é uma dívida de manutenção baixa: manifest, versão do painel e app são mantidos em pontos separados.

## 6. Achados classificados

| ID | Gravidade | Arquivo / função | Evidência | Impacto | Correção recomendada |
|---|---|---|---|---|---|
| M1 | **Médio** | `dashboard/pwa/app.js:543`, `:599`, `:614`; `renderMessages` `:417` | Envios e deltas anexam bolhas diretamente; só `renderMessages` insere separadores | Novo dia pode ficar sem separador até recarregar/poll/fim do run | Inserir separador antes da bolha local/streaming ou reutilizar um helper de renderização incremental |
| M2 | **Médio** | `dashboard/plugin_api.py:114` | Manifest PWA fixa `background_color` escuro e `theme_color` escuro | Splash/instalação no tema claro pode usar cores escuras, apesar do app claro | Usar cores neutras ou gerar valores coerentes com o tema quando o manifest for dinâmico |
| B1 | **Baixo** | `app.css:106` | `.sheet-card` sem `max-height`/`overflow`; painel cresceu com tema e versão | Risco de corte em telas curtas; não confirmado | Validar em 320×480/390×844 e adicionar rolagem se necessário |
| B2 | **Baixo** | `dashboard/dist/index.js:148`; manifest/plugin/UI | Versão repetida em quatro pontos, sem fonte de build | Risco de divergência futura | Centralizar a versão em um arquivo de build ou documentar a sincronização manual |

Não foram encontrados defeitos **bloqueadores** ou de gravidade **Alta** confirmados por código ou testes.

## 7. Testes executados

### Git

```text
git diff --check
```

Resultado: **OK**, sem erros de whitespace.

### Sintaxe

```text
node --check dashboard/pwa/app.js
node --check dashboard/pwa/ui-utils.js
node --check dashboard/pwa/hermes-api.js
node --check dashboard/pwa/sw.js
node --check dashboard/dist/index.js
node --check tests/ui-utils.test.js
node --check tests/ui-contract.test.js
node --check tests/hermes-api.test.js
node --check tests/qrcode.test.js
```

Resultado: **OK**.

### Node

```text
npm.cmd run test:api
npm.cmd run test:ui
npm.cmd run test:uiutils
npm.cmd run test:qrcode
```

Resultados reais:

- API: **PASS**.
- UI contract: **PASS**.
- UI utils: **PASS** — cópia, tema, versão, avatares e datas.
- QR: **3/3 PASS**.

### Python

Em venv limpo com `pytest`, `pyyaml`, `fastapi` e `pydantic`:

```text
6 passed
```

`python -m py_compile dashboard/plugin_api.py __init__.py` passou.

### Navegador / Hermes

- Browser MCP: **timeout de 30 s** na tentativa anterior; nenhuma validação visual realizada.
- Hermes real: **não executado**.
- Clipboard e tema em dispositivo real: **não executados**.
- Atualização de PWA instalado: **não executada**.

Testes Node/Python usam mocks para contratos HTTP; não comprovam comportamento no Hermes vivo.

## 8. Conclusão

**APROVADO PARA PREPARAR A PUBLICAÇÃO.**

Não há falha bloqueadora ou de gravidade Alta confirmada. A identificação `1.8.0b1`, cópia, tema, datas, avatares e cache estão coerentes por código e testes automatizados.

Limitações conhecidas antes da publicação:

- separadores de data não são imediatos em mensagens locais/streaming (M1, Médio);
- manifest PWA ainda usa cores escuras fixas (M2, Médio);
- painel de configurações precisa de validação em telas curtas (B1, Baixo);
- versão é repetida sem build centralizado (B2, Baixo);
- validação visual, Hermes real, PWA instalado e clipboard em dispositivo continuam pendentes.

Nenhum código, teste, manifesto ou relatório anterior foi alterado nesta revisão. Nenhum commit ou push foi feito.
