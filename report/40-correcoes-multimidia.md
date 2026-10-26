# 40 — Correções multimídia: imagens persistentes e mídias de saída

**Data:** 2026-10-26<br>
**Fase:** 40 — imagens no histórico e mídias de saída do Hermes<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch:** `feat/treg-pwa-quarta-atualizacao`<br>
**Base da referência informada:** `569ac41556be84dbb088404128f916a0ff6369cb`<br>
**HEAD real encontrado e usado:** `0a897995330b68527f2763161a2357ddded9531f`<br>
**Código congelado protegido:** `16345103fcabf4347ac4225605036dcc1e1be3e6`<br>
**Tag congelada:** `treg-pwa-v1.8.0b1-estavel`<br>
**Commit de implementação:** `bb125e8937952acbb7cf88d048589d98083beeaa`

## 1. Base e estado do Git

A branch `feat/treg-pwa-quarta-atualizacao` tinha avançado em relação ao SHA informado como referência. Foram encontrados, no remoto, dois commits documentais posteriores a `569ac41`:

- `cb61c9c702066f58d87e1571d3df8ef5593e52a6` — publica `report/39-auditoria-multimidia.md`;
- `0a897995330b68527f2763161a2357ddded9531f` — indexa a auditoria no `report/README.md`.

Os dois commits foram inspecionados: alteram somente documentação, incluindo o relatório de auditoria exigido. Nenhum reset foi executado; a worktree foi atualizada por fast-forward para `0a8979`.

O código do plugin continuou baseado no commit congelado `1634510`, e a tag/release não foram alteradas.

## 2. Diagnóstico

### 2.1 Imagens enviadas

O fluxo anterior enviava a imagem como `image_url`; o agente a analisava, mas a persistência do núcleo convertia a parte multimodal em `[screenshot]`. Os bytes e a referência não sobreviviam ao histórico. O aplicativo também não fazia upload das imagens pelo endpoint de upload do plugin, embora esse endpoint já existisse para áudio e arquivos.

### 2.2 Mídias de saída do assistente

Tags `MEDIA:<path>` persistiam nas mensagens do assistente, mas o app não as interpretava. Imagens inline em data URL também não eram renderizadas pelo `md()` atual. Áudio, vídeo e documentos dependiam de rotas do dashboard que o frontend não utilizava.

## 3. Correção A — imagens visíveis e persistentes

### 3.1 Envio

- A imagem continua sendo enviada em `image_url` para o agente analisar.
- Antes de criar a execução, a imagem processada é enviada por `POST /api/plugins/treg-pwa/api/upload`, reutilizando a rota existente.
- O upload usa o nome com extensão coerente com o data URL real (JPEG/PNG/WebP/GIF), evitando MIME incorreto no arquivo salvo.
- A mensagem persistida recebe a referência textual:

```text
🖼️ Imagem: /opt/data/home/uploads/<arquivo> (<nome>, <tamanho>)
```

- A referência é compatível com os outros anexos textuais já usados pelo plugin.
- O histórico continua recebendo o `image_url` para análise e a referência para exibição.

### 3.2 Falha de upload

Se o upload da imagem falhar:

- a mensagem ainda é enviada ao agente, mantendo `image_url` para a análise;
- nenhuma referência fictícia é gravada no histórico;
- o usuário recebe um aviso de que a imagem foi analisada, mas a referência pode não aparecer após recarregar;
- a bolha otimista não finge que a imagem persistiu.

### 3.3 Renderização no histórico

- `parseUserText()` reconhece a referência `🖼️ Imagem`.
- A imagem é exibida pelo caminho autenticado `GET /api/plugins/treg-pwa/api/uploads/{name}`.
- A imagem continua visível após reload e reabertura da conversa.
- O lightbox existente foi reutilizado para ampliação.
- Imagem indisponível ou com erro de carregamento exibe “Imagem indisponível” dentro da mensagem, sem quebrar a conversa.
- Mensagens textuais e áudio continuam usando o parser existente.

Imagens antigas que já foram persistidas como `[screenshot]` não são recuperáveis e não foram tratadas como se tivessem bytes disponíveis.

## 4. Correção B — mídias de saída do Hermes

Foi criado `parseMedia()` em `ui-utils.js`, executado para mensagens do assistente.

Ele:

1. reconhece referências `MEDIA:<path>`;
2. remove as tags da apresentação;
3. preserva o texto útil;
4. mantém a ordem de texto e anexos por meio de partes ordenadas;
5. valida caminho absoluto, rejeita traversal, query/fragment e caracteres de controle;
6. aplica allowlist de extensões por tipo;
7. resolve URLs pelas rotas existentes, sem criar endpoints.

### 4.1 Tipos e rotas

