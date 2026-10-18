# 10 — Validação da versão estável C7

## 1. Objetivo

Documentar a conclusão das Fases 1 e 2 do TREG PWA: o registro da versão estável C7, a confirmação de que o plugin instalado corresponde ao commit da tag estável, a correção do QR Code, os testes e as evidências disponíveis, a tag e a Release publicadas e o estado final do projeto.

Esta etapa é somente documental. Não alterou código, não reinstalou nem atualizou o plugin, não acessou a VPS, não reiniciou serviços, não criou backups e não modificou a tag, a Release ou a `main`.

## 2. Fase 1: registro da versão estável

### 2.1 Pré-requisitos verificados

| Verificação | Resultado |
|---|---|
| Commit C7 existe | Sim: `6218f0fd25a2047b5caba09cf854af74058db03d` |
| Branch associada | `fix/treg-pwa-c7-qrcode-fix`, HEAD nesse commit |
| Tags existentes antes do registro | Nenhuma |
| Releases existentes antes do registro | Nenhuma |
| Tag `treg-pwa-v1.0.0-estavel` já existia | Não; a referência retornou 404 antes da criação |
| CI do commit C7 | Workflow run `39075301916`, conclusão `success`, `head_sha` igual ao commit C7 |
| Instruções do GitHub | Consultadas na documentação oficial de criação de Releases; a tag foi criada como objeto anotado e a Release foi vinculada a ela |

A tag e a Release adicionam apenas referências e metadados no GitHub. Não alteram arquivos, a `main`, o conteúdo do commit C7 ou o código do plugin.

### 2.2 Tag anotada

| Item | Valor |
|---|---|
| Nome | `treg-pwa-v1.0.0-estavel` |
| Tipo | Anotada (`object.type = tag`) |
| SHA do objeto da tag | `1d4137e21d127cf2e7490d171c5502bcbfb75155` |
| Commit apontado | `6218f0fd25a2047b5caba09cf854af74058db03d` |
| Mensagem | `TREG PWA v1.0.0 estável — versão C7 validada` |
| URL | https://github.com/Nifm1584/plugin-v1-pwa/tree/treg-pwa-v1.0.0-estavel |

A tag não existia antes e não foi movida nem reutilizada. Ela aponta exatamente para o commit C7.

### 2.3 Release publicada

| Item | Valor |
|---|---|
| Título | `TREG PWA — Versão estável validada C7` |
| ID | `416672282` |
| Tag vinculada | `treg-pwa-v1.0.0-estavel` |
| URL | https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.0.0-estavel |
| Estado | Publicada; `draft: false`, `prerelease: false` |
| Publicada em | 2026-10-18T19:55:42Z |

As notas da Release registram a correção do QR Code, os testes automatizados documentados, a validação manual relatada pelo usuário, a correspondência exata com o commit C7, a orientação de melhorias futuras em branches separadas e a ausência de garantia de inexistência de defeitos.

## 3. Fase 2: validação da instalação existente

A Fase 2 é documentada aqui como a validação da instalação existente. Esta etapa não executou reinstalação, atualização, reinício ou qualquer operação na VPS.

### 3.1 Correspondência com a tag estável

A confirmação registrada é que o plugin instalado corresponde ao commit da tag estável C7:

- **Commit de referência:** `6218f0fd25a2047b5caba09cf854af74058db03d`.
- **Tag de referência:** `treg-pwa-v1.0.0-estavel`.
- **Origem da confirmação:** validação relatada pelo usuário/Hermes no ambiente de uso.
- **Limite:** a verificação direta de hash no VPS não foi repetida nesta etapa documental.

Essa confirmação é tratada como evidência de ambiente, separada dos testes automatizados do repositório.

### 3.2 Validações manuais relatadas

