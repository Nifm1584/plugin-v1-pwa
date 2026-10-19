# 26 — Implementação visual da Fase 5B

## 1. Objetivo e escopo

Implementar a modernização visual e a identificação de versão do TREG PWA, preservando as correções funcionais da Fase 5A.

Esta execução:

- não acessou a VPS;
- não instalou o plugin;
- não alterou `main`, C7, tag ou Release;
- não alterou o `hermes-pwa` original;
- não fez commit, push ou merge.

## 2. Baseline

| Item | Valor |
|---|---|
| Repositório | `Nifm1584/plugin-v1-pwa` |
| Branch | `feat/treg-pwa-fase-5a-p1` |
| Commit-base | `52418ca89b9e0b51000c315a261cdf07bca2f59b` |
| Versão de teste | `1.8.0b1` |
| Hermes de referência | v0.22.2 |

## 3. Identificação da versão

- `plugin.yaml` passou de `1.7.1` para `1.8.0b1`.
- `dashboard/manifest.json` passou para `1.8.0b1`, com descrição da Fase 5B.
- A aba do painel mostra `TREG 1.8.0b1 · Fase 5B — teste visual`.
- O app mostra `TREG · Fase 5B · 1.8.0b1` no painel de Configurações.
- O README registra a versão de teste e o relatório 26.
- Nenhum SHA é usado como substituto da versão.

## 4. Recursos implementados

### 4.1 Copiar mensagem

- Botão visível em mensagens do usuário e do assistente.
- Usa `navigator.clipboard.writeText`.
- Fallback por `textarea` + `execCommand("copy")`.
- Copia apenas o texto:
  - mensagens do usuário sem marcadores de anexo/áudio;
  - mensagens do assistente sem HTML, botões ou metadados.
- Mostra confirmação ou erro por toast.
- Não exibe botão quando a mensagem não tem texto copiável.

### 4.2 Tema Auto/Claro/Escuro

- Preferência salva em `localStorage` na chave exclusiva `treg-pwa-theme`.
- `Auto` resolve pelo `prefers-color-scheme` do dispositivo.
- O tema é aplicado antes do CSS por script inline, reduzindo flash.
- `data-theme` controla as variáveis CSS; `meta theme-color` acompanha.
- O tema do dashboard não é alterado nem sincronizado.
- Botões de tema têm `aria-pressed` e foco visível.

### 4.3 Separadores de data

- Mensagens agrupadas pelo dia local.
- Rótulos “Hoje”, “Ontem” ou data local por extenso.
- O conteúdo original das mensagens não é alterado.
- Mensagens sem timestamp não recebem separador inventado.

### 4.4 Avatares e legibilidade

- Iniciais determinísticas baseadas no título, com fallback para a origem.
- Cores continuam determinísticas por origem.
- Nenhuma foto de pessoa, grupo ou contato é criada.
- Cabeçalho do chat ganhou avatar compacto.
- Lista com título de 15 px, prévia de 14 px e metadados de 12 px.
- Ajustes de espaçamento, contraste e foco visível.
- Em telas até 380 px, ações e metadados são compactados sem remover funções.

### 4.5 Acessibilidade

- `:focus-visible` em botões, links, inputs, textareas e selects.
- Avatar do chat com `aria-hidden`.
- Separadores de data com `role="separator"`.
- Botão copiar com `aria-label`.
- Tema com `aria-pressed`.
- `aria-live` preservado em status, mensagens, digitação e toast.
- `prefers-reduced-motion` preservado.

### 4.6 Funções da Fase 5A preservadas

Busca local/remota, paginação, fixar, anexos, áudio, transcrição com fallback, aprovações, retomada e interrupção continuam no código sem remoção.

## 5. Cache

- Service worker atualizado de `treg-pwa-v2` para `treg-pwa-v3`.
- `ui-utils.js` entrou no `SHELL` e em `_STATIC`.
- O activate remove caches antigos.
- Nenhum endpoint de API é cacheado.

## 6. Arquivos alterados

- `plugin.yaml`
- `dashboard/manifest.json`
- `dashboard/dist/index.js`
- `dashboard/plugin_api.py`
- `dashboard/pwa/ui-utils.js` (novo)
- `dashboard/pwa/app.js`
- `dashboard/pwa/app.css`
- `dashboard/pwa/index.html`
- `dashboard/pwa/sw.js`
- `README.md`
- `tests/package.json`
- `tests/test_plugin.py`
- `tests/ui-utils.test.js` (novo)
- `tests/ui-contract.test.js`
- `.github/workflows/treg-pwa-validation.yml`
- `report/26-implementacao-fase-5b-visual.md`
- `report/README.md`

## 7. Testes executados

### Node

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

```text
npm.cmd run test:api
npm.cmd run test:ui
npm.cmd run test:uiutils
npm.cmd run test:qrcode
```

Resultados:

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

### Teste visual

Foi iniciado um servidor HTTP local em `127.0.0.1:8765` e tentada a navegação pelo Browser MCP. A chamada retornou timeout de 30 s:

```text
WebSocket response timeout after 30000ms
```

O servidor local foi encerrado. Não houve captura visual nem inspeção em navegador real; nenhum resultado visual foi inventado.

## 8. Limitações

- A interface não foi validada em navegador real nesta execução.
- O comportamento de cópia depende da Clipboard API ou do fallback do navegador e não foi testado em dispositivo.
- A preferência de tema não foi testada em PWA instalado nem em iOS/Android.
- A versão `1.8.0b1` não foi instalada no Hermes nem validada na VPS.
- Persistem as limitações multi-perfil de transcrição/upload registradas no relatório 23.

## 9. Encerramento

- Branch: `feat/treg-pwa-fase-5a-p1`
- Base: `52418ca89b9e0b51000c315a261cdf07bca2f59b`
- Nenhum commit/push.
- Código e testes permanecem no worktree para revisão.
- `main`, C7, tag, Release e VPS intactos.
