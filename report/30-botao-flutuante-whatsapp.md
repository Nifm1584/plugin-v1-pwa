# 30 — Botão flutuante de nova conversa, estilo WhatsApp

**Data:** 2026-10-24  
**Fase:** 3 — posicionamento flutuante do botão de nova conversa  
**Repositório:** `Nifm1584/plugin-v1-pwa`  
**Commit-base:** `25847f08ac6d736fa795641ee8692b8895e628b2`  
**Branch de desenvolvimento:** `feat/treg-pwa-botao-flutuante`  
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-floating-dev`  
**Status:** implementação, testes e validação de UI em navegador com API simulada concluídos; commit local criado. A publicação da branch é feita após o commit deste relatório.

## 1. Base e preparação

A branch publicada da Fase 2 foi confirmada no remoto:

- `feat/treg-pwa-nova-conversa` → `25847f08ac6d736fa795641ee8692b8895e628b2`
- O relatório 29 foi lido diretamente do GitHub e preservado sem alteração.
- A branch `feat/treg-pwa-botao-flutuante` não existia.
- A worktree foi criada a partir do commit-base, sem alterar a branch publicada da Fase 2:

```text
git worktree add -b feat/treg-pwa-botao-flutuante \
  "C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-floating-dev" \
  25847f08ac6d736fa795641ee8692b8895e628b2
```

Confirmação:

| Item | Valor |
|---|---|
| Caminho | `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-floating-dev` |
| Branch | `feat/treg-pwa-botao-flutuante` |
| SHA-base | `25847f08ac6d736fa795641ee8692b8895e628b2` |
| `git status` inicial | limpo |
| Relatório 29 | presente e preservado |

## 2. Referência visual

A referência externa do WhatsApp Android foi acessada e visualizada:

- Imagem: <https://mmedia.notitarde.com.ve/19485/whatsapp-image-2023-05-07-at-90125-pm-1jpeg-24955.jpeg>
- Artigo: <https://www.notitarde.com.ve/ciencia-y-tec/24657/inician-pruebas-para-nueva-interfaz-para-whatsapp-en-android-foto>
- A imagem respondeu HTTP 200 e mostra um botão circular no canto inferior direito, acima da barra inferior.

Ela foi usada **somente** para orientar o posicionamento flutuante. Não foram copiados a marca, o ícone de mensagem, as cores ou o desenho do botão do WhatsApp. O TREG mantém o `+`, as classes, as cores de tema e o diâmetro originais.

## 3. Problema da Fase 2

A Fase 2 havia colocado `#btn-new` em `.list-actions`, depois de `#list-foot`, mas:

- `.list-actions` era um item de flex em fluxo normal, formando uma faixa de rodapé;
- o botão tinha sido aumentado para 52×52 px;
- havia uma sombra personalizada;
- o rodapé de paginação havia perdido a área segura inferior porque a faixa de ações ocupava o fundo.

Isso não atendia ao comportamento flutuante e alterava o desenho original.

## 4. Alterações realizadas

### 4.1 `dashboard/pwa/app.css`

- `#list` recebeu `position: relative` para ser o contêiner de ancoragem.
- `.list-actions` passou a ser absoluto, sem faixa de rodapé:
  - `position: absolute`;
  - `right: 16px`;
  - `bottom: calc(16px + var(--safe-b))`;
  - `z-index: 5`;
  - sem background, borda, padding ou `flex` de faixa.
- Quando `#list-foot` está visível, o botão sobe para não cobrir a paginação:
  - `.list-foot:not(.hidden) ~ .list-actions { bottom: calc(72px + var(--safe-b)); }`
- `.sessions` recebeu `padding-bottom` e `scroll-padding-bottom` de `calc(72px + var(--safe-b))` para que a última conversa possa ser rolada para acima do FAB.
- `.empty` recebeu o mesmo espaço inferior para que o texto do estado vazio não fique sob o botão.
- `.list-foot` recuperou `padding-bottom: calc(8px + var(--safe-b))`, pois voltou a ser o elemento de fluxo que encosta na área segura.
- Removidos o tamanho de 52×52 px e a sombra personalizada da Fase 2. O botão usa novamente `.icon` (42×42 px, 50%) e `.icon.primary` (cor de destaque do tema).
- Não foi usado `position: fixed`.

