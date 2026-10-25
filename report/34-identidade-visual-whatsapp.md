# 34 — Identidade visual WhatsApp: Light e Black

**Data:** 2026-10-24<br>
**Fase:** 4D — identidade visual e seleção de temas<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch-base:** `feat/treg-pwa-avatar-foto-local`<br>
**Commit-base:** `c62d513c73fba065e60b115f8959e16ba47bdb7b`<br>
**Branch de implementação:** `feat/treg-pwa-identidade-whatsapp`<br>
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-theme-dev`

## 1. Base e escopo

- O commit-base `c62d513c73fba065e60b115f8959e16ba47bdb7b` foi confirmado no remoto e corresponde ao HEAD da branch `feat/treg-pwa-avatar-foto-local`.
- O relatório 33 e os contratos de tema existentes foram lidos.
- A branch `feat/treg-pwa-identidade-whatsapp` foi criada a partir do commit-base, em worktree isolada.
- A worktree inicial estava limpa, no commit-base.
- A branch da Fase 4C e as branches anteriores permaneceram intactas.

A alteração ficou restrita a tema, tokens, seletor e testes. Não foram alterados conversas, mensagens, busca, envio de imagens, avatar local/IndexedDB, backend, API, versão, FAB ou menus de conversa.

## 2. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/app.css` | Paletas `auto-light`, `auto-dark`, `light` e `black`; tokens de estados (selected, pressed, hover, code, overlay, toast, chips, inputs, menus, etc.); ajuste responsivo mínimo de largura no chat em 320 px |
| `dashboard/pwa/index.html` | Script inline de tema com `auto-light`/`auto-dark`/`light`/`black`; seletor rotulado **Auto / Light / Black**; migração de `dark` salvo para `black` |
| `dashboard/pwa/ui-utils.js` | Normalização de preferências, resolução de paleta e `themeColor` para Auto/Light/Black; alias legado `dark` → `black` |
| `dashboard/pwa/app.js` | Fallback de `applyTheme` para as novas paletas Auto; nenhuma lógica de conversa alterada |
| `tests/ui-contract.test.js` | Contratos dos três temas, preservação dos tokens atuais e presença das novas paletas |
| `tests/ui-utils.test.js` | Testes de normalização, resolução e cores dos temas |

Não foram alterados `plugin_api.py`, `plugin.yaml`, `dashboard/dist/`, versão, avatar, IndexedDB, FAB, `#btn-menu`/`#sheet` ou fluxos de mensagens.

## 3. Preservação do tema atual

O tema atual cinza e verde foi mantido **exatamente** como o modo **Auto**:

| Token | Auto claro | Auto escuro |
|---|---|---|
| `--bg` | `#f0f2f5` | `#0b1416` |
| `--pane` | `#ffffff` | `#101d20` |
| `--bar` | `#ffffff` | `#0f2f31` |
| `--accent` | `#0f8a7e` | `#2bb39a` |
| `--me` | `#d9fdd3` | `#1f6f5e` |
| `--bot` | `#ffffff` | `#17282b` |
| `--chat-bg` | `#efeae2` | `#0b1416` |
| `data-theme` | `auto-light` | `auto-dark` |

O Auto continua seguindo `prefers-color-scheme` e atualiza a paleta em tempo real. Os valores computados no navegador coincidiram com os valores anteriores.

Decisão de compatibilidade:

- `auto` salvo continua usando o tema atual (cinza/verde) no claro e no escuro.
- `light` salvo passa a usar o novo **Light**.
- `dark` salvo é tratado como **Black** (continua sendo uma preferência escura válida; não fica inválido).
- Valores desconhecidos continuam caindo em `auto`.
- O valor armazenado em `localStorage` não é apagado; a migração é feita na leitura/aplicação.

## 4. Novo tema Light

Paleta principal:

| Token | Valor |
|---|---|
| `--bg` | `#f0f2f5` |
| `--pane` | `#ffffff` |
| `--bar` | `#ffffff` |
| `--text` | `#111b21` |
| `--muted` | `#667781` |
| `--accent` | `#00a884` |
| `--accent-strong` | `#008069` |
| `--me` | `#d9fdd3` |
| `--me-text` | `#111b21` |
| `--bot` | `#ffffff` |
| `--chat-bg` | `#efeae2` |
| `--on-accent` | `#111b21` |

- Superfícies principais brancas, fundo geral claro e verde WhatsApp nos destaques.
- Mensagens enviadas em verde claro `#d9fdd3` com texto `#111b21`.
- Mensagens recebidas em branco, com texto `#111b21`.
- Botões primários, FAB, foco, seleção, tema atual e ações principais usam `#00a884`.
- Texto escuro sobre o verde dos botões para manter contraste.

