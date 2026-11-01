# 45 — Congelamento da versão estável e Release da quarta atualização

**Data:** 2026-11-01<br>
**Fase:** Fase 1 — congelamento da versão estável<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Plugin:** `treg-pwa` (rota `/treg`)<br>
**Versão declarada no `plugin.yaml`:** `1.8.0b1`<br>
**Commit congelado:** `9b34073c94f61a78b427b518cd587909cf80884b`<br>
**Branch de origem:** `feat/treg-pwa-quarta-atualizacao`<br>
**Tag:** `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao`<br>
**Release:** https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.8.0b1-estavel-quarta-atualizacao

## 1. Objetivo e escopo

Oficializar como referência estável a versão do TREG PWA validada manualmente no celular e no computador após a quarta atualização (Fase 40 — imagens persistentes e mídias de saída do Hermes).

Esta fase foi exclusivamente de inspeção, congelamento e documentação. Nenhum código, configuração, servidor, banco ou segredo foi alterado. Não houve merge, deploy, reinstalação ou correção de autenticação.

## 2. Estado inicial verificado

- O repositório remoto, as branches, as tags, as Releases e o histórico Git foram inspecionados antes da publicação.
- O commit `9b34073c94f61a78b427b518cd587909cf80884b` existe no repositório e é um commit válido.
- A branch `feat/treg-pwa-quarta-atualizacao` apontava exatamente para `9b34073c94f61a78b427b518cd587909cf80884b` no momento da conferência.
- O commit `9b34073` tem como pai o commit de código `bb125e8937952acbb7cf88d048589d98083beeaa` (`feat(treg-pwa): exibir imagens e midias de saida`).
- O `plugin.yaml` no commit congelado declara `version: 1.8.0b1`.
- O `dashboard/manifest.json` no commit congelado também declara `1.8.0b1`.
- O service worker no commit congelado usa o cache `treg-pwa-v6`.
- Não existia tag apontando para `9b34073` antes desta fase.
- A branch `main` permanecia em `6e91b6121b8a4734a6c08a4da6f25d9ea9f60701` e não foi alterada.
- A branch documental `docs/validacao-mobile-fase-40` estava em `ca51369db5ad25430c1c6dda76ea9317f079495c`.
- `9b34073` é ancestral de `ca51369`; o diff entre os dois contém somente os relatórios 41, 42, 43 e o índice `report/README.md` (294 inserções, nenhum arquivo de código).
- O clone de verificação estava limpo, sem alterações pendentes, arquivos não rastreados ou divergências em relação à branch remota.

### 2.1 Cópia local fora do repositório

O diretório de trabalho local `C:\Users\Nilton A\Downloads\treg-v1hermes-plugin\hermes-plugins-main\hermes-pwa` não é um repositório Git e contém uma cópia antiga do plugin com `plugin.yaml` em `1.7.1`. Essa cópia não foi usada como fonte de verdade, não faz parte do repositório `Nifm1584/plugin-v1-pwa` e **não foi modificada**. O congelamento foi realizado sobre o estado remoto do repositório, cujo `plugin.yaml` declara `1.8.0b1`.

## 3. Conferência do commit validado

Os relatórios 41 e 43 registram `9b34073c94f61a78b427b518cd587909cf80884b` como base técnica da validação manual no celular e no computador.

O commit `9b34073` é documental e altera somente:

- `report/40-correcoes-multimidia.md` (novo);
- `report/README.md` (índice).

O commit de código imediatamente anterior, `bb125e89`, contém a implementação da Fase 40:

- `dashboard/pwa/app.css`;
- `dashboard/pwa/app.js`;
- `dashboard/pwa/hermes-api.js`;
- `dashboard/pwa/sw.js`;
- `dashboard/pwa/ui-utils.js`;
- testes em `tests/`.

O diff entre o congelamento anterior (`16345103fcabf4347ac4225605036dcc1e1be3e6`, tag `treg-pwa-v1.8.0b1-estavel`) e o novo congelamento (`9b34073`) contém 15 arquivos e 1.061 inserções / 30 remoções, incluindo código, testes e documentação da quarta atualização. Nada foi alterado nesta fase.

