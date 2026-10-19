# 24 — Correção do bloqueador B1 (CI Python)

## 1. Objetivo

Corrigir o bloqueador B1 identificado no relatório 23: a suíte Python do GitHub Actions não conseguia iniciar porque o job instalava apenas `pytest` e `pyyaml`, enquanto os testes e o backend do plugin dependem de FastAPI/Pydantic.

## 2. Baseline

| Item | Valor |
|---|---|
| Repositório | `Nifm1584/plugin-v1-pwa` |
| Branch | `feat/treg-pwa-fase-5a-p1` |
| Commit-base | `2701a28812792a834a90fc569a1fb3b175f1c7bd` |
| Relatórios preservados | `report/22-implementacao-fase-5a-p1.md`, `report/23-revisao-tecnica-fase-5a.md` |
| Hermes de referência | v0.22.2 |

Nenhum código de produto foi alterado nesta correção.

## 3. Causa do bloqueador

O workflow executava:

```text
python -m pip install --disable-pip-version-check pytest pyyaml
```

Mas:

- `tests/test_plugin_api.py` importa `fastapi`;
- `dashboard/plugin_api.py` importa `fastapi`, `fastapi.responses` e `pydantic`.

Em ambiente limpo, o `pytest` falhava na coleta:

```text
ERROR collecting tests/test_plugin_api.py
ModuleNotFoundError: No module named 'fastapi'
```

## 4. Correção aplicada

Arquivo alterado:

```text
.github/workflows/treg-pwa-validation.yml
```

A instalação passou a ser:

```text
python -m pip install --disable-pip-version-check pytest pyyaml fastapi pydantic
```

Não foi criado nem alterado nenhum teste condicional. Não há arquivo de dependências Python de teste no repositório para reutilizar; o `tests/package.json` cobre apenas as dependências Node.

### Dependências de teste do job Python

| Dependência | Motivo |
|---|---|
| `pytest` | Executor da suíte |
| `pyyaml` | `tests/test_plugin.py` lê `plugin.yaml` |
| `fastapi` | Importado por `plugin_api.py` e `test_plugin_api.py` |
| `pydantic` | Modelos do backend do plugin |

`httpx` não foi necessário para a suíte: os testes de rota usam `_proxy_json` mockado e não criam `TestClient` real.

## 5. Validação em ambiente limpo

Foi usado um virtualenv temporário, sem instalação global:

```text
C:\Users\Nilton A\AppData\Local\Temp\opencode\review-venv
```

Pacotes instalados no venv:

```text
Python 3.11.15
pytest
PyYAML
fastapi 0.146.0
pydantic 2.14.1
```

Comando executado:

```text
python -m pytest tests -q
```

Resultado:

```text
...... [100%]
6 passed in 2.31s
```

A falha de coleta foi eliminada e os testes avançaram até a execução completa. Não surgiram novas falhas Python.

> O CI usa Python 3.12; a validação local usou Python 3.11.15. FastAPI, Pydantic e os testes usados são compatíveis com 3.12, mas a execução real no runner do GitHub depende do push/PR, que não foi feito nesta fase.

## 6. Testes Node e sintaxe

```text
node --check dashboard/pwa/app.js
node --check dashboard/pwa/hermes-api.js
node --check dashboard/pwa/sw.js
node --check tests/hermes-api.test.js
node --check tests/ui-contract.test.js
node --check tests/qrcode.test.js
```

Resultado: **OK**.

```text
npm.cmd run test:api
```

Resultado: **PASS** — paginação, busca, pin, stop, SSE, capabilities e auth.

```text
npm.cmd run test:ui
```

Resultado: **PASS** — shell, menu, ordem dos scripts, service worker e ausência de fetch direto no `app.js`.

```text
npm.cmd run test:qrcode
```

Resultado: **3/3 PASS**.

```text
python -m py_compile dashboard/plugin_api.py __init__.py
```

Resultado: **OK**.

## 7. Escopo preservado

- Nenhum arquivo de código de produto foi alterado nesta correção.
- Nenhum teste foi desativado ou tornado condicional.
- Nenhuma dependência foi instalada globalmente.
- `main`, C7, tag e Release não foram alterados.
- A VPS não foi acessada.
- Nenhum commit, push, merge ou deploy foi feito.
- Relatórios 22 e 23 permanecem intactos.

## 8. Pendências

- A execução real no GitHub Actions ainda não ocorreu; a correção foi validada em venv limpo local.
- O CI usa Python 3.12 e o teste local usou 3.11.15.
- O workflow continua sem disparar em pushes da branch `feat/...`; será executado via PR para `main`.
- Os problemas menores do relatório 23 permanecem: transcrição/upload sem `profile`, atualização da sidebar após busca, cobertura de UI real e validação integrada com Hermes vivo.

## 9. Conclusão

O bloqueador B1 está corrigido no workflow. Em ambiente limpo com as dependências declaradas, a suíte Python executou **6 testes, todos aprovados**. A correção é mínima e não altera o comportamento do plugin.

**Próxima ação:** revisar esta correção e, se aprovada, preparar a publicação da branch para avançar à validação integrada do TREG PWA.
