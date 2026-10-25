# 36 — Preparação da versão para validação real

**Data:** 2026-10-25<br>
**Fase:** 4F — preparação para validação no Hermes real<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch-base:** `feat/treg-pwa-correcoes-audio-busca-chat`<br>
**SHA-base:** `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`<br>
**Branch de preparação:** `feat/treg-pwa-preparacao-validacao-real`<br>
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-validation-dev`

## 1. Confirmação da base

Antes de criar a branch de preparação, foi confirmado:

- o repositório é `Nifm1584/plugin-v1-pwa`;
- a branch `feat/treg-pwa-identidade-whatsapp` está no remoto em `78a8eb2cbcfefd26c82a7d48dce0c4475e021ef5` (Fase 4D);
- a Fase 4E tem o commit de implementação `d406e4320469a5c585e9bf114e010aaf88a3e3ad` e o SHA final `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`;
- o remoto `feat/treg-pwa-correcoes-audio-busca-chat` aponta para `a33593a`;
- o relatório 35 foi lido em `report/35-correcoes-audio-busca-navegacao.md`;
- a worktree da Fase 4E estava limpa, no SHA final, sem commits posteriores;
- a árvore `a33593a` corresponde ao código final das Fases 4D e 4E;
- não havia alteração pendente, commit não reconhecido ou divergência de base.

Não houve reset, descarte ou sobrescrita de trabalho.

## 2. Branch e escopo da preparação

A branch `feat/treg-pwa-preparacao-validacao-real` foi criada diretamente de `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`, em worktree isolada.

O objetivo desta fase é **preparar e identificar** o código existente para instalação em um Hermes de teste. Não é uma nova versão funcional:

- nenhuma funcionalidade foi criada;
- nenhum comportamento foi alterado;
- nenhum arquivo de código foi modificado;
- nenhuma versão foi incrementada;
- nenhum teste real de Hermes foi declarado como concluído;
- não houve instalação, deploy, merge, PR, tag ou release.

A única alteração desta fase é este relatório 36. O código de plugin é idêntico ao de `a33593a`; os commits 4D e 4E foram preservados integralmente.

## 3. Estado do código preparado

### 3.1 Commits que compõem a versão

| Referência | Conteúdo | SHA |
|---|---|---|
| Fase 4D — identidade visual | Temas Auto/Light/Black, avatar e relatório 34 | `78a8eb2cbcfefd26c82a7d48dce0c4475e021ef5` |
| Fase 4D — implementação | Temas e testes da 4D | `0d5e12d4d108d97cc41c36985ad6f26732877ff7` |
| Fase 4E — implementação | Áudio, busca, navegação e testes da 4E | `d406e4320469a5c585e9bf114e010aaf88a3e3ad` |
| Fase 4E — relatório | Relatório 35 | `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec` |
| Fase 4F — preparação | Este relatório, sem alteração de código | commit deste relatório |

O SHA-base da Fase 4F é o SHA final da 4E: `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`.

### 3.2 Verificação dos arquivos necessários

A árvore tem **76 arquivos rastreados antes deste relatório** (77 com ele) e o código do app está completo:

- `plugin.yaml` — `name: treg-pwa`, `version: 1.8.0b1`, `kind: standalone`, licença MIT;
- `__init__.py` — comando `/treg`;
- `dashboard/manifest.json` — aba `/treg`, `entry`, `css` e `api` apontando para arquivos existentes;
- `dashboard/plugin_api.py` — proxy e rotas estáticas;
- `dashboard/dist/index.js`, `dashboard/dist/style.css` e `dashboard/dist/qrcode.js`;
- `dashboard/pwa/` com `index.html`, `app.js`, `app.css`, `ui-utils.js`, `hermes-api.js`, `sw.js` e ícones;
- `dashboard/pwa/manifest.webmanifest` é gerado pela rota `GET /manifest.webmanifest` do backend, não é um arquivo estático;
- o service worker está em `treg-pwa-v4`;
- `tests/` com os testes Node e Python;
- `LICENSE` e `README.md`.

Foi executada uma verificação estática dos manifestos, referências de `entry/css/api`, arquivos estáticos do backend, referências locais do `index.html`, rota do manifesto PWA, comando `/treg` e versão do service worker. **Nenhum arquivo obrigatório ficou ausente.**

Não foi necessário gerar `dashboard/dist/` nem qualquer artefato de build para esta preparação. O app PWA é JavaScript puro e os arquivos já estão versionados.

### 3.3 Identificação inequívoca

A versão do plugin permanece **`1.8.0b1`**, por decisão desta fase: não se deve aumentar a versão apenas para identificar a preparação. Portanto, **`1.8.0b1` sozinha não identifica esta versão**.

Para identificar exatamente esta preparação, usar em conjunto:

- branch `feat/treg-pwa-preparacao-validacao-real`;
- SHA final da branch (informado no encerramento e verificável no remoto);
- código-base `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`;
- service worker `treg-pwa-v4`;
- presença de `report/35-correcoes-audio-busca-navegacao.md` e `report/36-preparacao-validacao-real.md`;
- `git rev-parse HEAD` no checkout deve corresponder ao SHA final.

O commit final de código (antes deste relatório) é `a33593a`; o commit final da branch inclui este relatório e mantém a mesma árvore de plugin.

## 4. Instalação no Hermes de teste — referência e procedimento

### 4.1 Atenção ao comando padrão

O comando documentado no README do projeto é:

```bash
hermes plugins install Nifm1584/plugin-v1-pwa --enable
```

**Ele não deve ser usado sozinho para instalar esta versão de validação.** O CLI do Hermes inspecionado nesta máquina não oferece `--ref`/`--branch` no subcomando `plugins install`; o instalador faz `git clone --depth 1` do repositório e usa o **branch padrão**, que é `main`. Isso instalaria a `main`, não a branch das Fases 4D/4E.

Também não se deve substituir o plugin original `hermes-pwa` nem a versão atualmente instalada. A validação deve ser feita em ambiente de teste, preservando o que já existe.

### 4.2 Fonte exata

O código preparado é o da branch:

```text
feat/treg-pwa-preparacao-validacao-real
```

no SHA final informado no encerramento. O código de plugin (sem o relatório 36) é:

```text
a33593a488a0ffa75dcfd6fadbeac68a23d9ebec
```

Snapshot do GitHub (quando o SHA final estiver publicado):

```text
https://github.com/Nifm1584/plugin-v1-pwa/archive/<SHA-FINAL>.zip
```

### 4.3 Procedimento de checkout/instalação para o ambiente de teste

O procedimento abaixo é uma **referência para a etapa de instalação**, não executada nesta fase. O diretório de plugins do usuário é resolvido por `HERMES_HOME/plugins`; no Windows o padrão é `%LOCALAPPDATA%\hermes\plugins`, no Linux/macOS é `~/.hermes/plugins`.

Antes de qualquer ação:

1. confirmar que não há um `treg-pwa` instalado que seria sobrescrito; se houver, parar e avaliar com o usuário;
2. manter o `hermes-pwa` original instalado e funcional para a validação lado a lado;
3. usar somente o ambiente de teste.

Checkout exato:

```bash
git clone --branch feat/treg-pwa-preparacao-validacao-real \
  --single-branch https://github.com/Nifm1584/plugin-v1-pwa.git
