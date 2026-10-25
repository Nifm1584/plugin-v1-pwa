# Fase 5B — Encerramento da publicação dos relatórios e capturas do TREG PWA

**Data:** 2026-10-24 (America/Sao_Paulo)
**Branch:** `docs/fase-5b-analise-visual-e-prints`
**Repositório:** <https://github.com/Nifm1584/plugin-v1-pwa>
**Status:** publicação concluída nesta branch; nenhum merge e nenhuma alteração em `main`.

## 1. Ponto de partida

- Branch remota existente antes desta execução: `c4885b27ad5d03bdb1a37d0bd11288c1b2b94d08` (`docs: add prints-aplicativo-treg-pwa README`).
- O diretório local `hermes-pwa` contém os relatórios e as capturas, mas não possui metadados `.git`. Por isso a publicação foi feita a partir de um clone da própria branch remota em diretório temporário. Nenhuma branch nova foi criada.
- Os relatórios 18 e 19 já estavam publicados na branch e foram preservados sem alteração de conteúdo.
- A pasta remota `report/prints-aplicativo-treg-pwa/` continha apenas o `README.md`; nenhum PNG estava publicado.

## 2. Arquivos encontrados no workspace local

- `report/18-auditoria-visual-funcional-treg-pwa.md`
- `report/19-analise-prints-whatsapp.md`
- `report/README.md`
- `report/prints-aplicativo-treg-pwa/README.md`
- 11 PNGs em `report/prints-aplicativo-treg-pwa/` (9 capturas mobile e 2 desktop).
- 3 capturas do WhatsApp em `report/Captura de tela do WhatsApp/`, mantidas apenas no workspace local por conterem dados pessoais.

## 3. Publicação

**Commit dos arquivos:** `0e9d9de77a3facfad574a629f90c19da0c0ba841`
**Mensagem:** `docs(fase-5b): publish 11 TREG PWA screenshots`

Arquivos adicionados ou atualizados nesse commit:

- `report/prints-aplicativo-treg-pwa/02-tela-instalacao-qr.png` (versão redigida);
- `report/prints-aplicativo-treg-pwa/Screenshot_1.png` a `Screenshot_9.png`;
- `report/prints-aplicativo-treg-pwa/captura-15012.png`;
- `report/prints-aplicativo-treg-pwa/README.md` (nota de publicação corrigida).

O índice `report/README.md` e este relatório são publicados no commit de encerramento imediatamente seguinte. O SHA completo do HEAD final da branch é o commit que contém este arquivo e pode ser conferido em:

<https://github.com/Nifm1584/plugin-v1-pwa/commits/docs/fase-5b-analise-visual-e-prints>

## 4. Capturas publicadas

Todas as 11 imagens foram abertas, decodificadas com Pillow (`verify()` + `load()`) e conferidas quanto a dimensões e integridade.

| Arquivo | Dimensões | Bytes | SHA-256 |
|---|---:|---:|---|
| `02-tela-instalacao-qr.png` | 975×768 | 153532 | `2c8bbcb1a60483a40554858af507fb4df3c8b9b6faf1aa094f98996a6b770c66` |
| `captura-15012.png` | 975×768 | 53968 | `ef0d22e8dda7dfc00da5533190d20e66887879d21e46a6db7d0dd747a28815a4` |
| `Screenshot_1.png` | 381×807 | 23910 | `f00d97c68524f0a1862c859b55c3e3c1e1275506e53b0ed3edc14b715ba2a16a` |
| `Screenshot_2.png` | 381×813 | 24662 | `9ae46e46a8b8dfb07388195f77575f739b4d7354817ec2d74396fd7921f03585` |
| `Screenshot_3.png` | 377×809 | 46403 | `169d3a927e6b2be6b095c670f86939c4957f7651e0e1fee8e5a9ece390087343` |
| `Screenshot_4.png` | 373×804 | 24600 | `d66bbd759d32d6172b75bb4e22a669c344e72fcee3b9915f1eaf7714b0351841` |
| `Screenshot_5.png` | 383×817 | 55095 | `77279e7fde6553f97241be7366b0fc001773a1d8530bd4139a9ae807d48b619f` |
| `Screenshot_6.png` | 382×812 | 43063 | `ec562491fb8448febd751640a1aa0911383bd1e784f823eb0509919f541d2935` |
| `Screenshot_7.png` | 379×814 | 25202 | `93eceb40de34ec59652409920ced227084f825574711c872a071cd2081063f20` |
| `Screenshot_8.png` | 387×816 | 83632 | `f4a0508323fa012aad9fbfb1e0b37f0cb6c00c257ef305b1776a196435d4f451` |
| `Screenshot_9.png` | 383×804 | 63093 | `f51d7772d850ef773a4139b8f8db5f58e14eef4fac26550a26d770fdcd9b0d3b` |

