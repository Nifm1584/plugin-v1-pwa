# 20 — Inventário final de sincronização local × GitHub

## 1. Objetivo

Registrar a conferência final entre o diretório local do projeto e o repositório `Nifm1584/plugin-v1-pwa`, identificando o que está publicado, o que permanece apenas no computador e o que foi deliberadamente retido por privacidade, conflito ou ausência de valor funcional.

Esta fase não alterou código, `main`, a versão estável C7, a tag ou a Release. Também não fez merge, force push ou sobrescrita de conteúdo remoto.

## 2. Estado do diretório local

**Caminho:** `C:\Users\Nilton A\Downloads\treg-v1hermes-plugin\hermes-plugins-main\hermes-pwa`

### 2.1 O diretório não é um repositório Git

- não existe `.git` local;
- `git status`, `git branch` e `git log` retornam `fatal: not a git repository`;
- portanto, não existem branches locais, commits locais ou working tree Git local;
- o diretório é uma árvore-fonte exportada, não um clone completo.

**Consequência:** não é possível declarar "repositório local limpo" com base em `git status`. A verificação foi feita por comparação de arquivos e hashes contra um clone temporário do GitHub.

### 2.2 Conteúdo local relevante

| Grupo | Situação |
|---|---|
| Código-fonte (`__init__.py`, `plugin.yaml`, `dashboard/`, `tests/`) | Presente |
| README raiz | Presente, mas em variante diferente do README remoto do TREG |
| Relatórios (`report/*.md`) | 20 arquivos Markdown, incluindo este relatório |
| Capturas do TREG | 11 imagens em `report/prints-aplicativo-treg-pwa/` |
| Capturas privadas do WhatsApp | 3 imagens em `report/Captura de tela do WhatsApp/` |
| Artefatos de automação | `.playwright-mcp/` com logs e snapshots temporários |
| `.git`, `LICENSE`, `.gitignore`, `.github/` | Ausentes no diretório local |

## 3. Método de comparação

1. Clone temporário da branch estável `fix/treg-pwa-c7-qrcode-fix` (commit `6218f0fd`).
2. Cópia dos arquivos locais de código para o clone temporário.
3. Comparação com `git diff`, desconsiderando diferenças de fim de linha.
4. Comparação byte a byte dos relatórios e das imagens contra a branch documental publicada.
5. Publicação em branch própria, sem tocar em `main`, C7, tag ou Release.
6. Verificação dos SHAs das branches, tag e Release após o push.

## 4. Código: local × C7

O código local é funcionalmente idêntico ao commit C7, com duas exceções não publicadas:

| Arquivo | Diferença local | Classificação | Decisão |
|---|---|---|---|
| `README.md` | Variante do README original do `hermes-pwa`, com instruções e contato de suporte; substituiria o README TREG remoto | Conflito de conteúdo e privacidade | Não publicado; original local preservado |
| `dashboard/dist/qrcode.js` | Espaço em branco, remoção de uma linha de comentário e newline final | Sem alteração funcional | Não publicado |

Todos os demais arquivos de código comparados são equivalentes ao C7. As diferenças de status Git em arquivos como `__init__.py`, `plugin.yaml` e `dashboard/plugin_api.py` são apenas de fim de linha (LF/CRLF), não de conteúdo.

## 5. Relatórios e capturas

### 5.1 Relatórios publicados e idênticos ao local

Os oito arquivos abaixo foram conferidos byte a byte contra a branch documental e correspondem exatamente ao conteúdo local:

- `report/10-validacao-versao-estavel-c7.md`
- `report/13-fase-c4-auditoria-publicacao-e-vps.md`
- `report/16-fase-c7-conferencia-exata-local-github.md`
- `report/17-levantamento-visual-treg-pwa.md`
- `report/18-auditoria-visual-funcional-treg-pwa.md`
- `report/19-analise-prints-whatsapp.md`
- `report/README.md`
- `report/prints-aplicativo-treg-pwa/README.md`

### 5.2 Capturas do TREG

| Arquivo | Publicado? | Observação |
|---|---|---|
| `Screenshot_1.png` a `Screenshot_9.png` | Sim | Hashes idênticos |
| `captura-15012.png` | Sim | Hash idêntico |
| `02-tela-instalacao-qr.png` | Sim, versão redigida | Original local tem usuário e chave parcial; GitHub recebeu versão com esses trechos cobertos |
| `.gitkeep` | Sim | Arquivo vazio de estruturação |

Total publicado: 11 imagens. Todas as 10 imagens sem redação tiveram SHA-256 conferido e correspondem ao original.