## 4. Proposta de identificação adotada

| Item | Valor |
|---|---|
| Versão do plugin | `1.8.0b1` (sem alteração) |
| Tag | `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao` |
| Release | `TREG PWA 1.8.0b1 — Quarta atualização validada (estável)` |
| Commit alvo | `9b34073c94f61a78b427b518cd587909cf80884b` |

A versão `1.8.0b1` já possuía um congelamento anterior em outro commit:

- tag `treg-pwa-v1.8.0b1-estavel` → `16345103fcabf4347ac4225605036dcc1e1be3e6`;
- tag beta `treg-pwa-v1.8.0b1` → `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4`.

Por isso, a nova tag recebeu o sufixo `-quarta-atualizacao`. O nome é único, não sobrescreve nenhuma tag existente e distingue o novo congelamento sem inventar uma versão que o `plugin.yaml` não declara.

## 5. Tag criada

- **Nome:** `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao`
- **Tipo:** tag anotada
- **Tag object SHA:** `674947608c20ba5a792ecf61a0817c742ef2aafd`
- **Commit apontado:** `9b34073c94f61a78b427b518cd587909cf80884b`
- **Tagger:** `Nifm1584 <Nifm1584@users.noreply.github.com>`
- **Data da tag:** 2026-11-01T14:50:51Z (11:50:51 -0300)
- **Remoto:** publicada no GitHub; conferida com `git ls-remote`.

Mensagem da tag:

```text
TREG PWA v1.8.0b1 - quarta atualizacao validada (estavel)

Commit de codigo congelado: 9b34073c94f61a78b427b518cd587909cf80884b

Validacao: relatorios 41 (celular) e 43 (computador) na branch docs/validacao-mobile-fase-40.

Versao do plugin permanece 1.8.0b1. Tag distinta de treg-pwa-v1.8.0b1-estavel (commit 16345103), preservada.
```

## 6. Release publicada

- **Título:** `TREG PWA 1.8.0b1 — Quarta atualização validada (estável)`
- **URL:** https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.8.0b1-estavel-quarta-atualizacao
- **Release ID:** `430650060`
- **Tag associada:** `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao`
- **Commit alvo:** `9b34073c94f61a78b427b518cd587909cf80884b`
- **Estado:** publicada; não é draft; não é pré-release; marcada como latest.
- **Publicação:** 2026-11-01T14:51:15Z.
- **Assets:** nenhum asset adicional; a Release referencia o código pelo commit/tag.

A descrição publicada registra a versão `1.8.0b1`, o SHA congelado, a branch de origem, a tag object, os relatórios 41, 42 e 43, as pendências de interface do relatório 42, a preservação das tags e Releases anteriores e o fato de que nenhuma implementação foi iniciada.

## 7. Verificações realizadas

| Verificação | Resultado |
|---|---|
| Commit validado existe | **OK** — `9b34073` |
| Branch `feat/treg-pwa-quarta-atualizacao` no commit validado | **OK** — `9b34073` |
| `plugin.yaml` em `1.8.0b1` | **OK** |
| `manifest.json` em `1.8.0b1` | **OK** |
| Service worker em `treg-pwa-v6` | **OK** |
| Tag já existia antes da criação | **Não** |
| Tag anotada criada e publicada | **OK** |
| Tag aponta para o commit validado | **OK** — tag object `6749476...`, commit `9b34073` |
| Release publicada, não draft, não pré-release | **OK** |
| Release associada à tag correta | **OK** |
| Release é a mais recente | **OK** |
| Assets adicionais | **Nenhum** |
| `main` alterada | **Não** |
| Tags/Releases anteriores preservadas | **OK** |
| Código alterado nesta fase | **Nenhum** |
| Servidor, `.env`, banco ou segredos alterados | **Nenhum** |
| Merge, deploy, reinstalação ou PR | **Não realizados** |

## 8. Preservação de histórico

Tags preservadas:

