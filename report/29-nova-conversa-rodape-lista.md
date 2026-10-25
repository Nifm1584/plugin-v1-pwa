# 29 — Nova conversa na parte inferior da lista

**Data:** 2026-10-24  
**Fase:** 2 — reposicionamento do botão de nova conversa e validação do fluxo  
**Repositório:** `Nifm1584/plugin-v1-pwa`  
**Commit-base:** `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4` (`1.8.0b1`)  
**Branch de desenvolvimento:** `feat/treg-pwa-nova-conversa`  
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-dev`  
**Status:** implementação e testes concluídos; commit local criado. Nenhum push, tag, release ou PR.

## 1. Preparação da área isolada

A pasta anteriormente aberta (`hermes-pwa`) não é um repositório Git e está na versão `1.7.1`; ela não foi usada nem editada.

Foi usado o clone existente do repositório em:

`C:\Users\NILTON~1\AppData\Local\Temp\opencode\plugin-v1-pwa-5b`

O clone estava na branch `docs/fase-5b-analise-visual-e-prints`, HEAD `6842670d493607607c5c34680c9139ffa9de0a5f`, com o relatório 28 não rastreado. Esse relatório foi preservado no clone; nada nele foi descartado ou sobrescrito.

A branch `feat/treg-pwa-nova-conversa` não existia. Foi criada uma worktree isolada a partir do commit obrigatório:

```text
git worktree add -b feat/treg-pwa-nova-conversa \
  "C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-dev" \
  5af6cd5c3221b429a80ee543ec55b0c2b98c00e4
```

Confirmação dentro da nova área:

| Item | Valor |
|---|---|
| Caminho | `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-dev` |
| Branch | `feat/treg-pwa-nova-conversa` |
| SHA do commit-base | `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4` |
| Mensagem do commit-base | `feat(treg-pwa): implementar melhorias visuais da fase 5b` |
| `git status` inicial | limpo |
| Versão | `1.8.0b1` |

O commit-base e a tag `treg-pwa-v1.8.0b1` já existiam e não foram alterados.

## 2. Estrutura encontrada

Antes de editar, foram confirmados:

- `#list` é a `aside` da lista (`dashboard/pwa/index.html:33`).
- O cabeçalho da lista é `.bar` (`:34`), com `.actions` contendo Atualizar e Configurações.
- `#btn-new` ficava originalmente no cabeçalho, em `index.html:39`.
- `#list-foot` é o rodapé de paginação, em `index.html:56`.
- `#list` é um flex column; `.sessions` tem `flex: 1` e rolagem (`app.css:40`).
- O handler de `#btn-new` está em `app.js:263-271` e usa o modal compartilhado `ask`/`dialog`.
- O fluxo de criação usa `POST api/sessions`; o backend está em `dashboard/plugin_api.py:258-263`.
- Não existe FAB nem outro botão de nova conversa no app ou na aba do painel.

## 3. Alterações realizadas

### 3.1 `dashboard/pwa/index.html`

- Removido o `<button id="btn-new">` do `.actions` do cabeçalho.
- Criado o contêiner `.list-actions` depois de `#list-foot` e antes de `</aside>`.
- O botão `#btn-new` foi movido para dentro de `.list-actions`, preservando:
  - o mesmo ID `btn-new`;
  - `class="icon primary"`;
  - `title="Nova conversa"` e `aria-label="Nova conversa"`;
  - o mesmo SVG de `+`;
  - o mesmo handler existente, sem criar um segundo botão.
- Texto do estado vazio atualizado para apontar para o botão inferior.

### 3.2 `dashboard/pwa/app.css`

- Adicionada a área inferior:
  - `.list-actions` em fluxo normal, `flex: 0 0 auto`, alinhada à direita;
  - `padding-bottom` com `var(--safe-b)`;
  - borda superior e fundo `var(--pane)`;
  - botão de 52×52 px, mantendo o círculo e o contraste do tema;
  - sombra discreta.