### 4.2 `tests/ui-contract.test.js`

O contrato foi atualizado para a nova intenção:

- continua exigindo exatamente um `#btn-new`, fora do cabeçalho;
- confirma que `#btn-new` está dentro de `.list-actions` e depois de `#list-foot`;
- confirma o SVG original de 22×22 px, o path `M12 5v14M5 12h14`, `class="icon primary"`, `title` e `aria-label`;
- confirma `#list` com `position: relative`;
- confirma `.list-actions` com `position: absolute`, `right: 16px`, `bottom: calc(16px + var(--safe-b))` e `z-index: 5`;
- proíbe `position: fixed` no `.list-actions`;
- confirma a regra que eleva o botão quando a paginação está visível;
- confirma que o tamanho de 52 px e a sombra personalizada não voltaram;
- confirma `.icon` 42×42 px e `.icon.primary` com `var(--accent)`;
- confirma o espaço de rolagem em `.sessions` e a área segura em `.list-foot`.

### 4.3 `README.md`

A instrução passou de “botão **+** no rodapé da lista” para “botão **+** flutuante no canto inferior direito da lista”.

Nenhuma alteração foi feita em `index.html`, `app.js`, `hermes-api.js`, `plugin_api.py`, endpoints, modal ou handler. O botão movido na Fase 2 foi mantido com o mesmo ID e o mesmo fluxo.

## 5. Design original preservado

Comparação com o commit congelado `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4`:

| Característica | Original | Fase 3 |
|---|---|---|
| ID | `btn-new` | `btn-new` |
| Classes | `icon primary` | `icon primary` |
| Ícone | SVG 22×22, `+` | SVG 22×22, `+` |
| Diâmetro desktop | 42×42 px | 42×42 px |
| Diâmetro ≤380 px | 38×38 px (regra existente) | 38×38 px |
| Forma | circular (50%) | circular (50%) |
| Cores | `--accent` / `--on-accent` | `--accent` / `--on-accent` |
| Sombra | nenhuma | nenhuma |
| `title` / `aria-label` | “Nova conversa” | “Nova conversa” |
| Handler/modal | original | original, sem duplicação |

Valores computados no navegador:

- tema claro: fundo `rgb(15, 138, 126)`, texto `rgb(255, 255, 255)`;
- tema escuro: fundo `rgb(43, 179, 154)`, texto `rgb(6, 42, 36)`;
- 42×42 px, `border-radius: 50%`, `box-shadow: none`.

## 6. Testes e validação real executados

### 6.1 Testes automatizados

| Teste | Resultado |
|---|---|
| `node --check` (app, ui-utils, hermes-api, sw, dist, testes JS) | **OK** |
| `npm run test:ui` | **PASS** |
| `npm run test:api` | **PASS** |
| `npm run test:uiutils` | **PASS** |
| `npm run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `git diff --check` | **OK** |

### 6.2 Navegador real via Playwright, com API simulada

Foi usado Chromium via Playwright contra um servidor HTTP local com respostas de API simuladas. **Isso não é uma criação real de sessão no Hermes.**

Viewport desktop 1280×800, lista com 12 conversas e `#list-foot` visível:

- FAB em `x=301`, `y=686`, 42×42 px;
- `position: absolute`, `right: 16px`, `bottom: 72px`;
- dentro de `#list` (360×800);
- sem sobreposição com `#list-foot` (`y=741,25`, altura 58,75);
- após rolar até o fim, a última conversa terminou em `y=668,69`, acima do topo do FAB (`y=686`).

Viewport 390×844, 12 conversas e paginação visível:

- FAB em `x=332`, `y=730`, 42×42 px;
- `bottom: 72px`, dentro de `#list` (390×844);
- sem sobreposição com `#list-foot` (`y=785,25`);
- última conversa após rolagem terminou em `y=712,69`, acima do FAB (`y=730`).

Viewport 390×844, 3 conversas e paginação oculta:

- FAB em `x=332`, `y=786`, 42×42 px;
- `bottom: 16px`, paginação oculta;
- última conversa em `y=379,67`, sem sobreposição.

