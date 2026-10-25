# 32 — Cabeçalho compacto e menu geral

**Data:** 2026-10-24<br>
**Fase:** 4B — implementação visual do cabeçalho e menu<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch-base:** `feat/treg-pwa-botao-flutuante`<br>
**Commit-base:** `064c1073dc6f776d37f67495bcc285ac84646e8c`<br>
**Branch de implementação:** `feat/treg-pwa-cabecalho-menu`<br>
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-header-dev`<br>
**Relatório de referência:** [report/31](https://github.com/Nifm1584/plugin-v1-pwa/blob/docs/fase-4a-pesquisa-cabecalho/report/31-pesquisa-visual-e-auditoria-cabecalho.md)

## 1. Base e escopo

Antes de editar, foi confirmado:

- a branch `feat/treg-pwa-botao-flutuante` existe no remoto e aponta para `064c1073dc6f776d37f67495bcc285ac84646e8c`;
- o relatório 31 foi lido na branch documental `docs/fase-4a-pesquisa-cabecalho`;
- a branch `feat/treg-pwa-cabecalho-menu` não existia;
- foi criada uma worktree isolada a partir do commit-base, sem alterar a branch da Fase 3;
- a worktree inicial estava limpa, em `064c107`.

A implementação ficou restrita ao cabeçalho da lista, ao menu geral e aos testes. Não foi feita integração com `/api/auth/me`, não houve alteração de `/api/me`, não foi criado endpoint, foto, upload, tela de perfil ou instalação.

## 2. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/index.html` | Removido o texto `TREG` do cabeçalho da lista; adicionado avatar circular com o glifo `☤`; criado `#btn-header-menu` e `#header-menu`; movidos `#btn-refresh` e `#btn-settings` para o menu |
| `dashboard/pwa/app.css` | `.bar` passou a ser o contêiner de posicionamento; novo `.brand-avatar`; estilos do `.header-menu` e dos `.menu-item` |
| `dashboard/pwa/app.js` | Lógica de abrir/fechar o menu do cabeçalho, clique fora, Escape, foco, teclado e `aria-expanded`; handlers de Atualizar/Configurações preservados |
| `tests/ui-contract.test.js` | Contratos do novo cabeçalho, avatar, menu, IDs únicos, handlers e CSS; testes do FAB e do menu de conversa preservados |

Não foram alterados `plugin.yaml`, `dashboard/manifest.json`, `dashboard/plugin_api.py`, `dashboard/dist/`, `README.md`, versão ou qualquer outro arquivo de código.

## 3. Avatar provisório

- O texto `TREG` foi removido do cabeçalho da lista.
- O avatar é um círculo de 34×34 px com o glifo `☤` já existente:
  - fundo `var(--bg)`;
  - borda `1px solid var(--line)`;
  - cor do glifo `var(--accent)`;
  - `border-radius: 50%`;
  - `aria-hidden="true"` no bloco da marca, pois é decoração.
- Não há `<img>`, foto, nome, e-mail, `user_id` ou nome de agente no cabeçalho.
- O avatar é somente provisório e não depende de API de identidade.
- O glyph e o círculo foram validados nos temas claro e escuro.

## 4. Menu do cabeçalho

### 4.1 Estrutura

- Botão: `#btn-header-menu`, classe `icon`, três pontos verticais, `title` e `aria-label` “Mais opções”.
- Menu: `#header-menu`, `role="menu"`, `aria-labelledby="btn-header-menu"`.
- Itens:
  - `#btn-refresh`, `role="menuitem"`, rótulo “Atualizar”, ícone de refresh;
  - `#btn-settings`, `role="menuitem"`, rótulo “Configurações”, ícone de ajustes.
- Os itens estão dentro do menu; não há botões independentes de atualizar/configurações no `.actions` do cabeçalho.
- `#btn-new` e o FAB da Fase 3 não foram tocados.
- `#btn-menu` e `#sheet` do cabeçalho da conversa não foram tocados.

### 4.2 Posicionamento