- Ajustado `.list-foot` para não duplicar o `--safe-b`, já que `.list-actions` agora é o último elemento e é quem encosta na área segura.
- Não foi usado `position: fixed` nem `position: absolute`. O botão não cobre conversas nem o “Carregar mais”.
- Em telas ≤380 px, a regra `.list-actions .icon.primary` tem especificidade suficiente para manter o alvo de 52 px, em vez dos 38 px do `.icon` compacto.

### 3.3 `dashboard/pwa/app.js`

- Apenas o texto dinâmico do estado vazio foi atualizado para “Use o botão + abaixo para começar.”.
- O handler de `#btn-new` **não foi alterado**: continua abrindo o mesmo `ask("Nova conversa", ...)`, fazendo o mesmo `POST`, mesclando a sessão e abrindo a nova conversa.
- Não foi duplicada a lógica do modal nem criado um segundo fluxo de criação.

### 3.4 `README.md`

- Instrução atualizada de “botão **+** na lista” para “botão **+** no rodapé da lista”.

### 3.5 Testes

- `tests/ui-contract.test.js`:
  - `btn-new` incluído nos IDs obrigatórios;
  - exatamente um `#btn-new`;
  - `#btn-new` dentro de `.list-actions`, depois de `#list-foot` e fora do cabeçalho;
  - `.list-actions` não usa `position: fixed`/`absolute`;
  - estado vazio estático e dinâmico aponta para o botão inferior;
  - o handler contém `ask`, `POST`, `mergeSessions`, `openSession` e o erro `toast("Não criou: ...")`;
  - o handler não contém toast de sucesso no caminho de erro.
- `tests/hermes-api.test.js`:
  - novo teste de `TregApi.createSession`;
  - confere `POST`, body `{title}`, `?profile=work` e URL sem profile quando o título é `null`.
- `tests/test_plugin_api.py`:
  - novo teste de `plugin_api.create_session`;
  - confere `source=api_server`, título aparado, prefixo `/p/work` e caminho `/api/sessions` no perfil default.

## 4. Fluxo funcional preservado

O comportamento continua:

1. Clique em `#btn-new` no rodapé.
2. Abertura do modal compartilhado `#modal` via `ask`.
3. Cancelar não faz requisição (`title === null`).
4. Confirmar faz `POST /api/plugins/treg-pwa/api/sessions`.
5. O backend do plugin repassa ao gateway `POST /api/sessions` com `source=api_server` e título opcional.
6. A resposta é normalizada, mesclada na lista e aberta por `openSession`.
7. Erros continuam aparecendo como `toast("Não criou: ...")`, não como sucesso.
8. `/new` e `/reset` no composer continuam com o fluxo separado já existente.

Nenhum endpoint, contrato, comportamento de renomear/apagar/abrir conversa ou código do backend foi alterado. A única alteração no backend foi a adição de um teste.

## 5. Testes executados

Ambiente: Node.js `v24.18.0`; Python `3.11.15` em venv temporário com `pytest 9.1.1`, `pyyaml 6.0.3`, `fastapi 0.162.0` e `pydantic 2.14.1`.

| Teste | Resultado real |
|---|---|
| `node --check` em `app.js`, `ui-utils.js`, `hermes-api.js`, `sw.js`, `index.js` e testes JS | **OK** |
| `npm run test:ui` (`ui-contract.test.js`) | **PASS** — `PASS ui-contract: shell, menu, API layer e service worker` |
| `npm run test:api` (`hermes-api.test.js`) | **PASS** — inclui criação de sessão |
| `npm run test:uiutils` (`ui-utils.test.js`) | **PASS** |
| `npm run test:qrcode` (`qrcode.test.js`) | **3/3 PASS** |
| `pytest tests -q` | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `git diff --check` | **OK** |