## 5. Novo tema Black

Paleta principal:

| Token | Valor |
|---|---|
| `--bg` | `#000000` |
| `--pane` | `#000000` |
| `--bar` | `#111b21` |
| `--line` | `#202c33` |
| `--text` | `#e9edef` |
| `--muted` | `#8696a0` |
| `--accent` | `#00a884` |
| `--me` | `#005c4b` |
| `--me-text` | `#e9edef` |
| `--bot` | `#202c33` |
| `--chat-bg` | `#0b141a` |
| `--on-accent` | `#111b21` |

- Fundo principal realmente preto (`#000000`), com `#0b141a`, `#111b21` e `#202c33` nas superfícies secundárias.
- Mensagens enviadas em `#005c4b` com texto `#e9edef`; recebidas em `#202c33`.
- Cabeçalho, menus, inputs, chips, botões e sheets usam `#111b21`/`#202c33` e bordas `#202c33`.
- Toast, overlay, sombra, código e estados de interação têm tokens próprios para o Black.

## 6. Seletor e estados

O seletor em Configurações agora tem:

- **Auto** — identidade atual cinza/verde, seguindo o sistema.
- **Light** — novo visual claro WhatsApp.
- **Black** — novo visual preto WhatsApp.

Foram adicionados/ajustados tokens para:

- seleção e item ativo;
- hover e pressed;
- foco visível (já usando `--accent`);
- botões desabilitados;
- fundos de código, overlays, toast, chips, menus, sheets e inputs;
- selo de agente e mensagens de perigo.

O `meta theme-color` acompanha `auto-light`/`light` (`#ffffff`), `auto-dark` (`#0f2f31`) e `black` (`#000000`).

## 7. Ajuste responsivo necessário

Durante a validação em **320 px** foi encontrado um overflow horizontal pré-existente no chat: a coluna do app estava em 395 px, cortando o botão de menu, o composer e a bolha do usuário. Foram adicionados `min-width: 0` em `.pane` e no `textarea` do composer.

Resultado após o ajuste, com a mesma viewport:

- largura do app: **320 px**;
- largura do chat: **320 px**;
- borda direita da bolha: **310 px**;
- borda direita do botão de enviar: **310 px**;
- sem overflow horizontal.

Esse ajuste é exclusivamente de layout responsivo e foi necessário para as validações de 320 px.

## 8. Testes automatizados

| Teste | Resultado real |
|---|---|
| `npm run test:ui` | **PASS** — contratos de Auto/Light/Black, identidade atual, tokens, avatar e menus |
| `npm run test:api` | **PASS** |
| `npm run test:uiutils` | **PASS** — normalização/resolução de Auto, Light, Black e alias `dark` |
| `npm run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` | **7 passed** |
| `node --check` nos JS alterados | **OK** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `git diff --check` | **OK** |

Os testes Node foram executados com `npm.cmd` porque `npm.ps1` está bloqueado pela política do PowerShell. As dependências Node foram instaladas em `tests/node_modules` (ignorado) apenas para o teste de QR. Não houve execução de CI do GitHub para esta branch; os resultados acima são testes locais.

## 9. Validação visual em navegador

Foi usado Chromium via Playwright contra servidor HTTP local com **API simulada**. Não foi uma execução contra o Hermes real.

### 9.1 Cobertura visual

| Viewport | Temas validados | Telas |
|---|---|---|
| 320×568 | Light e Black | lista, conversa aberta e configurações com rolagem |
| 390×844 | Auto (claro/escuro), Light e Black | lista, conversa aberta e configurações |
| 1280×800 | Light e Black | lista, conversa aberta e configurações |

Também foram validadas as transições Auto claro ↔ Auto escuro pelo `prefers-color-scheme`.

### 9.2 Comportamento e persistência

- **Auto:** `data-theme` alternou entre `auto-light` e `auto-dark`; os tokens atuais foram preservados.
- **Light:** `data-theme="light"`, `--accent: #00a884`, `--bg: #f0f2f5`, `--pane: #ffffff`, `--me: #d9fdd3`; persistiu após reload.
- **Black:** `data-theme="black"`, `--bg: #000000`, `--bar: #111b21`, `--accent: #00a884`, `--me: #005c4b`, `--bot: #202c33`; persistiu após reload.
- **Legado:** `localStorage treg-pwa-theme=dark` foi lido como Black, com o botão Black marcado; nenhum valor ficou inválido.
- Os botões Auto/Light/Black refletiram corretamente `aria-pressed`.
- O `meta theme-color` mudou conforme o tema aplicado.

### 9.3 Contraste calculado