- `treg-pwa-v1.0.0-estavel` → tag object `1d4137e21d127cf2e7490d171c5502bcbfb75155` → `6218f0fd25a2047b5caba09cf854af74058db03d`;
- `treg-pwa-v1.8.0b1` → tag object `e57d1f69bb2daf216cf5c88c13ae0dd10bff8229` → `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4`;
- `treg-pwa-v1.8.0b1-estavel` → tag object `cd63a2f36ead5f6d458ee06cae76f4afd5bbf3ce` → `16345103fcabf4347ac4225605036dcc1e1be3e6`.

Releases preservadas:

- `treg-pwa-v1.0.0-estavel` (ID `416672282`);
- `treg-pwa-v1.8.0b1` (ID `423063241`, pré-release);
- `treg-pwa-v1.8.0b1-estavel` (ID `424842078`).

Também foram preservados a branch `main`, a branch `feat/treg-pwa-quarta-atualizacao`, a branch documental `docs/validacao-mobile-fase-40`, os relatórios 41–43, o plugin independente `hermes-pwa`, o núcleo do Hermes, os dados persistentes e as configurações do servidor.

## 9. Pendências e divergências encontradas

1. **Relatório 44 ausente:** o prompt da próxima fase referencia as correções de autenticação diagnosticadas no "relatório 44". Nenhum arquivo `report/44-*` foi encontrado em qualquer branch, tag ou Release do repositório. Para não ocupar nem sobrescrever esse número, o relatório desta fase foi registrado como **45**. O relatório 44 permanece reservado para o diagnóstico da próxima fase.
2. **Mesma versão em dois congelamentos:** o `plugin.yaml` declara `1.8.0b1`, a mesma versão do congelamento anterior em `16345103`. A distinção é feita pela tag/release `-quarta-atualizacao`; a versão do plugin **não foi alterada**.
3. **Cópia local antiga:** o diretório local fora do Git contém `plugin.yaml` em `1.7.1`; ele não representa o repositório e não foi modificado.
4. **Pendências de interface do relatório 42:** menu de três pontos para baixar imagem e menu do PDF com visualizar/baixar. Não invalidam a validação e não foram corrigidas nesta fase.
5. **Vídeo de saída:** não foi validado manualmente; permanece como pendência de teste.
6. **Evidência manual:** as validações 41 e 43 são relatos do usuário, não logs automatizados anexados ao repositório.
7. **`main` não atualizada:** a `main` permanece atrás do código validado. Isso é intencional nesta fase; não houve merge.

## 10. Itens obrigatórios do relatório

1. **Commit congelado e SHA completo:** `9b34073c94f61a78b427b518cd587909cf80884b`.
2. **Branch de origem:** `feat/treg-pwa-quarta-atualizacao`.
3. **Versão encontrada no `plugin.yaml`:** `1.8.0b1`.
4. **Nome e SHA da tag criada:** `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao`; tag object `674947608c20ba5a792ecf61a0817c742ef2aafd`, apontando para `9b34073c94f61a78b427b518cd587909cf80884b`.
5. **Nome e link da Release publicada:** `TREG PWA 1.8.0b1 — Quarta atualização validada (estável)` — https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.8.0b1-estavel-quarta-atualizacao.
6. **Nenhum arquivo de código alterado:** confirmado. Somente tag, Release e este relatório documental foram criados.
7. **Nenhuma configuração do servidor modificada:** confirmado. Não houve acesso, deploy, reinstalação, alteração de `.env`, banco, credenciais ou serviços.
8. **Pendências ou divergências:** descritas na seção 9.

## 11. Encerramento

- **Congelamento oficial:** concluído em `9b34073`.
- **Tag:** publicada, anotada, apontando exatamente para o commit validado.
- **Release:** publicada como estável, mais recente, sem assets e sem código alterado.
- **Referência estável:** a partir desta fase, `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao` é a referência congelada da quarta atualização.
- **Próxima fase:** não iniciada. As correções de autenticação/perfis serão tratadas em branch independente, a partir desta versão congelada, conforme novo prompt.
