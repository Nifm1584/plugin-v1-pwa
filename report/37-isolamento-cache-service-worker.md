# 37 — Isolamento de cache do service worker

**Data:** 2026-10-25<br>
**Fase:** 4G — correção preventiva de isolamento de cache<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch-base:** `feat/treg-pwa-preparacao-validacao-real`<br>
**SHA-base:** `1c112805bbfae6f56ae936d323dd5ecd70707a3d`<br>
**Branch de correção:** `fix/treg-pwa-isolamento-cache-sw`<br>
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-cache-sw-dev`

## 1. Base e relação com a preparação anterior

Antes de editar, foi confirmado:

- a branch `feat/treg-pwa-preparacao-validacao-real` estava no remoto em `1c112805bbfae6f56ae936d323dd5ecd70707a3d`;
- essa referência é o HEAD da preparação da Fase 4F;
- o relatório 36 foi lido e permanece integralmente preservado;
- o código das Fases 4D e 4E estava presente e sem alterações;
- a worktree estava limpa no SHA-base;
- a branch `fix/treg-pwa-isolamento-cache-sw` não existia localmente nem no remoto.

A branch de correção foi criada diretamente de `1c11280`, sem reset, merge ou alteração da base. O relatório 36 continua documentando que a preparação original não alterou o código; este relatório 37 registra uma correção preventiva posterior.

## 2. Diagnóstico

O service worker anterior limpava o CacheStorage com:

```js
keys.filter((k) => k !== VERSION)
```

O CacheStorage é compartilhado por todas as aplicações da mesma origem. Essa condição podia remover caches de outros plugins e aplicações hospedadas no mesmo domínio, inclusive o cache do plugin original `hermes-pwa` (por exemplo, `hermes-pwa-v12`).

O problema não era apenas cosmético: a ativação de uma nova versão do TREG podia apagar o cache do original e de outros apps, causando perda de assets offline e comportamento inesperado até o próximo carregamento.

## 3. Namespace confirmado no histórico

O histórico do repositório confirma que os caches do TREG usam exclusivamente o prefixo `treg-pwa-`:

| Versão | Cache | Referência histórica |
|---|---|---|
| Original | `hermes-pwa-v12` | `47831b9f4e46556ffd3e3161447460be4ffd828f` |
| TREG inicial | `treg-pwa-v1` | `e71a48f2ff820b6c636871966a0df4c96b4d33be` |
| TREG | `treg-pwa-v2` | `2d939ded5470417a1f90cfd5a0472fdd252d234d` |
| TREG | `treg-pwa-v3` | `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4` |
| TREG | `treg-pwa-v4` | `d406e4320469a5c585e9bf114e010aaf88a3e3ad` e preparação 4F |
| TREG corrigido | `treg-pwa-v5` | esta fase |

A tabela mostra que `hermes-pwa-v12` pertence ao plugin original e não deve ser removido pelo TREG. O prefixo `treg-pwa-` é o namespace comprovado das versões do TREG.

## 4. Correção aplicada

`dashboard/pwa/sw.js` foi alterado em dois pontos:

```js
const VERSION = "treg-pwa-v5";
```

e, no evento `activate`:

```js
keys.filter((k) => k.startsWith("treg-pwa-") && k !== VERSION)
```

Com isso:

- somente caches antigos do namespace `treg-pwa-` são removidos;
- o cache atual `treg-pwa-v5` permanece;
- `hermes-pwa-v12` e quaisquer outros caches do plugin original permanecem;
- caches de outras aplicações da mesma origem permanecem;
- o comportamento de instalação, rede, API, navegação, autenticação, interface, sessões, mensagens e uploads não foi alterado.

A versão declarada do plugin permanece **`1.8.0b1`**. Nenhuma versão geral do plugin foi incrementada.

## 5. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/sw.js` | Versão do cache para `treg-pwa-v5`; limpeza restrita ao prefixo `treg-pwa-` |
| `tests/sw-cache-isolation.test.js` | Novo teste de regressão que executa o evento `activate` com CacheStorage simulado |
| `tests/package.json` | Script `test:sw` para o novo teste |
| `tests/ui-contract.test.js` | Contrato atualizado para `treg-pwa-v5`, filtro por namespace e proibição da limpeza indiscriminada |
| `report/README.md` | Inclusão deste relatório no índice |
| `report/37-isolamento-cache-service-worker.md` | Este relatório |

Não foram alterados `plugin.yaml`, `dashboard/plugin_api.py`, `dashboard/dist/`, `app.js`, `app.css`, `index.html`, `ui-utils.js`, `hermes-api.js`, o relatório 36 ou qualquer outro relatório anterior.

## 6. Teste de regressão

O teste `tests/sw-cache-isolation.test.js` lê o `sw.js` real e o executa em um contexto Node `vm`, com:

- `self.addEventListener` capturando os handlers reais;
- `self.clients.claim` simulado;
- `caches.keys()` devolvendo caches TREG atuais/antigos, caches do original e caches de terceiros;
- `caches.delete()` registrando exatamente quais chaves foram removidas.