Pares principais, calculados a partir das cores computadas:

| Par | Light | Black |
|---|---:|---:|
| Texto sobre superfície (`--text` / `--pane`) | 17,46:1 | 17,82:1 |
| Texto da mensagem enviada (`--me-text` / `--me`) | 15,75:1 | 6,77:1 |
| Texto da mensagem recebida (`--text` / `--bot`) | 17,46:1 | 12,13:1 |
| Texto do botão verde (`--on-accent` / `--accent`) | 5,77:1 | 5,77:1 |
| Texto secundário (`--muted` / `--pane`) | 4,65:1 | 6,88:1 |

Os valores são cálculos de contraste sobre os tokens; não substituem uma auditoria WCAG completa de todos os componentes.

### 9.4 Preservação funcional

- O avatar fotográfico continuou visível no cabeçalho e no preview nos três temas.
- O FAB `#btn-new` permaneceu no mesmo local e com o mesmo comportamento.
- O menu geral e o menu de conversa continuaram funcionando.
- A lista, o chat, o composer, a busca, as configurações e o sheet de configurações foram exibidos nos dois novos temas.
- Foram encontrados **66 IDs**, **0 duplicados**, **0 erros de JavaScript** e 1 aviso pré-existente sobre a meta tag Apple.

## 10. Limitações e pendências

- Não houve validação no Hermes real, login real, sessões reais ou dispositivo físico.
- Não houve teste completo offline do PWA instalado; apenas a persistência local de tema foi verificada.
- Os estados de hover, focus e disabled foram implementados em CSS e verificados por inspeção/seleção, mas não foram testados exaustivamente em todos os componentes.
- O cálculo de contraste cobre os pares principais; não é uma auditoria WCAG completa.
- A validação usou API simulada; não houve envio real de mensagens nem teste de composer no Hermes.
- O tema atual foi preservado sob **Auto**; o antigo valor salvo `dark` passa a abrir **Black**, uma escolha de compatibilidade documentada. O cinza/verde escuro continua disponível via Auto escuro.

## 11. Preservação

Não foram alterados:

- o avatar local e sua persistência no IndexedDB;
- o botão flutuante `#btn-new`, o modal, a lista, a busca, o composer ou o fluxo de mensagens;
- o menu de ações da conversa, `#btn-menu` ou `#sheet`;
- `dashboard/plugin_api.py`, `dashboard/dist/`, `plugin.yaml` ou a versão `1.8.0b1`;
- a `main`, a branch da Fase 3, a branch da Fase 4B, a branch da Fase 4C, a branch documental, tags ou releases;
- o plugin original `hermes-pwa` e o Hermes instalado.

Não houve upload, sincronização, deploy, instalação, PR, tag ou release.

## 12. Git e publicação

- **Commit de implementação:** `0d5e12d4d108d97cc41c36985ad6f26732877ff7`
  - Mensagem: `feat(treg-pwa): adicionar temas light e black`
  - 6 arquivos alterados: `dashboard/pwa/app.css`, `dashboard/pwa/app.js`, `dashboard/pwa/index.html`, `dashboard/pwa/ui-utils.js`, `tests/ui-contract.test.js`, `tests/ui-utils.test.js`.
- **Commit deste relatório:** o HEAD final da branch, criado após a implementação.
- **Branch de implementação:** `feat/treg-pwa-identidade-whatsapp`.
- **Publicação:** a branch é enviada ao GitHub após o commit deste relatório; o SHA final é informado no resumo da publicação.

## 13. Encerramento

- **Fase concluída:** 4D — identidade visual WhatsApp: Light e Black.
- **Commit-base:** `c62d513c73fba065e60b115f8959e16ba47bdb7b`.
- **Branch:** `feat/treg-pwa-identidade-whatsapp`.
- **Mudanças efetivas:** nova paleta Light, nova paleta Black, Auto preservando a identidade cinza/verde, seletor Auto/Light/Black, tokens de estados, ajuste responsivo do chat em 320 px e testes.
- **Testes executados:** Node UI/API/UI utils/QR 3/3; Python 7 passed; `py_compile`; `node --check`; `git diff --check`; Playwright em 320/390/1280, claro/escuro, com API stub.
- **Pendências:** Hermes real, dispositivo físico/PWA, offline completo, auditoria WCAG completa e testes exaustivos de hover/focus/disabled.
- **Estado final do Git:** branch local com commit de implementação e commit deste relatório; sem PR, tag ou release.
- **Caminho completo deste relatório:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-theme-dev\report\34-identidade-visual-whatsapp.md`.
- **Próximo passo recomendado:** revisar este relatório e validar no Hermes/dispositivo real antes de qualquer nova fase.