| Tipo | Comportamento | Rota |
|---|---|---|
| Imagem | Imagem carregada, ampliação e erro | `GET /api/media?path=...`; fallback autenticado `GET /api/files/read?path=...` |
| Áudio | Player com controles, erro e fallback | `GET /api/files/stream?path=...`; fallback `GET /api/files/download?path=...` |
| Vídeo | Player com controles, erro e fallback | `GET /api/files/stream?path=...`; fallback `GET /api/files/download?path=...` |
| Documento/arquivo | Cartão com nome e download/abertura | `GET /api/files/download?path=...` |

Imagens inline em Markdown com data URL `data:image/...;base64,...` também são renderizadas com validação de MIME e lightbox, pois o API server pode converter imagens de saída nesse formato.

### 4.2 Apresentação

- Imagens: cartão com imagem e identificação.
- Áudio/vídeo: elemento nativo com controles e estados de erro.
- Documentos: cartão com nome e link de download.
- Caminhos locais completos não são mostrados na interface; somente o nome do arquivo.
- Nenhum HTML arbitrário é interpretado.
- Tags `MEDIA:` não aparecem como texto técnico bruto.

### 4.3 Segurança

- Caminhos só são aceitos quando absolutos e sem segmentos `..`;
- extensões fora da allowlist são descartadas;
- as rotas continuam usando a autenticação e as restrições de raiz existentes;
- parâmetros de caminho são codificados com `encodeURIComponent`;
- imagens inline só são aceitas como `data:image` base64 raster permitido;
- SVG não é renderizado inline como imagem; é tratado como documento para download;
- nenhuma rota foi criada ou enfraquecida;
- nenhum arquivo local é lido diretamente pelo cliente.

## 5. Service worker

O cache do service worker foi atualizado de `treg-pwa-v5` para `treg-pwa-v6` para identificar a nova casca do app e permitir que a ativação remova somente caches antigos do namespace TREG. A limpeza seletiva da Fase 4G foi preservada.

## 6. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/app.js` | Upload de imagens, referência persistente, renderização de imagens/MEDIA, fallback, lightbox, estados de erro e imagens data URL |
| `dashboard/pwa/app.css` | Cartões de imagem, áudio, vídeo, documentos e estados de mídia |
| `dashboard/pwa/ui-utils.js` | `parseMedia`, `mediaKind`, `mediaUrl`, `cleanMediaPath` e allowlist de extensões |
| `dashboard/pwa/hermes-api.js` | `getMediaDataUrl` e `getFileDataUrl` para as rotas existentes de mídia/arquivo |
| `dashboard/pwa/sw.js` | Cache `treg-pwa-v6` |
| `tests/ui-utils.test.js` | Testes de parser, tipos, URLs, ordem, traversal e allowlist |
| `tests/hermes-api.test.js` | Testes das URLs de mídia e arquivo |
| `tests/ui-contract.test.js` | Contratos da imagem enviada, parser, mídia de saída e SW v6 |
| `tests/sw-cache-isolation.test.js` | Cache atual v6; v5 agora é cache antigo removível |
| `report/README.md` | Índice deste relatório |

Não foram alterados `plugin.yaml`, `dashboard/plugin_api.py`, `dashboard/dist/`, os relatórios 38/39, a tag ou a Release.

## 7. Testes automatizados

| Teste | Resultado real |
|---|---|
| `npm.cmd run test:sw` | **PASS** — cache atual v6; antigos TREG removidos; caches externos preservados |
| `npm.cmd run test:ui` | **PASS** |
| `npm.cmd run test:api` | **PASS** |
| `npm.cmd run test:uiutils` | **PASS** — parser multimídia incluído |
| `npm.cmd run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` | **7 passed** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `node --check` nos JS alterados e testes | **OK** |
| `git diff --check` | **OK** |

A dependência de teste `jsqr` já existente foi copiada localmente para `tests/node_modules` (ignorada pelo Git); nenhuma dependência de runtime foi adicionada.

## 8. Validação em navegador

Foi usado Chromium via Playwright contra servidor local com **API simulada**. Não foi uma execução contra o Hermes real.

### 8.1 Saída multimídia

- Mensagem do assistente com seis referências `MEDIA:`:
  - imagem carregada e visível;
  - player de áudio presente;
  - player de vídeo presente;
  - links de PDF e CSV presentes e acessíveis;
  - imagem ausente exibiu “Imagem indisponível”;
  - nenhuma tag `MEDIA:` permaneceu no texto.
- Imagem inline em data URL também foi renderizada e ampliada pelo lightbox.
- A rota `/api/files/download` retornou PDF e CSV com status 200 no stub.
- Cards e players permaneceram dentro da viewport em 320 e 390 px, sem overflow horizontal.
- A conversa de texto sem mídia continuou funcionando.

### 8.2 Imagem enviada