Cenário executado:

```text
treg-pwa-v5
treg-pwa-v4
treg-pwa-v3
treg-pwa-v2
treg-pwa-v1
hermes-pwa-v12
hermes-pwa-v11
other-app-cache-v9
workbox-precache-v2
```

Resultado esperado e confirmado:

- removidos: `treg-pwa-v1`, `treg-pwa-v2`, `treg-pwa-v3`, `treg-pwa-v4`;
- preservados: `treg-pwa-v5`, `hermes-pwa-v12`, `hermes-pwa-v11`, `other-app-cache-v9`, `workbox-precache-v2`;
- `self.clients.claim()` foi chamado após a limpeza;
- nenhuma chave fora do prefixo `treg-pwa-` foi apagada.

O teste não é uma asserção textual superficial: ele executa a lógica real do evento `activate` do arquivo versionado.

## 7. Resultados dos testes

| Teste | Resultado real |
|---|---|
| `npm.cmd run test:sw` | **PASS** — somente caches antigos TREG removidos |
| `npm.cmd run test:ui` | **PASS** — contrato com `treg-pwa-v5` e filtro isolado |
| `npm.cmd run test:api` | **PASS** |
| `npm.cmd run test:uiutils` | **PASS** |
| `npm.cmd run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` (venv do projeto) | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `node --check` em `sw.js`, novo teste, testes e JS relevantes | **OK** |
| `git diff --check` | **OK** |

Observação de ambiente: a primeira execução do QR Code não encontrou o módulo de teste `jsqr` na worktree nova. A dependência de teste já existente foi copiada localmente para `tests/node_modules` (ignorada pelo Git); o teste foi repetido e passou 3/3. Nenhuma dependência global ou de runtime foi instalada.

Não houve teste reprovado na execução final.

## 8. Limitações

- O teste de cache usa um CacheStorage simulado em Node, não o CacheStorage real de um navegador.
- Não foi executado o ciclo real de instalação/ativação do service worker em um PWA instalado.
- Não houve instalação no Hermes, teste em VPS, celular físico ou ambiente com o plugin original instalado lado a lado.
- Não foi executada uma validação real de que o cache do `hermes-pwa` permanece intacto em um navegador com os dois plugins na mesma origem; a garantia vem da lógica executada e do teste com mocks.
- O workflow de CI atual não executa a branch de correção; os testes acima são locais. O novo script `test:sw` está no `package.json`, mas o workflow existente não foi alterado fora do escopo permitido.
- A publicação e a instalação continuam sendo etapas separadas; esta fase não instala nem atualiza o Hermes.

## 9. Preservação

Não foram alterados:

- o commit C7 `6218f0fd25a2047b5caba09cf854af74058db03d` ou sua tag/release estável;
- a `main`;
- os commits congelados das Fases 4D e 4E;
- o conteúdo de `plugin.yaml`, que permanece em `1.8.0b1`;
- o plugin original `hermes-pwa`;
- o relatório 36 ou qualquer relatório anterior;
- instalações, VPS, serviços, `.env`, credenciais ou dados persistentes.

Não houve merge, PR, tag, release, deploy ou instalação. O arquivo de histórico `historico.md` não foi alterado. `estado-atual.md` não foi atualizado porque esta fase não recebeu acesso e autorização explícita ao repositório de histórico.

## 10. Git e publicação

- **SHA-base:** `1c112805bbfae6f56ae936d323dd5ecd70707a3d`.
- **Branch:** `fix/treg-pwa-isolamento-cache-sw`.
- **Commit de código:** `eb6f4e42c76f59524184bf398c91aff739853f71`
  - Mensagem: `fix(treg-pwa): isolar limpeza de cache do service worker`
  - 4 arquivos: `sw.js`, `tests/sw-cache-isolation.test.js`, `tests/package.json`, `tests/ui-contract.test.js`.
- **Commit deste relatório:** o HEAD final da branch, criado após o código; o SHA final é informado no resumo de encerramento e conferido no remoto.
- **Publicação:** somente esta branch será enviada ao GitHub. Não haverá PR, merge, tag, release, deploy ou instalação.

## 11. Encerramento

- **Fase 4G concluída:** sim.
- **Código corrigido:** `eb6f4e42c76f59524184bf398c91aff739853f71`; cache `treg-pwa-v5`; limpeza restrita a `treg-pwa-`.
- **Teste de regressão:** executado e aprovado, com caches TREG antigos removidos e caches atuais, do original e de terceiros preservados.
- **Testes:** `test:sw`, UI, API, UI utils, QR 3/3, pytest 7 passed, `py_compile`, `node --check` e `git diff --check` aprovados localmente.
- **Pendências:** validação real em navegador/PWA, teste lado a lado com `hermes-pwa` na mesma origem e integração futura ao workflow de CI; nada instalado no Hermes.
- **Próximo passo único:** revisão do usuário e, depois da revisão, preparação do prompt para atualizar a instalação existente no Hermes. Não instalar nesta fase.
- **Caminho completo:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-cache-sw-dev\report\37-isolamento-cache-service-worker.md`.