| Validação | Evidência | Limite |
|---|---|---|
| Leitura física do QR Code | Relato do usuário após a instalação da versão C7 | Não foi refeita nesta etapa |
| Funcionamento do TREG PWA no navegador do celular | Relato do usuário | Não foi refeito nesta etapa |
| Uso do aplicativo instalado na VPS | Relato do usuário/Hermes | Não houve acesso à VPS nesta etapa |
| Envio de foto pelo celular e análise pelo Hermes | Relato do usuário, com validação adicional do Ducan | Não comprova persistência da imagem no histórico |

As validações acima são evidências manuais do usuário, não execuções desta etapa documental.

## 4. Correção do QR Code

O defeito corrigido estava em `dashboard/dist/qrcode.js`: a função `setupPositionAdjustPattern()` existia, mas não era chamada dentro de `makeImpl()`. A chamada foi restaurada entre `setupPositionProbePattern()` e `setupTimingPattern()`.

A correção foi registrada no commit `da0ccb44f80e7e06f2b3bc34935f8bbbd9021b87` e incorporada ao commit C7 `6218f0fd25a2047b5caba09cf854af74058db03d`.

## 5. Testes e evidências automatizadas

| Verificação | Resultado | Evidência |
|---|---|---|
| Suíte Node de QR Code | 3/3 casos aprovados | Curta: versão 1, 15 bytes; média: versão 5, 73 bytes; longa: versão 10, 162 bytes |
| Decodificação independente | Texto recuperado igual à URL original | `jsqr@1.4.0` sobre a matriz rasterizada |
| Teste de regressão | Versão anterior falha nos casos médio e longo | 2/3 falhas contra o gerador sem `setupPositionAdjustPattern()` |
| CI do commit C7 | `success` | Workflow run `39075301916` |
| Sintaxe JavaScript | Aprovada | `node --check` na CI |
| Compilação Python | Aprovada | `python -m py_compile` na CI |
| Testes pytest | 2 aprovados | `tests/test_plugin.py` |

Nenhum teste foi reexecutado durante esta etapa documental; os resultados acima são os registrados no projeto e na CI.

## 6. Estado final do projeto

| Item | Estado |
|---|---|
| Versão estável | Tag anotada `treg-pwa-v1.0.0-estavel` |
| Commit estável | `6218f0fd25a2047b5caba09cf854af74058db03d` |
| Release | Publicada, ID `416672282` |
| `main` do projeto | Inalterada em `07cacfeb7a5af3650a1bdf3335af2be3262806aa` |
| Branch C7 | Inalterada em `6218f0fd25a2047b5caba09cf854af74058db03d` |
| Código do plugin | Não alterado nesta etapa |
| Plugin original `hermes-pwa` | Não alterado |
| VPS | Nenhuma operação nesta etapa |

A versão estável está registrada pela tag e pela Release, sem merge na `main`. Melhorias futuras devem ocorrer em branches separadas.

## 7. Limitações

- A tag é anotada, mas não assinada criptograficamente; o GitHub a marca como `unsigned`.
- A correspondência entre o plugin instalado e o commit C7 é uma confirmação relatada pelo usuário/Hermes; não houve verificação direta de hash no VPS nesta etapa.
- As validações de QR físico, navegador do celular, aplicativo instalado e envio de foto são evidências manuais, não testes automatizados.
- A Release não representa garantia de ausência de defeitos nem substitui testes futuros.
- Nenhum teste foi reexecutado nesta fase documental.

## 8. Conclusão

As Fases 1 e 2 estão documentadas como concluídas para a versão C7:

1. a tag anotada e a Release foram publicadas e vinculadas ao commit exato `6218f0fd25a2047b5caba09cf854af74058db03d`;
2. o plugin instalado foi confirmado como correspondente à tag estável C7;
3. a correção do QR Code está incorporada ao commit e coberta pelos testes automatizados;
4. o QR Code físico, o uso no navegador do celular e o aplicativo instalado foram validados manualmente pelo usuário;
5. a `main`, o código do plugin e o plugin original permanecem intactos.

## 9. Próximo passo

A próxima fase depende de autorização explícita do usuário. Esta etapa não inicia reinstalação, atualização, reinício ou qualquer alteração na VPS.