cd plugin-v1-pwa
git rev-parse HEAD
```

O `git rev-parse HEAD` deve imprimir o SHA final publicado. Para uma verificação de código independente do relatório, também pode ser conferido:

```bash
git merge-base --is-ancestor a33593a488a0ffa75dcfd6fadbeac68a23d9ebec HEAD
```

Instalação no diretório do usuário (somente se o caminho estiver livre):

```bash
git clone --branch feat/treg-pwa-preparacao-validacao-real \
  --single-branch https://github.com/Nifm1584/plugin-v1-pwa.git \
  "$HERMES_HOME/plugins/treg-pwa"
hermes plugins enable treg-pwa
hermes gateway restart
```

No Windows/PowerShell, o destino pode ser `$env:LOCALAPPDATA\hermes\plugins\treg-pwa` quando `HERMES_HOME` não estiver definido.

Depois, reiniciar também o dashboard (ou o contêiner) conforme o procedimento já utilizado no projeto. Abrir no celular:

```text
https://SEU-DOMINIO/treg
```

Essa é a referência de identificação da versão; a instalação e o teste no Hermes real ainda estão pendentes. O procedimento precisa ser ajustado ao fluxo local do ambiente de teste, caso ele já disponha de um mecanismo próprio para instalar uma branch/commit.

## 5. Testes executados

Todos os testes abaixo foram executados na branch de preparação, sobre a árvore idêntica a `a33593a`.

### 5.1 Testes aprovados

| Teste | Resultado real |
|---|---|
| `npm.cmd run test:ui` | **PASS** |
| `npm.cmd run test:api` | **PASS** |
| `npm.cmd run test:uiutils` | **PASS** |
| `npm.cmd run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` (venv do projeto) | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `node --check` — app, ui-utils, API, dist, SW e testes | **OK** |
| `git diff --check` | **OK** |
| Verificação estática de manifestos e arquivos de instalação | **0 erros** |

Os testes Node foram executados com `npm.cmd` porque `npm.ps1` está bloqueado pela política do PowerShell. A dependência de teste `jsqr` foi copiada do ambiente da Fase 4E para `tests/node_modules` (ignorada pelo Git); nenhuma dependência de runtime foi adicionada. Pytest foi executado pela venv `treg-test-venv` porque o Python global não possui pytest.

### 5.2 Testes reprovados

**Nenhum teste falhou na execução final desta preparação.**

A verificação estática inicial apontou `dashboard/pwa/manifest.webmanifest` como arquivo ausente, mas isso era um falso positivo da verificação: o manifesto é gerado pela rota `GET /manifest.webmanifest` do backend. A verificação foi corrigida para validar a rota e confirmou que o arquivo não é necessário no diretório estático.

### 5.3 Testes com simulação

- A validação Playwright da Fase 4E foi feita com API simulada e `MediaRecorder` falso. Ela **não foi repetida nesta fase**, porque nenhum código foi alterado; os resultados continuam documentados no relatório 35 para o mesmo código.
- Não houve nova validação real de API, áudio, transcrição, microfone ou PWA instalado.

### 5.4 Verificações não executadas

- `hermes plugins validate .`: o CLI inspecionado não expõe esse subcomando nesta instalação; não foi executado.
- Instalação no Hermes de teste e abertura de `/treg`.
- Teste real de `/api/sessions/search`, FTS e títulos.
- Teste real de microfone/`MediaRecorder`, upload, transcrição e reprodução de áudio.
- Teste de perfil/gateway multiplexado real.
- Teste de PWA instalado, cache `treg-pwa-v4` e offline.
- Teste em celular físico, teclado virtual e zoom de fonte.
- CI do GitHub: a branch nova não é acionada pelo workflow atual; 0 execuções para esta branch.

## 6. Limitações conhecidas e pendências reais

- A versão `1.8.0b1` não foi incrementada; a identificação deve ser feita por branch/SHA/SW v4/reports, não apenas pelo número da versão.
- A busca de sessões fora das 80 carregadas continua dependendo do endpoint de busca do Hermes; a limitação está registrada no relatório 35.
- O README e a descrição do `plugin.yaml` ainda refletem fases anteriores (por exemplo, “Claro/Escuro” em vez de Auto/Light/Black, e transcrição “logo abaixo” em vez de oculta por menu). Não foram alterados nesta fase para não sair do escopo de preparação; devem ser revisados após a validação real.
- A instalação exata ainda precisa ser executada pelo usuário no ambiente de teste; este relatório não declara validação real.
- O comando genérico de instalação do projeto não aceita ref; a instalação deve usar o checkout/ref exato e o fluxo local, conforme a seção 4.
- Nenhuma evidência de comportamento real foi produzida nesta fase.

## 7. Preservação

Não foram alterados:

- o core do Hermes ou o plugin original `hermes-pwa`;
- `dashboard/dist/` ou qualquer artefato de build;
- `plugin.yaml`, a versão `1.8.0b1` ou os manifestos;
- a `main`, branches anteriores, tags ou releases;
- os relatórios 01–35;
- o código de plugin das Fases 4D e 4E.

Não houve merge, PR, tag, release, deploy ou instalação. A branch de preparação contém apenas este relatório além do código já validado nas fases anteriores.

## 8. Git e publicação

- **SHA-base:** `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`.
- **Branch:** `feat/treg-pwa-preparacao-validacao-real`.
- **Commit de preparação:** o commit deste relatório, criado depois da árvore de código `a33593a`; o SHA final é informado no resumo de encerramento e pode ser conferido no remoto.
- **Conteúdo do commit:** somente `report/36-preparacao-validacao-real.md`; a árvore de plugin é a mesma de `a33593a`.
- **Publicação:** somente esta branch é enviada ao GitHub. Não há PR, merge, tag, release, deploy ou instalação.

## 9. Encerramento

- **Preparação concluída:** sim.
- **Base:** `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec` (Fase 4E).
- **Código preparado:** Fases 4D e 4E preservadas; versão `1.8.0b1` mantida; SW `treg-pwa-v4`.
- **Referência para instalação:** branch `feat/treg-pwa-preparacao-validacao-real` no SHA final publicado; código-base `a33593a`.
- **Estado:** pronto para instalação e teste no Hermes real, **não validado** até que a instalação, o uso e os resultados sejam confirmados pelo usuário.
- **Testes:** UI/API/UI utils/QR 3/3, pytest 7 passed, `py_compile`, `node --check`, `git diff --check`; verificação estática de arquivos e manifestos sem erros.
- **Limitação principal:** toda validação funcional real permanece pendente; o comando de instalação padrão precisa ser substituído pelo checkout exato da branch/SHA.
- **Caminho completo:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-validation-dev\report\36-preparacao-validacao-real.md`.
