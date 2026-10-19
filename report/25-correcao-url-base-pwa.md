# 25 — Correção da URL base das chamadas do plugin

## 1. Causa confirmada

A camada `TregApi` recebia:

```javascript
base: "api/"
origin: location.origin
```

E resolvia chamadas relativas com:

```javascript
absolute(base + path)
```

O resultado era:

```text
https://HOST/api/sessions?limit=80
```

em vez de:

```text
https://HOST/api/plugins/treg-pwa/api/sessions?limit=80
```

O prefixo `/api/plugins/treg-pwa/` era descartado. Por isso as chamadas de sessões, mensagens, criação de execução, streaming, aprovação, upload e pin podiam cair no dashboard/gateway errado. O envio de mensagem falhava no `POST` de criação da execução, enquanto busca, transcrição e login continuavam corretos por serem chamadas absolutas.

Reprodução antes da correção:

```text
https://treg.example/api/sessions?limit=80
```

## 2. Correção

- `TregApi.create` passou a aceitar `pageUrl`.
- A URL base é resolvida com `new URL(base, pageUrl)`, preservando o caminho da página:
  `/api/plugins/treg-pwa/api/`.
- `request()` e `runEvents()` montam URLs a partir dessa base.
- Chamadas absolutas continuam usando `requestAbsolute()` e atingem o dashboard:
  - `/api/sessions/search`
  - `/api/audio/transcribe`
  - `/auth/password-login`
- `app.js` passa `pageUrl: location.href`.

Caminhos resultantes confirmados:

| Operação | Caminho final |
|---|---|
| Sessões | `/api/plugins/treg-pwa/api/sessions` |
| Mensagens | `/api/plugins/treg-pwa/api/sessions/{id}/messages` |
| Criar run | `/api/plugins/treg-pwa/api/sessions/{id}/runs` |
| SSE de run | `/api/plugins/treg-pwa/api/runs/{id}/events` |
| Busca histórica | `/api/sessions/search` |
| Transcrição | `/api/audio/transcribe` |
| Login | `/auth/password-login` |

## 3. Arquivos alterados

- `dashboard/pwa/hermes-api.js`
- `dashboard/pwa/app.js`
- `tests/hermes-api.test.js`
- `tests/ui-contract.test.js`
- `report/README.md`
- `report/25-correcao-url-base-pwa.md`

## 4. Testes

### Node

```text
node --check dashboard/pwa/hermes-api.js
node --check dashboard/pwa/app.js
node tests/hermes-api.test.js
node tests/ui-contract.test.js
node tests/qrcode.test.js
```

Resultados:

- API: passou, incluindo os novos testes de caminhos finais para sessões, mensagens, run, SSE, busca, transcrição e login.
- UI contract: passou.
- QR: 3/3.
- Sintaxe JS: OK.

### Python

Em venv limpo com `pytest`, `pyyaml`, `fastapi` e `pydantic`:

```text
6 passed
```

`python -m py_compile dashboard/plugin_api.py __init__.py` também passou.

## 5. Commit da correção

```text
b52a4af01a4d676dfc481f61feb0899c466279aa5
fix(treg-pwa): corrigir URL base das chamadas do plugin
```

A documentação e o índice foram adicionados em commit subsequente na mesma branch.

## 6. Limitações

- A correção foi validada por testes automatizados de URL e suíte local; não foi testada em um Hermes vivo nem em produção.
- Mocks confirmam os caminhos gerados, não a resposta real do gateway.
- O CI real será executado pelo PR draft após o push.

## 7. Próxima ação

Se o CI passar, preparar a reinstalação do TREG pelo Hermes usando o SHA exato publicado nesta branch.