Os testes Node foram executados com `npm.cmd` porque `npm.ps1` está bloqueado pela política de execução do PowerShell. As dependências Node foram instaladas em `tests/node_modules` (ignorado pelo Git) apenas para o teste de QR.

## 6. Validação em navegador

Foi feita uma tentativa de validação visual com Chrome headless e uma API simulada local (stub), fora do repositório:

- a captura desktop mostrou `#btn-new` no rodapé da lista, como um botão circular à direita, sem sobrepor a lista;
- a captura de clique mostrou o modal “Nova conversa” aberto pelo botão movido.

Isso é um **smoke test de layout/click com API stub**, não um teste ponta a ponta com o Hermes. A captura solicitada em 390 px foi recortada pela limitação de largura mínima do Chrome headless, portanto não foi conclusiva para telas estreitas. Não foram executados:

- clique real com o backend do Hermes;
- criação real de sessão no gateway;
- validação em celular/dispositivo real;
- validação do teclado virtual ou da área segura do iOS.

Esses itens permanecem pendentes e não devem ser considerados aprovados por esta fase.

## 7. Preservação

Não foram alterados:

- `main`;
- a branch `docs/fase-5b-analise-visual-e-prints`;
- a tag `treg-pwa-v1.0.0-estavel`;
- a tag `treg-pwa-v1.8.0b1`;
- as releases existentes;
- o plugin original `hermes-pwa`;
- configurações, serviços ou arquivos do Hermes instalado.

Não houve push, deploy, instalação, publicação de release, criação de tag ou pull request. O commit é local na branch `feat/treg-pwa-nova-conversa`.

## 8. Estado do Git

- **Commit de implementação:** `e529fa89c05b197f7778187d7ea1c6c83e2d77ff`
  - Mensagem: `feat(treg-pwa): mover nova conversa para o rodape da lista`
  - 7 arquivos alterados, 91 inserções e 7 remoções.
- **Commit deste relatório:** o HEAD final da branch, criado imediatamente após o commit de implementação.
- O clone principal mantém o relatório 28 não rastreado em `plugin-v1-pwa-5b/report/`; ele não foi incluído neste commit.
- A worktree de desenvolvimento não contém arquivos alheios à fase; `node_modules` e caches de teste são ignorados.

## 9. Pendências e próximos passos

1. Revisar este relatório e o diff local.
2. Validar em navegador real, com o Hermes real, o clique, o cancelamento, a criação com/sem nome, o erro de rede e a abertura da sessão.
3. Validar 320–390 px, desktop ≥900 px, teclado virtual, área segura e rolagem com muitas conversas.
4. Só depois decidir sobre push/PR e sobre a inclusão dos relatórios 28/29 na branch de documentação.
5. O índice `report/README.md` não foi alterado: ele já estava defasado no commit-base (não listava o relatório 27), e essa atualização não é necessária para a mudança do botão.

## 10. Encerramento

- **Fase concluída:** Fase 2 — nova conversa na parte inferior da lista; implementação e testes locais concluídos.
- **Commit-base:** `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4`.
- **Branch:** `feat/treg-pwa-nova-conversa`.
- **Mudanças efetivas:** botão movido para `.list-actions` após `#list-foot`; CSS de rodapé/área segura; textos de estado vazio e README; testes de contrato, API e backend.
- **Testes realmente executados:** Node (UI, API, UI utils, QR 3/3), Python (7 passed), `py_compile`, `node --check`, `git diff --check`.
- **Limitações:** validação visual/E2E com Hermes real e viewport estreita confiável ainda pendentes; o smoke headless usou API stub.
- **Estado final do Git:** branch local com commit de implementação e commit deste relatório; sem push.
- **Caminho completo deste relatório:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-dev\report\29-nova-conversa-rodape-lista.md`.
- **Próximo passo recomendado:** analisar este relatório e executar a validação em navegador/Hermes real antes de qualquer publicação.