- O menu usa `position: absolute` dentro do cabeçalho; não usa `position: fixed`.
- `top: calc(100% + 6px)`, `right: 8px`, `z-index: 15`, largura 210 px e limite `calc(100% - 16px)`.
- Em desktop, fica dentro da coluna de 360 px da lista, não sobre o chat.
- Em 390 px, ficou em `x=172`, `y=64`, `210×99,5 px`.
- Em 320 px, ficou em `x=102`, `y=61`, `210×99,5 px`.
- O menu não cobre permanentemente nenhum controle; é um dropdown temporário sobre a lista.

### 4.3 Comportamento e acessibilidade

- Abrir por clique no botão; `aria-expanded` passa a `true` e o primeiro item recebe foco.
- Abrir por `ArrowDown`/`ArrowUp` no botão; foco no primeiro/último item.
- Navegação por `ArrowDown`, `ArrowUp`, `Home` e `End` dentro do menu.
- `Escape` fecha e devolve o foco ao botão.
- Clique fora fecha.
- `Tab` percorre os itens e, ao sair do menu, o `focusout` fecha o menu; o teste resultou em foco no campo de busca.
- Clique em um item fecha o menu; o foco volta ao botão.
- `aria-expanded` é atualizado ao abrir/fechar; `aria-haspopup="menu"` e `aria-controls="header-menu"` estão no botão.
- O menu não cria IDs duplicados: a página foi verificada com 57 IDs e **0 duplicados**.
- O sheet de configurações continua com o gerenciamento de foco anterior; ele não foi alterado nesta fase.

### 4.4 Ações preservadas

- `#btn-refresh` continua com o handler original:

```js
loadSessions(false, true).then(function () { toast("Atualizado"); });
```

  A chamada e a lógica de atualização não foram modificadas. O menu apenas fecha depois do clique.
- `#btn-settings` continua chamando `openSettings`, que abre o `#settings` existente.
- Nenhum endpoint, contrato ou backend foi alterado.

## 5. Testes automatizados

| Teste | Resultado real |
|---|---|
| `node --check` em `app.js`, `ui-utils.js`, `hermes-api.js`, `sw.js`, `dist/index.js` e testes JS | **OK** |
| `npm run test:ui` (`ui-contract.test.js`) | **PASS** — inclui os novos contratos de cabeçalho/menu |
| `npm run test:api` (`hermes-api.test.js`) | **PASS** |
| `npm run test:uiutils` (`ui-utils.test.js`) | **PASS** |
| `npm run test:qrcode` (`qrcode.test.js`) | **3/3 PASS** |
| `pytest tests -q` | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `git diff --check` | **OK** |

Os testes Node foram executados com `npm.cmd` porque o `npm.ps1` está bloqueado pela política do PowerShell. As dependências Node foram instaladas em `tests/node_modules` (ignorado pelo Git) apenas para o teste de QR.

## 6. Validação visual em navegador

Foi usado Chromium via Playwright contra um servidor HTTP local com API simulada (stub). **Não foi uma criação real de sessão no Hermes.**

### 6.1 Tamanhos e temas

| Viewport | Tema | Resultado |
|---|---|---|
| 390×844 | Claro | Cabeçalho compacto, avatar circular à esquerda, menu à direita; menu aberto dentro da viewport; sem `TREG` |
| 390×844 | Escuro | Mesmo layout; superfícies escuras; menu com contraste e ícones teal |
| 320×568 | Escuro | Avatar e menu cabem; menu `x=102`, largura 210; sem overflow horizontal |
| 320×568 | Claro | Mesmo layout; menu dentro da viewport |
| 1280×800 | Claro | Menu dentro da coluna de 360 px da lista, não sobre o chat |
| 1280×800 | Escuro | Mesmo layout, com superfícies escuras |

As capturas foram abertas e inspecionadas diretamente. Não houve erro de JavaScript no console; a única mensagem foi um aviso pré-existente sobre a meta tag `apple-mobile-web-app-capable`.

### 6.2 Comportamentos verificados

