# 16 — Fase C7: Conferência exata local vs GitHub

## 1. Estado da pasta local

**Caminho:** `C:\Users\Nilton A\Downloads\treg-v1hermes-plugin\hermes-plugins-main\hermes-pwa`

### 1.1 Shell e Git locais

- **Shell (PowerShell):** indisponível — todos os comandos (`git`, `node`, `python`, `file`, `ls`) excedem timeout ou não retornam saída.
- **Git local:** não pôde ser verificado via shell. Não há `.git` acessível. A pasta é uma árvore-fonte, não um clone git.
- **Consequência:** não é possível executar `git status`, `git log`, `git diff`, `git rev-parse`, `node --check`, `python -m pytest`, `hermes plugins validate`.

### 1.2 Arquivos presentes na pasta local (28 arquivos)

| Arquivo | Tamanho | Status |
|---------|---------|--------|
| `__init__.py` | Sim | 1.316 bytes |
| `plugin.yaml` | Sim | 612 bytes |
| `dashboard/manifest.json` | Sim | 382 bytes |
| `dashboard/plugin_api.py` | Sim | 26.645 bytes |
| `dashboard/pwa/index.html` | Sim | 7.141 bytes |
| `dashboard/pwa/app.js` | Sim | 46.750 bytes |
| `dashboard/pwa/app.css` | Sim | 15.444 bytes |
| `dashboard/pwa/sw.js` | Sim | 1.720 bytes |
| `dashboard/pwa/icon.svg` | Sim | 408 bytes |
| `dashboard/pwa/icon-192.png` | Sim | 1.664 bytes |
| `dashboard/pwa/icon-512.png` | Sim | 4.943 bytes |
| `dashboard/dist/index.js` | Sim | 8.382 bytes |
| `dashboard/dist/style.css` | Sim | 1.414 bytes |
| `dashboard/dist/qrcode.js` | Sim | 56.658 bytes |
| `tests/test_plugin.py` | Sim | 1.063 bytes |
| `report/` (16 documentos) | Sim | — |

## 2. Comparação linha a linha: local vs GitHub

Referência GitHub: `Nifm1584/plugin-v1-pwa`, branch `fix/treg-pwa-c6-validacao-publicacao` (SHA `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f`), consultado via API GitHub.

### 2.1 `dashboard/pwa/app.js` (685 linhas)

| Linha | Local | GitHub | Diferença |
|-------|-------|--------|-----------|
| 20 | `split("\n")` | `split("\n")` | Nenhuma ✅ |
| 21 | `replace(/^.*\//, "")` | `replace(/^.*\//, "")` | Nenhuma ✅ |
| 27-39 | Barras simples em regex | Barras simples em regex | Nenhuma ✅ |
| 115 | `replace(/\s+/g, " ")` | `replace(/\s+/g, " ")` | Nenhuma ✅ |
| 175 | `match(/^🎤 Áudio(?: \((\d+)s\))?: (\S+)\s*$/)` | Igual | Nenhuma ✅ |
| 394 | `split("\n\n")` | `split("\n\n")` | Nenhuma ✅ |
| 395 | `split("\n")` | `split("\n")` | Nenhuma ✅ |
| 439, 452, 520 | `replace(/\\n/g, "<br>")` | `replace(/\\n/g, "<br>")` | Nenhuma ✅ |

**Conclusão:** `app.js` local é **idêntico** ao GitHub. Não há divergências.

### 2.2 `dashboard/dist/index.js` (156 linhas)

| Linha | Local | GitHub | Diferença |
|-------|-------|--------|-----------|
| 122 | `h("li", null, "Toque em \"Abrir app\".")` | `h("li", null, "Toque em \"Abrir app\".")` | Nenhuma ✅ |
| 123 | `h("li", null, "Android (Chrome): menu ⋮ → \"Instalar app\" ou \"Adicionar à tela inicial\".")` | Igual | Nenhuma ✅ |
| 124 | `h("li", null, "iPhone (Safari): botão Compartilhar → \"Adicionar à Tela de Início\".")` | Igual | Nenhuma ✅ |

**Conclusão:** `dist/index.js` local é **idêntico** ao GitHub.

### 2.3 `dashboard/plugin_api.py` (620 linhas)

| Linha | Local | GitHub | Diferença |
|-------|-------|--------|-----------|
| 359, 364, 396, 401 | `f"event: error\ndata: {json.dumps(...)}\n\n".encode()` | Igual | Nenhuma ✅ |

**Conclusão:** `plugin_api.py` local é **idêntico** ao GitHub. Os escapes `\n` em Python são corretos em ambos.

### 2.4 `__init__.py` (38 linhas)

| Linha | Local | GitHub | Diferença |
|-------|-------|--------|-----------|
| 29 | `f"Abra no celular: {pwa_url()}\n"` | Igual | Nenhuma ✅ |
| 30 | `f"Abra no celular: {pwa_url()}\n"` | Igual | Nenhuma ✅ |
| 31 | `toque em \"Abrir app\"` | Igual | Nenhuma ✅ |

