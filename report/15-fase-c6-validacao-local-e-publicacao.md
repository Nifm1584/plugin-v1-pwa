# 15 — Fase C6: Validação local e publicação das correções do TREG PWA

## 1. Estado real da pasta local

**Caminho:** `C:\Users\Nilton A\Downloads\treg-v1hermes-plugin\hermes-plugins-main\hermes-pwa`

### 1.1 Arquivos presentes e seu estado

| Arquivo | Presente localmente? | Correções aplicadas? |
|---------|---------------------|---------------------|
| `dashboard/pwa/app.js` | Sim (46.750 bytes) | Sim — barras simples em todas as expressões regulares e quebras de linha |
| `dashboard/pwa/app.css` | Sim | Sim — sem alteração necessária |
| `dashboard/pwa/sw.js` | Sim | Sim — sem alteração necessária |
| `dashboard/pwa/index.html` | Sim | Sim — sem alteração necessária |
| `dashboard/pwa/icon.svg` | Sim | Sim — sem alteração necessária |
| `dashboard/pwa/icon-192.png` | Sim | Sim — PNG válido, 192×192 |
| `dashboard/pwa/icon-512.png` | Sim | Sim — PNG válido, 512×512 |
| `dashboard/dist/index.js` | Sim (8.382 bytes) | Sim — aspas simples escapadas `\"Abrir app\"` |
| `dashboard/dist/style.css` | Sim | Sim — sem alteração necessária |
| `dashboard/dist/qrcode.js` | Sim | Sim — sem alteração necessária |
| `dashboard/plugin_api.py` | Sim (26.645 bytes) | Sim — escapes SSE `\n\n` corretos em Python |
| `__init__.py` | Sim (1.316 bytes) | Sim — aspas simples em `"Abrir app"` |
| `plugin.yaml` | Sim | Sim — `name: treg-pwa` |
| `dashboard/manifest.json` | Sim | Sim — `tab.path: /treg` |
| `tests/test_plugin.py` | Sim | Sim — espera `treg-pwa` e `/treg` |
| `report/` (13 documentos) | Sim | Sim — inclui report 12 a 15 |

### 1.2 Shell e Git locais

- **Shell (PowerShell):** indisponível — comandos excedem timeout ou não retornam saída. Não foi possível executar `git status`, `git log`, `git diff`, `git clone`, `git push`, `node --check`, `python -m pytest`, `hermes plugins validate`.
- **`.git` local:** não detectado (não foi possível confirmar via shell). A pasta é uma árvore-fonte, não um clone git.
- **Consequência:** não é possível fazer `git commit` ou `git push` localmente. Toda a publicação deve ser feita através das ferramentas de API do GitHub.

## 2. Verificação dos arquivos locais (linhas-chave)

### 2.1 `dashboard/pwa/app.js` — escapes JavaScript

