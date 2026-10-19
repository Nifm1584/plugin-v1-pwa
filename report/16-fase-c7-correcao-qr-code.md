# 16 — Fase C7: Correção do QR Code e testes de ida e volta

## 1. Objetivo

Corrigir a geração de QR Codes do TREG PWA e substituir os testes inválidos da primeira tentativa da Fase C7 por uma suíte Node.js que gera os códigos com `dashboard/dist/qrcode.js` e os decodifica com um decodificador independente, comparando o texto recuperado com a URL original.

## 2. Defeito identificado

Em `dashboard/dist/qrcode.js`, a função `setupPositionAdjustPattern()` estava definida, mas não era chamada dentro de `makeImpl()`. Os padrões de alinhamento são necessários a partir da versão 2 do QR Code; a partir da versão 7 existem múltiplos padrões. Sem essa chamada, os QR Codes de versões com alinhamento ficam incompletos e podem não ser decodificados.

### 2.1 Correção aplicada

A chamada foi restaurada em `makeImpl()`, entre `setupPositionProbePattern()` e `setupTimingPattern()`:

```javascript
setupPositionProbePattern(0, 0);
setupPositionProbePattern(_moduleCount - 7, 0);
setupPositionProbePattern(0, _moduleCount - 7);
setupPositionAdjustPattern();
setupTimingPattern();
setupTypeInfo(test, maskPattern);
```

Commit da correção: `da0ccb44f80e7e06f2b3bc34935f8bbbd9021b87`.

## 3. Testes implementados

### 3.1 Abordagem

- Os testes ficam em `tests/qrcode.test.js` e são executados pelo Node.js.
- O gerador é carregado de `dashboard/dist/qrcode.js` via `require()`, sem qualquer importação como módulo Python.
- O decodificador independente é o `jsqr@1.4.0`, instalado em `tests/package.json` com lockfile versionado.
- A matriz de módulos do QR Code é rasterizada para RGBA (escala 8, margem de 4 módulos) e entregue ao `jsQR`.
- Cada caso verifica:
  - capacidade em bytes da versão escolhida;
  - dimensão esperada (`17 + versão * 4` módulos);
  - decodificação bem-sucedida;
  - igualdade exata entre `decoded.data` e a URL original.

### 3.2 Casos cobertos

| Caso | Versão | Correção de erro | Capacidade máxima | URL | Bytes | Padrões de alinhamento |
|------|--------|------------------|-------------------|-----|-------|------------------------|
| Curta | 1 | L | 17 bytes | `https://treg.co` | 15 | Nenhum (versão 1) |
| Média | 5 | M | 84 bytes | `https://treg-pwa.example.com/treg?session=abc123&agent=default&lang=pt-BR` | 73 | 1 padrão |
| Longa | 10 | M | 213 bytes | `https://treg-pwa.example.com/api/plugins/treg-pwa/?session=xyz789&agent=default&lang=pt-BR&timestamp=1234567890&signature=abcdef1234567890abcdef1234567890abcdef12` | 162 | Múltiplos padrões |

As URLs e versões foram dimensionadas para ficar dentro da capacidade de cada versão, evitando o erro `code length overflow`.

## 4. Resultados reais dos testes

### 4.1 Suíte Node.js de QR Code

Ambiente de execução: sandbox Linux remoto, Node.js v20.20.2, npm 10.8.2, `jsqr@1.4.0`.

Comando:

```bash
npm ci --prefix tests --ignore-scripts --no-audit --no-fund
npm run test:qrcode --prefix tests
```

Resultado:

```text
PASS curta, versão 1 sem padrão de alinhamento: versão 1, 15 bytes, 232x232px
PASS média, versão 5 com padrão de alinhamento: versão 5, 73 bytes, 360x360px
PASS longa, versão 10 com múltiplos padrões de alinhamento: versão 10, 162 bytes, 520x520px

3 de 3 casos passaram.
```