Viewport 320×568, lista vazia:

- FAB em `x=266`, `y=514`, 38×38 px (regra compacta original);
- `bottom: 16px`, dentro de `#list`;
- estado vazio visível e acima do botão;
- sem sombra.

Fluxo de clique e modal:

- clique em `#btn-new` abriu o modal compartilhado;
- título “Nova conversa”, placeholder “Nome (opcional)”, foco em `#modal-input`;
- cancelar fechou o modal sem abrir o chat, mantendo a lista;
- confirmar com a API stub criou a sessão simulada, atualizou a lista para 13 itens e abriu o chat com o título informado;
- continuou existindo apenas um `#btn-new`.

Erro simulado:

- POST com HTTP 500 gerou `toast` com “Não criou: Falha simulada”;
- o chat permaneceu oculto e a lista permaneceu visível;
- nenhum sucesso falso foi exibido.

Tema:

- as cores do botão mudaram corretamente entre claro e escuro pelas variáveis CSS existentes;
- 42×42 px, circular, sem sombra nos dois temas.

## 7. Pendências de validação

Não foram executados:

- criação real de sessão no gateway/Hermes;
- clique e criação com o Hermes real;
- teste em celular/dispositivo físico;
- validação da área segura real do iOS;
- validação com fonte aumentada/zoom extremo, que pode alterar a altura do `#list-foot`;
- validação do FAB com teclado virtual aberto em dispositivo real.

Esses itens permanecem pendentes e não devem ser considerados aprovados por esta fase.

## 8. Preservação e limites

Não foram alterados:

- `main`;
- a branch `docs/fase-5b-analise-visual-e-prints`;
- a branch publicada `feat/treg-pwa-nova-conversa`;
- o relatório 29;
- as tags `treg-pwa-v1.0.0-estavel` e `treg-pwa-v1.8.0b1`;
- as releases existentes;
- o plugin original `hermes-pwa`;
- configurações, serviços ou arquivos do Hermes instalado.

Não houve deploy, instalação, tag, release ou PR. A implementação alterou somente CSS, um teste de contrato e o README.

## 9. Git e commits

- **Commit de implementação:** `b51984e9294bc9654fa3ae281baac61aa6104c35`
  - Mensagem: `fix(treg-pwa): posicionar nova conversa como botao flutuante`
  - 3 arquivos alterados: `dashboard/pwa/app.css`, `tests/ui-contract.test.js`, `README.md`
  - 29 inserções e 8 remoções.
- **Commit deste relatório:** HEAD final da branch, criado imediatamente após a implementação.
- **Estado local:** worktree limpa; nenhuma alteração alheia à fase.
- **Publicação:** a branch `feat/treg-pwa-botao-flutuante` é enviada ao GitHub após o commit deste relatório. O SHA final da branch é o commit que contém este arquivo.

## 10. Encerramento

- **Fase concluída:** Fase 3 — botão flutuante de nova conversa.
- **Commit-base:** `25847f08ac6d736fa795641ee8692b8895e628b2`.
- **Branch:** `feat/treg-pwa-botao-flutuante`.
- **Mudanças efetivas:** FAB absoluto no canto inferior direito de `#list`; 42×42 px original; sem sombra; espaço de rolagem; elevação acima da paginação; testes de contrato atualizados; README atualizado.
- **Testes executados:** Node (UI, API, UI utils, QR 3/3), Python 7 passed, `py_compile`, `node --check`, `git diff --check`, Playwright com API stub em 1280×800, 390×844 e 320×568; clique, cancelamento, confirmação simulada, erro simulado e temas claro/escuro.
- **Pendências:** Hermes real, dispositivo físico, área segura iOS e fonte/zoom extremos.
- **Estado final do Git:** branch local com commit de implementação e commit deste relatório; worktree limpa; push da branch na etapa de publicação.
- **Caminho completo deste relatório:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-floating-dev\report\30-botao-flutuante-whatsapp.md`.
- **Próximo passo recomendado:** revisar este relatório e validar em Hermes/dispositivo real antes de qualquer nova melhoria ou publicação de release.
