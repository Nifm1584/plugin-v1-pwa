# 18 — Fase 1: Registro da versão estável validada C7

## 1. Objetivo

Registrar a versão C7 como referência estável do TREG PWA por meio de uma tag anotada e de uma Release no GitHub, sem alterar código, a branch `main`, a instalação existente ou a VPS.

## 2. Pré-requisitos verificados

| Verificação | Resultado |
|---|---|
| Commit C7 existe | Sim: `6218f0fd25a2047b5caba09cf854af74058db03d` |
| Branch associada | `fix/treg-pwa-c7-qrcode-fix`, HEAD exatamente no commit C7 |
| Tags existentes antes do registro | Nenhuma |
| Releases existentes antes do registro | Nenhuma |
| Tag `treg-pwa-v1.0.0-estavel` já existia | Não; a referência retornou 404 antes da criação |
| CI do commit C7 | Workflow run `39075301916`, conclusão `success`, `head_sha` igual ao commit C7 |
| Instruções do GitHub | Consultadas na documentação oficial de criação de Releases; a tag foi criada como objeto anotado e a Release foi vinculada a ela |

A criação da tag e da Release adiciona apenas referências e metadados no GitHub. Não exige alterar arquivos, a `main` ou o conteúdo do commit C7.

## 3. Tag anotada

| Item | Valor |
|---|---|
| Nome | `treg-pwa-v1.0.0-estavel` |
| Tipo | Anotada (`object.type = tag`) |
| SHA do objeto da tag | `1d4137e21d127cf2e7490d171c5502bcbfb75155` |
| Commit apontado | `6218f0fd25a2047b5caba09cf854af74058db03d` |
| Mensagem | `TREG PWA v1.0.0 estável — versão C7 validada` |
| URL | https://github.com/Nifm1584/plugin-v1-pwa/tree/treg-pwa-v1.0.0-estavel |

A tag não existia antes e não foi movida nem reutilizada. Ela aponta exatamente para o commit C7 informado.

## 4. Release publicada

| Item | Valor |
|---|---|
| Título | `TREG PWA — Versão estável validada C7` |
| ID | `416672282` |
| Tag vinculada | `treg-pwa-v1.0.0-estavel` |
| URL | https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.0.0-estavel |
| Estado | Publicada; `draft: false`, `prerelease: false` |
| Publicada em | 2026-10-18T19:55:42Z |

As notas da Release registram:

- correção do QR Code por meio da restauração de `setupPositionAdjustPattern()` em `dashboard/dist/qrcode.js`;
- testes automatizados aprovados conforme as evidências do projeto: suíte Node com decodificador independente 3/3, CI `39075301916` success, checagens de sintaxe JavaScript, compilação Python e 2 testes pytest;
- validação manual **relatada pelo usuário**: leitura física do QR Code, funcionamento do TREG PWA no navegador do celular e uso do aplicativo instalado na VPS;
- correspondência exata com o commit `6218f0fd25a2047b5caba09cf854af74058db03d`;
- melhorias futuras devem ocorrer em branches separadas;
- a Release não representa garantia de ausência de defeitos nem substitui testes futuros.

A validação manual é evidência relatada pelo usuário e não uma nova execução feita pelo processo de Release.

## 5. Integridade e limites

- A `main` do projeto permaneceu em `07cacfeb7a5af3650a1bdf3335af2be3262806aa`.
- Nenhum arquivo de código foi alterado por esta fase.
- A branch C7 e o conteúdo do commit C7 não foram modificados.
- Nenhuma tag foi movida ou reutilizada.
- Nenhuma operação foi feita na VPS: não houve instalação, reinstalação, reinício, backup ou alteração do plugin original `hermes-pwa`.
- A tag é anotada, mas não possui assinatura criptográfica; a verificação de assinatura do GitHub retorna `unsigned`. Isso não altera o commit apontado, mas deve ser registrado como limitação.
- A Release se baseia nas evidências disponíveis até a data; não houve reexecução de testes nesta fase.

## 6. Publicação documental

- Este relatório foi publicado na branch `docs/fase-1-versao-estavel-c7`, criada a partir do commit C7.
- O repositório de histórico foi atualizado em branch própria, com `estado-atual.md` e um arquivo de sessão; `historico.md` foi preservado.
- Nenhuma dessas publicações altera a `main` ou o código do plugin.

## 7. Operações não realizadas

- Não houve reinstalação ou atualização do plugin na VPS.
- Não houve reinício de serviços.
- Não houve criação de backups adicionais.
- Não houve alteração no plugin original `hermes-pwa`.
- Não houve merge na `main`.
- Não houve publicação de código nesta fase.

## 8. Ponto de retomada

A Fase 1 está concluída: a tag anotada e a Release estão publicadas e vinculadas ao commit C7. A Fase 2 não foi iniciada. O próximo passo depende de autorização explícita do usuário; não reinstalar nem alterar a VPS antes disso.