### 5.3 Capturas privadas do WhatsApp

As três imagens de `report/Captura de tela do WhatsApp/` permanecem **somente no computador**:

- `Screenshot (18 de out. de 2026 21_26_38).png`
- `Screenshot (18 de out. de 2026 21_28_19).png`
- `Screenshot (18 de out. de 2026 21_30_42).png`

Motivo: contêm nomes, telefone e conteúdo de conversas privadas. A análise está publicada no relatório 19, sem reproduzir os dados pessoais.

## 6. Branches remotas

| Branch | SHA | Estado |
|---|---|---|
| `main` | `07cacfeb7a5af3650a1bdf3335af2be3262806aa` | Preservada |
| `fix/treg-pwa-c7-qrcode-fix` | `6218f0fd25a2047b5caba09cf854af74058db03d` | Preservada; base da versão estável |
| `docs/fase-4-analise-visual-e-prints` | `ac8d4fd...` (base) + commit deste relatório (HEAD) | Publicada nesta fase; contém os relatórios 10, 13, 16, 17, 18, 19 e 20 e as capturas do TREG |
| `docs/fase-1-versao-estavel-c7` | `5c892ef5ba1ce57ce9cc36292bc409e7086f3882` | Preservada |
| `docs/fase-3-checklist-roadmap` | `4c066feb1191b37bf9d307e33b1249d9ca6627e7` | Preservada |
| `docs/validacao-versao-estavel-c7` | `9ce1c4a99c73465f9db61dff25198c98b388e99d` | Preservada |
| `fase-b-treg-pwa` | `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f` | Preservada |
| `fix/treg-pwa-c3-publicacao-segura` | `1e8c15988c815b73bab3a028e1ecc17edd58268f` | Preservada |
| `fix/treg-pwa-c6-validacao-publicacao` | `a1bbe18553998284dcaf7ac99751624f6fd7e1e7` | Preservada |

Não existem branches locais.

## 7. Tag e Release

| Item | Valor | Estado |
|---|---|---|
| Tag anotada | `treg-pwa-v1.0.0-estavel` | Inalterada |
| Objeto da tag | `1d4137e21d127cf2e7490d171c5502bcbfb75155` | Inalterado |
| Commit apontado | `6218f0fd25a2047b5caba09cf854af74058db03d` | C7 |
| Release | `416672282` | Publicada, não editada |
| URL | https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.0.0-estavel | — |

## 8. Itens locais não publicados e justificativa

| Item | Quantidade | Motivo |
|---|---:|---|
| Capturas privadas do WhatsApp | 3 | Dados pessoais de terceiros |
| `02-tela-instalacao-qr.png` original | 1 | Usuário e chave parcial visíveis; versão redigida publicada |
| `README.md` local | 1 | Variante conflitante com o README TREG e contato de suporte; publicar sobrescreveria conteúdo remoto |
| `dashboard/dist/qrcode.js` | 1 | Apenas espaço em branco, comentário e newline; sem mudança funcional |
| `.playwright-mcp/` | 51 arquivos | Logs e snapshots temporários de automação, sem valor de produto |
| Relatórios remotos ausentes no local | 2 | `report/12-fase-c3...` e `report/16-fase-c7-correcao...` existem no GitHub, mas não na árvore local |

## 9. Publicação desta fase

- Branch: `docs/fase-4-analise-visual-e-prints`
- Commit documental anterior: `ac8d4fd557643e6b36ddddcd1d21aaf2c5a6ae43`
- Este relatório é adicionado à mesma branch em commit subsequente.
- O commit adiciona somente `report/`, sem alterar código, `main`, C7, tag ou Release.
- Não foi aberto pull request, não houve merge e não houve force push.

## 10. Conclusão e ponto de retomada

Toda a documentação local considerada legítima e publicável está sincronizada no GitHub. O código local não contém alteração funcional pendente em relação ao C7: as únicas diferenças são um README conflitante e ajustes cosméticos em `qrcode.js`.

O diretório local **não é um repositório Git**, portanto não existe um estado "working tree limpo" a declarar. A verificação possível foi feita por hashes e por clone temporário. O clone temporário ficou limpo após o push.

**Ponto de retomada:** branch `docs/fase-4-analise-visual-e-prints`, com relatórios 10, 13, 16, 17, 18, 19, 20, README e 11 capturas do TREG. A versão estável continua sendo o commit C7 `6218f0fd`, sob a tag `treg-pwa-v1.0.0-estavel`.

---
*Este relatório é parte da documentação do plugin hermes-pwa e não altera código, configuração, VPS, tag ou Release.*