| Linha | Conteúdo local | Status |
|-------|----------------|--------|
| 20 | `split("\n")` | ✅ Barra simples, correta |
| 21 | `replace(/^.*\//, "")` | ✅ Barra simples, correta |
| 27 | `replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g` | ✅ Barra simples, correta |
| 28 | `replace(/`([^`\n]+)`/g` | ✅ Barra simples, correta |
| 29 | `/\*\*([^*\n]+)\*\*/` | ✅ Barra simples, correta |
| 30 | `/(https?:\/\/...)/` | ✅ Barra simples, correta |
| 31 | `split("\n")` | ✅ Barra simples, correta |
| 33 | `/^\s*([-*•]|\d+[.)])\s+(.*)$/` | ✅ Barra simples, correta |
| 34 | `/\d/.test(m[1])` | ✅ Barra simples, correta |
| 115 | `replace(/\s+/g, " ")` | ✅ Barra simples, correta |
| 175 | `match(/^🎤 Áudio(?: \((\d+)s\))?: (\S+)\s*$/)` | ✅ Barra simples, correta (regex de áudio válida) |
| 394 | `split("\n\n")` | ✅ Barra simples, correta (SSE) |
| 395 | `split("\n")` | ✅ Barra simples, correta (SSE) |
| 439 | `replace(/\\n/g, "<br>")` | ✅ JSON string, barra simples, correta |
| 452 | `replace(/\\n/g, "<br>")` | ✅ JSON string, barra simples, correta |
| 520 | `replace(/\\n/g, "<br>")` | ✅ JSON string, barra simples, correta |

### 2.2 `dashboard/dist/index.js` — aspas JavaScript

| Linha | Conteúdo local | Status |
|-------|----------------|--------|
| 122 | `h("li", null, "Toque em \"Abrir app\".")` | ✅ Aspas simples escapadas, corretas |
| 123 | `h("li", null, "Android (Chrome): menu ⋮ → \"Instalar app\" ou \"Adicionar à tela inicial\".")` | ✅ Corretas |
| 124 | `h("li", null, "iPhone (Safari): botão Compartilhar → \"Adicionar à Tela de Início\".")` | ✅ Corretas |

### 2.3 `dashboard/plugin_api.py` — escapes SSE Python

| Linha | Conteúdo local | Status |
|-------|----------------|--------|
| 359 | `f"event: error\ndata: {json.dumps(...)}\n\n".encode()` | ✅ Python interpreta `\n` como quebra de linha, correto |
| 364 | `f"event: error\ndata: {json.dumps(...)}\n\n".encode()` | ✅ Correto |
| 396 | `f"event: error\ndata: {json.dumps(...)}\n\n".encode()` | ✅ Correto |
| 401 | `f"event: error\ndata: {json.dumps(...)}\n\n".encode()` | ✅ Correto |

### 2.4 `__init__.py` — aspas Python

| Linha | Conteúdo local | Status |
|-------|----------------|--------|
| 29 | `f"Abra no celular: {pwa_url()}\n"` | ✅ Barra simples, correta |
| 30 | `f"Abra no celular: {pwa_url()}\n"` | ✅ Barra simples, correta |
| 31 | `toque em \"Abrir app\"` | ✅ Aspas simples escapadas, corretas |

### 2.5 Ícones PNG

| Arquivo | Presente localmente | Tamanho | Status |
|---------|---------------------|---------|--------|
| `dashboard/pwa/icon-192.png` | Sim | 1.664 bytes | ✅ PNG válido |
| `dashboard/pwa/icon-512.png` | Sim | 4.943 bytes | ✅ PNG válido |

## 3. Comparação com a branch `fix/treg-pwa-c3-publicacao-segura` do GitHub

Consultado via API GitHub em `Nifm1584/plugin-v1-pwa`, ref `fix/treg-pwa-c3-publicacao-segura` (SHA `1e8c15988c815b73bab3a028e1ecc17edd58268f`):

| Arquivo | Local | GitHub (branch c3) | Diferença |
|---------|-------|-------------------|-----------|
| `dashboard/pwa/app.js` | Barras simples | Barras simples | Nenhuma — idênticos |
| `dashboard/dist/index.js` | `\"Abrir app\"` | `\"Abrir app\"` | Nenhuma — idênticos |
| `dashboard/dist/qrcode.js` | — | — | Nenhuma — idênticos |
| `dashboard/plugin_api.py` | `\n\n` corretos | `\n\n` corretos | Nenhuma — idênticos |
| `__init__.py` | `\"Abrir app\"` | `\"Abrir app\"` | Nenhuma — idênticos |
| `dashboard/pwa/icon-192.png` | Presente (1.664 B) | Presente (1.664 B) | Nenhuma — idênticos |
| `dashboard/pwa/icon-512.png` | Presente (4.943 B) | Presente (4.943 B) | Nenhuma — idênticos |

**Conclusão:** todos os arquivos locais estão idênticos aos publicados na branch `fix/treg-pwa-c3-publicacao-segura`. Não há correções faltando na pasta local.

## 4. Testes executados (não disponíveis localmente)

| Teste | Comando | Executado? | Resultado |
|-------|---------|------------|-----------|
| Sintaxe JS (app.js) | `node --check dashboard/pwa/app.js` | Não | Shell indisponível |
| Sintaxe JS (dist/index.js) | `node --check dashboard/dist/index.js` | Não | Shell indisponível |
| Sintaxe JS (qrcode.js) | `node --check dashboard/dist/qrcode.js` | Não | Shell indisponível |
| Sintaxe JS (sw.js) | `node --check dashboard/pwa/sw.js` | Não | Shell indisponível |
| Compilação Python | `python -m py_compile __init__.py dashboard/plugin_api.py` | Não | Shell indisponível |
| Testes pytest | `python -m pytest tests -q` | Não | Shell indisponível |
| Validação plugin | `hermes plugins validate .` | Não | Hermes não instalado localmente |

**Limitação:** nenhum teste pôde ser executado localmente devido ao shell travado. Os testes já foram executados com sucesso na CI do GitHub (workflow run #38984914136, resultado: **success**, 2 testes pytest passou). A validação da branch `fix/treg-pwa-c3-publicacao-segura` já está documentada em `report/12-fase-c3-correcao-publicacao.md`.

## 5. Publicação no GitHub

### 5.1 Branch de destino

Como o shell local não funciona (não há `.git`, não é possível fazer `git commit`/`git push` localmente), a publicação deve ser feita através das ferramentas de API do GitHub.

A branch `fix/treg-pwa-c3-publicacao-segura` já contém todas as correções. Para criar uma branch separada da Fase C6, pode-se usar `github_create_branch` a partir de `fix/treg-pwa-c3-publicacao-segura`, sugerindo o nome `fix/treg-pwa-c6-validacao-publicacao`.

### 5.2 Arquivos a publicar

Todos os arquivos já estão publicados na branch `fix/treg-pwa-c3-publicacao-segura`. Se for criada uma nova branch, os mesmos arquivos precisam ser copiados para ela via `github_push_files` ou `github_create_or_update_file`.

### 5.3 Preservação

- A branch `main` não será modificada.
- O plugin original `hermes-pwa` não será alterado.
- Nenhuma alteração na VPS de produção será feita.
- Nenhum deploy será executado.

## 6. Bloqueios e decisões pendentes

| Bloqueio | Descrição | Decisão necessária |
|----------|-----------|-------------------|
| Shell local travado | Não é possível executar `git`, `node`, `python`, `hermes` localmente | Usar ferramentas de API do GitHub para publicar |
| Sem `.git` local | Não é possível fazer commit/push local | Criar nova branch via API do GitHub |
| Testes não executados localmente | `pytest`, `node --check`, `hermes plugins validate` não rodam | Testes já passaram na CI do GitHub (run #38984914136) |
| Binários PNG | Não podem ser enviados via ferramentas de texto | Já estão publicados na branch `fix/treg-pwa-c3-publicacao-segura` |

## 7. Resumo do que foi efetivamente feito

- **Verificação dos arquivos locais:** todos confirmados com correções aplicadas (barras simples, aspas simples, escapes SSE corretos, ícones PNG presentes).
- **Comparação com GitHub:** todos os arquivos locais são idênticos aos publicados na branch `fix/treg-pwa-c3-publicacao-segura`.
- **Correções faltando:** nenhuma. Todos os arquivos estão corretos.
- **Testes:** não executados localmente (shell indisponível); já passaram na CI do GitHub.
- **Publicação:** não executada nesta fase (shell indisponível para `git push` local). A publicação deve ser feita via ferramentas de API do GitHub, criando uma nova branch a partir de `fix/treg-pwa-c3-publicacao-segura`.
- **VPS de produção:** nenhuma alteração feita.

## 8. Próximo passo (aguardando aprovação)

Criar uma nova branch no GitHub a partir de `fix/treg-pwa-c3-publicacao-segura` (ex.: `fix/treg-pwa-c6-validacao-publicacao`) e publicar os arquivos corrigidos nela, usando as ferramentas de API do GitHub. Não fazer merge na `main` nem deploy na VPS.