Dez arquivos são byte a byte idênticos aos originais do workspace local.

## 5. Privacidade e redação

A imagem `02-tela-instalacao-qr.png` original expõe o nome de usuário do painel e um trecho de chave Groq parcialmente mascarado. A versão publicada recebeu duas tarjas preenchidas:

- sobre o nome de usuário, no rodapé da barra lateral;
- sobre o trecho de chave, no cartão de transcrição de áudio.

O original **não** foi publicado e permanece apenas no workspace local, com SHA-256 `A65252393E705EA99B8A4D5E0CC6487360A88E1BD1417B45E50636FF203386DD`.

As três capturas do WhatsApp não foram publicadas.

## 6. Verificações realizadas

- Contagem real de PNGs na pasta publicada: **11**.
- Nomes conferidos contra o inventário existente; nenhum nome inventado.
- Integridade: todos os PNGs abrem e decodificam sem erro.
- Diff conferido antes do commit: somente arquivos de documentação e capturas.
- Nenhum `.env`, token, senha, arquivo temporário ou artefato de build foi incluído.
- Nenhum arquivo de código do plugin foi alterado.
- `main`, tag e Release C7 não foram tocadas.
- Nenhum Pull Request foi criado e nenhum merge foi feito.

## 7. CI

**Não executado para este commit.** O workflow `.github/workflows/treg-pwa-validation.yml` só é disparado em `push` para as branches `fix/treg-pwa-c3-publicacao-segura` e `fix/treg-pwa-c7-qrcode-fix`, ou em `pull_request` para `main`. O push desta branch documental não aciona o workflow.

## 8. Pendências

- As lacunas funcionais registradas no relatório 18 (execução real da busca, criação de conversa, envio de mensagem/anexo/áudio, tema claro, seletor de agente e instalação PWA no celular) continuam em aberto; não fazem parte do escopo de publicação da Fase 5B.
- Não há pendência de publicação de relatórios ou capturas nesta branch.

## 9. Links

- Relatório 18: <https://github.com/Nifm1584/plugin-v1-pwa/blob/docs/fase-5b-analise-visual-e-prints/report/18-auditoria-visual-funcional-treg-pwa.md>
- Relatório 19: <https://github.com/Nifm1584/plugin-v1-pwa/blob/docs/fase-5b-analise-visual-e-prints/report/19-analise-prints-whatsapp.md>
- Índice: <https://github.com/Nifm1584/plugin-v1-pwa/blob/docs/fase-5b-analise-visual-e-prints/report/README.md>
- Pasta das capturas: <https://github.com/Nifm1584/plugin-v1-pwa/tree/docs/fase-5b-analise-visual-e-prints/report/prints-aplicativo-treg-pwa>
- README das capturas: <https://github.com/Nifm1584/plugin-v1-pwa/blob/docs/fase-5b-analise-visual-e-prints/report/prints-aplicativo-treg-pwa/README.md>
- Branch: <https://github.com/Nifm1584/plugin-v1-pwa/tree/docs/fase-5b-analise-visual-e-prints>

---

*Este relatório encerra a Fase 5B e não altera código, configuração, VPS, tag ou Release.*