### 4.2 Verificação de sensibilidade à regressão

A suíte foi executada contra a versão anterior à correção (`a1bbe18:dashboard/dist/qrcode.js`) usando `QRCODE_PATH`. Resultado: o caso curto (versão 1, sem alinhamento) passou; os casos médio (versão 5) e longo (versão 10) falharam porque o `jsQR` não conseguiu decodificar os códigos. Código de saída: `1`.

Isso confirma que os testes detectam a ausência de `setupPositionAdjustPattern()`.

### 4.3 Demais verificações

Comandos executados no mesmo sandbox, sobre o commit `7322c957c0887a0bae4ce4820db8df860eddef85`:

```bash
node --check dashboard/pwa/app.js
node --check dashboard/dist/index.js
node --check dashboard/dist/qrcode.js
node --check dashboard/pwa/sw.js
node --check tests/qrcode.test.js
python3 -m py_compile __init__.py dashboard/plugin_api.py
python3 -m pytest tests -q
```

Resultados:

- Sintaxe JavaScript: todos os arquivos passaram em `node --check`.
- Compilação Python: passou sem erros.
- pytest: `2 passed` (`tests/test_plugin.py`).

### 4.4 Remoção dos testes Python inválidos

A primeira tentativa criou `tests/test_qrcode.py`, que tentava carregar um arquivo JavaScript com `importlib`. A execução real produziu `5 failed, 4 passed`: os cinco testes de QR falharam com `AttributeError: 'NoneType' object has no attribute 'loader'`. Esse arquivo foi removido no commit `67c873f75ee0f773ba4a1d5e6ae894e669cad098` e substituído pela suíte Node.js.

## 5. Atualização da CI

O workflow `.github/workflows/treg-pwa-validation.yml` foi ajustado para:

- executar em `push` também na branch `fix/treg-pwa-c7-qrcode-fix`;
- instalar as dependências Node com `npm ci` dentro de `tests/`;
- validar a sintaxe de `tests/qrcode.test.js`;
- executar `npm run test:qrcode`;
- manter compilação Python e `pytest`.

### 5.1 Execução da CI

- Workflow run: [#39075217595](https://github.com/Nifm1584/plugin-v1-pwa/actions/runs/39075217595)
- Commit validado: `7322c957c0887a0bae4ce4820db8df860eddef85`
- Resultado: **success**
- Etapas concluídas com sucesso: instalação de dependências Python e Node, `node --check`, testes de ida e volta do QR Code, compilação Python e `pytest`.

## 6. Publicação

| Commit | Conteúdo |
|--------|----------|
| `da0ccb44f80e7e06f2b3bc34935f8bbbd9021b87` | Restauração de `setupPositionAdjustPattern()` |
| `67c873f75ee0f773ba4a1d5e6ae894e669cad098` | Remoção dos testes Python inválidos |
| `7322c957c0887a0bae4ce4820db8df860eddef85` | Suíte Node.js com decodificador independente, dependências e atualização da CI |

Branch: `fix/treg-pwa-c7-qrcode-fix`.

## 7. Limitações

- O shell PowerShell do ambiente Windows local permaneceu indisponível; os testes foram executados em sandbox Linux remoto e na CI do GitHub.
- O `jsQR` decodifica uma rasterização da matriz gerada, não uma captura de câmera. Isso valida a estrutura do QR Code, mas não substitui um teste físico com leitor de celular.
- A CI usa Node.js 22; a execução manual usou Node.js 20.20.2. Ambos passaram.
- Nenhum merge na `main`, instalação na VPS, reinício de serviço, backup ou alteração no `hermes-pwa` original foi realizado.

## 8. Próximo passo

Aguardar revisão e aprovação. Após aprovação, o merge de `fix/treg-pwa-c7-qrcode-fix` na `main` pode ser realizado. A publicação na VPS de produção permanece fora do escopo desta fase.