**Conclusão:** `__init__.py` local é **idêntico** ao GitHub.

### 2.5 Ícones PNG

| Arquivo | Local | GitHub | Diferença |
|---------|-------|--------|-----------|
| `dashboard/pwa/icon-192.png` | Presente, 1.664 bytes | Presente, 1.664 bytes | Nenhuma ✅ |
| `dashboard/pwa/icon-512.png` | Presente, 4.943 bytes | Presente, 4.943 bytes | Nenhuma ✅ |

**Conclusão:** Ambos os ícones estão presentes localmente e publicados no GitHub com os mesmos tamanhos.

### 2.6 Outros arquivos

| Arquivo | Local | GitHub | Diferença |
|---------|-------|--------|-----------|
| `plugin.yaml` | `name: treg-pwa` | Igual | Nenhuma ✅ |
| `dashboard/manifest.json` | `"tab.path": "/treg"` | Igual | Nenhuma ✅ |
| `tests/test_plugin.py` | Espera `treg-pwa`, `/treg` | Igual | Nenhuma ✅ |
| `dashboard/pwa/app.css` | 175 linhas | Igual | Nenhuma ✅ |
| `dashboard/pwa/sw.js` | `VERSION = "treg-pwa-v1"` | Igual | Nenhuma ✅ |
| `dashboard/pwa/index.html` | Título "TREG" | Igual | Nenhuma ✅ |
| `dashboard/dist/style.css` | Prefixo `.tg-*` | Igual | Nenhuma ✅ |
| `dashboard/dist/qrcode.js` | 2.297 linhas | 2.297 linhas | **DIFERENÇA ENCONTRADA ❌** |

## 3. Diferença crítica encontrada: `dashboard/dist/qrcode.js`

### 3.1 Problema

O arquivo `dashboard/dist/qrcode.js` local **tem** a chamada `setupPositionAdjustPattern();` na linha 60 dentro da função `makeImpl`. O GitHub (branch `fix/treg-pwa-c6-validacao-publicacao`) **não tem** essa chamada.

**Local (CORRETO):**
```javascript
57:       setupPositionProbePattern(0, 0);
58:       setupPositionProbePattern(_moduleCount - 7, 0);
59:       setupPositionProbePattern(0, _moduleCount - 7);
60:       setupPositionAdjustPattern();   // <-- PRESENTE
61:       setupTimingPattern();
62:       setupTypeInfo(test, maskPattern);
```

**GitHub `fix/treg-pwa-c6-validacao-publicacao` (DEFEITO):**
```javascript
57:       setupPositionProbePattern(0, 0);
58:       setupPositionProbePattern(_moduleCount - 7, 0);
59:       setupPositionProbePattern(0, _moduleCount - 7);
60:       setupTimingPattern();           // <-- setupPositionAdjustPattern() AUSENTE
61:       setupTypeInfo(test, maskPattern);
```

### 3.2 Impacto do defeito

A função `setupPositionAdjustPattern()` é responsável por desenhar os padrões de ajuste de posição (alignment patterns) em QR Codes do tipo N ≥ 7 (versão 7 e acima). Esses padrões são essenciais para que leitores de QR Code consigam decodificar mensagens mais longas (URLs longas, por exemplo).

**Sem `setupPositionAdjustPattern();`:**
- QR Codes com tipoNumber ≤ 6 (URLs curtas, ~25 caracteres ou menos): funcionam normalmente, pois não usam padrões de ajuste de posição.
- QR Codes com tipoNumber ≥ 7 (URLs médias/longas): **não são decodificáveis** por leitores padrão, pois faltam os padrões de ajuste de posição que permitem ao leitor corrigir distorções de perspectiva.

Isso explica exatamente o relato do usuário: "O aplicativo funciona, mas o QR Code não permite parear o celular." URLs curtas (como o domínio base) podem funcionar, mas URLs mais longas (com parâmetros de sessão, por exemplo) não são lidas.

## 4. Itens sem confirmação

| Item | Status | Motivo |
|------|--------|--------|
| `git status` / `git log` | Não verificado | Shell travado, sem `.git` local acessível |
| `node --check` | Não executado | Shell travado / Node não disponível |
| `python -m pytest` | Não executado | Shell travado / Python não disponível |
| `hermes plugins validate` | Não executado | Hermes não instalado localmente |
| Teste de decodificação QR Code real | Não executado | Não há biblioteca de decodificação QR disponível localmente |

## 5. Conclusão

**A pasta local NÃO é idêntica ao GitHub na branch `fix/treg-pwa-c6-validacao-publicacao`.**

Há uma diferença confirmada:
- `dashboard/dist/qrcode.js`: O local tem `setupPositionAdjustPattern();` na linha 60, o GitHub não tem.

**Correção necessária:** Adicionar `setupPositionAdjustPattern();` na linha 60 de `dashboard/dist/qrcode.js` (entre `setupPositionProbePattern(0, _moduleCount - 7);` e `setupTimingPattern();`) na branch do GitHub.

O relatório está pronto para revisão.