- Imagem anexada foi enviada ao agente como `image_url`.
- O upload registrou `kind: "image"` e o data URL.
- A execução recebeu a imagem e a referência `🖼️ Imagem` no texto.
- Após reload, a imagem continuou visível no histórico pelo endpoint de uploads.
- Texto + imagem funcionaram juntos.
- Lightbox abriu e fechou corretamente.
- Falha simulada de upload:
  - aviso foi exibido;
  - a execução ainda recebeu `image_url` para análise;
  - nenhuma referência de imagem foi enviada no corpo;
  - após recarregar, a imagem não foi apresentada como persistida.

### 8.3 Estados esperados de erro no stub

O stub devolveu fixtures de áudio/vídeo inválidas e uma imagem ausente; por isso os players mostraram “Áudio indisponível”/“Vídeo indisponível” e a imagem ausente mostrou erro. Esses estados comprovam a interface de erro, não a reprodução real dos formatos.

O console registrou apenas erros HTTP esperados do stub (manifesto, imagem ausente e upload forçado a falhar); não houve exceção JavaScript não tratada.

## 9. Limitações e pendências reais

- Não houve execução no Hermes real, celular físico, Telegram, WhatsApp ou VPS.
- A imagem enviada foi validada com API simulada; o upload real no Hermes e o reload real ainda precisam ser confirmados.
- `/api/files/stream` foi usada conforme a auditoria, mas essa rota não foi localizada no código local inspecionado; o app implementa fallback para `/api/files/download`. Reprodução e seek por Range em Hermes real permanecem pendentes de validação.
- Os players de áudio/vídeo no stub usaram fixtures inválidas; apenas a presença dos controles e os estados de erro foram validados.
- PDF/CSV foram servidos pelo stub; o download real pelo navegador no Hermes não foi testado.
- O cartão de documento não faz pré-verificação de existência antes do clique; um arquivo ausente pode retornar erro da rota em nova aba. Áudio/vídeo/imagem têm estados de erro no próprio cartão.
- Imagens antigas persistidas como `[screenshot]` continuam irrecuperáveis.
- Não houve inspeção manual do CacheStorage no DevTools.
- A tag `treg-pwa-v1.8.0b1-estavel` e sua Release continuam apontando para o código congelado `1634510`; o código desta branch usa o SW `v6` e não foi publicado como nova Release.
- A branch foi atualizada para `0a8979` por fast-forward porque o remoto já continha dois commits documentais da auditoria; nenhum trabalho foi descartado.

## 10. Preservação

Não foram alterados:

- o código congelado `16345103fcabf4347ac4225605036dcc1e1be3e6`;
- a tag `treg-pwa-v1.8.0b1-estavel` (`cd63a2f36ead5f6d458ee06cae76f4afd5bbf3ce` → commit `1634510`);
- a Release oficial da versão estável;
- a versão `1.8.0b1` no `plugin.yaml`;
- a `main`;
- o plugin original `hermes-pwa`;
- o core do Hermes;
- os relatórios 38 e 39 e a documentação de auditoria;
- instalações, VPS, serviços, `.env`, credenciais ou dados persistentes.

Não houve merge na `main`, PR, tag, Release, deploy ou instalação. Os dois commits documentais remotos foram preservados; a branch avançou com um commit de implementação e este relatório.

## 11. Git e publicação

- **SHA-base real da branch:** `0a897995330b68527f2763161a2357ddded9531f`.
- **Commit de implementação:** `bb125e8937952acbb7cf88d048589d98083beeaa`
  - Mensagem: `feat(treg-pwa): exibir imagens e midias de saida`
  - 9 arquivos, 384 inserções e 26 remoções.
- **Commit deste relatório:** o HEAD final da branch, criado após a implementação; o SHA final é informado no resumo de encerramento e conferido no remoto.
- **Branch:** `feat/treg-pwa-quarta-atualizacao`.
- **Publicação:** esta branch será enviada ao GitHub. Não haverá merge, PR, tag, Release, deploy ou instalação.

## 12. Encerramento

- **Fase 40 concluída:** implementação e testes locais concluídos.
- **Imagens:** upload pelo plugin, referência persistida, exibição após reload, lightbox, falha e indisponibilidade tratadas.
- **Mídias de saída:** parser `MEDIA:`, imagens, áudio, vídeo e documentos com rotas existentes, ordem preservada, sem tags cruas, com estados de erro.
- **Service worker:** `treg-pwa-v6`.
- **Código congelado/tag/Release:** intactos.
- **Pendências:** validação real no Hermes, reprodução/seek de áudio/vídeo, download real, microfone real, PWA instalado e dispositivo físico.
- **Próximo passo:** revisão do usuário; depois, preparar a instalação/atualização controlada no Hermes. Não instalar nesta fase.
- **Caminho completo:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-fourth-update-dev\report\40-correcoes-multimidia.md`.