- Texto `TREG` ausente no cabeçalho; avatar sem `<img>`.
- Menu abre e fecha por clique; `aria-expanded` alterna `false`/`true`.
- `ArrowDown` foi para “Configurações”; `ArrowUp` voltou para “Atualizar”.
- `Escape` fechou o menu e devolveu foco ao `#btn-header-menu`.
- Clique fora fechou o menu.
- `Tab` percorreu os itens e, ao sair, o menu fechou e o foco foi para a busca.
- **Atualizar:** o stub registrou uma nova chamada `GET /api/sessions?limit=80&offset=0&profile=default`; o menu fechou e o toast “Atualizado” apareceu.
- **Configurações:** `#settings` abriu, o menu fechou e o texto “Agente: default. Vale para as próximas mensagens.” apareceu.
- **Menu da conversa:** `#btn-menu` abriu o `#sheet` com as ações `pin`, `rename`, `reload`, `delete` e `close`; o menu do cabeçalho não interferiu.
- **FAB:** `#btn-new` continuou em 42×42 px, em `x=332`, `y=730`, dentro da lista em 390×844; o clique abriu o modal “Nova conversa”.
- **IDs:** 57 IDs no DOM, 0 duplicados.
- **Console:** 0 erros; 1 aviso de meta tag pré-existente.

## 7. Limitações e pendências

- A validação de Atualizar/Configurações usou API simulada; não houve chamada real ao gateway/Hermes.
- A criação real de sessão, o login real e o carregamento real de sessões não foram executados nesta fase.
- A validação foi feita em Chromium headless, não em celular físico nem em PWA instalado.
- O comportamento do menu com zoom/fonte muito aumentados não foi testado.
- O `#settings` continua sem gerenciamento de foco próprio; esse comportamento é preexistente e não foi alterado.
- Nenhuma integração com `/api/auth/me` ou `/api/me` foi adicionada; o avatar é apenas o glyph provisório.

## 8. Preservação

Não foram alterados:

- o FAB `#btn-new`, o modal de nova conversa, a lista, a busca, o composer, os temas, os perfis ou as sessões;
- o cabeçalho da conversa, `#btn-menu` e `#sheet`;
- `dashboard/plugin_api.py`, `dashboard/dist/`, `plugin.yaml` ou manifestos;
- a versão `1.8.0b1`;
- `main`, a branch da Fase 3, a branch documental, as tags ou as releases;
- o plugin original `hermes-pwa` ou o Hermes instalado.

Não houve deploy, instalação, PR, tag ou release nesta fase.

## 9. Git e publicação

- **Commit de implementação:** `3d3758e57bfab8b9de75f5ac73461050405ce95a`
  - Mensagem: `feat(treg-pwa): adicionar cabecalho compacto e menu geral`
  - 4 arquivos alterados: `dashboard/pwa/index.html`, `dashboard/pwa/app.css`, `dashboard/pwa/app.js`, `tests/ui-contract.test.js`.
- **Commit deste relatório:** o HEAD final da branch, criado após a implementação.
- **Branch de implementação:** `feat/treg-pwa-cabecalho-menu`.
- **Publicação:** a branch é enviada ao GitHub após o commit deste relatório; o SHA final é informado no resumo da publicação.

## 10. Encerramento

- **Fase concluída:** 4B — cabeçalho compacto e menu geral.
- **Commit-base:** `064c1073dc6f776d37f67495bcc285ac84646e8c`.
- **Branch:** `feat/treg-pwa-cabecalho-menu`.
- **Mudanças efetivas:** texto TREG removido; avatar circular com `☤`; novo menu de cabeçalho; Atualizar e Configurações movidos para o menu; handlers e FAB preservados; testes de contrato e validação em navegador.
- **Testes executados:** Node UI/API/UI utils/QR 3/3; Python 7 passed; `py_compile`; `node --check`; `git diff --check`; Playwright em 320/390/1280, claro/escuro, com API stub.
- **Pendências:** validação real no Hermes, dispositivo físico/PWA instalado, teclado virtual e zoom/fonte aumentados.
- **Estado final do Git:** branch local com commit de implementação e commit deste relatório; sem PR, tag ou release.
- **Caminho completo deste relatório:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-header-dev\report\32-cabecalho-compacto-menu-geral.md`.
- **Próximo passo recomendado:** analisar este relatório e validar no Hermes real antes de iniciar outra fase.
