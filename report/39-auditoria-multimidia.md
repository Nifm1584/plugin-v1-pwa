# Relatório 39 — Auditoria multimídia do TREG PWA

**Data:** 2026-10-26  
**Escopo:** auditoria estática do fluxo multimídia no Hermes e no plugin TREG PWA.  
**Resultado:** somente leitura; nenhuma alteração de código, configuração ou serviço foi realizada durante a auditoria.

## 1. Resumo executivo

A imagem enviada é vista pelo agente durante o turno, mas é descartada na gravação: o núcleo troca qualquer parte de imagem pelo literal `[screenshot]` antes de salvar. Por isso ela some e vira texto. Já a saída funciona em Telegram e WhatsApp por envio nativo, mas no canal `api_server` só imagem é embutida; áudio, vídeo e documentos ficam como texto com caminho. As rotas autenticadas que servem os bytes já existem no dashboard — falta o aplicativo referenciar e renderizar as mídias.

## 2. Causa confirmada: imagens

Fluxo observado: o PWA envia data URL em `image_url` (`app.js:936`); o gateway aceita; o agente analisa; na persistência, `agent/session_persistence.py`, função `_durable_content`, converte a lista multimodal em texto e troca a imagem por `[screenshot]`; `GET /api/sessions/{id}/messages` devolve `content` como string, sem campo de anexo; `bubble()` (`app.js:689`) então mostra o literal.

Os bytes não existem em lugar nenhum nesse caminho: não há upload de imagem no PWA (o `/api/upload` só é usado para áudio e arquivos). Imagens antigas são irrecuperáveis por esse fluxo.

Detalhe relevante: imagens vindas de WhatsApp/Telegram são baixadas para `/opt/data/cache/images/img_*.jpg` (10 arquivos observados, 26/10, TTL de 24 horas) e podem ser servidas por rota autenticada. Nelas falta apenas o vínculo mensagem→arquivo.

## 3. Diagnóstico da saída

O agente produz imagem (`image_generate`), áudio (`text_to_speech` com edge-tts), vídeo (ffmpeg via terminal) e documentos (skills pdf/xlsx/docx).

Em Telegram/WhatsApp, o gateway coleta `MEDIA:` apenas de ferramentas produtoras (`gateway/run.py`), separa por tipo e envia nativamente (`send_image`, `send_voice`, `send_video`, `send_document`; `base.py`). No `api_server`, só `_resolve_media_to_data_urls` roda, e apenas para imagem (markdown data URL, até 5 MB); o restante fica como texto.

No PWA, isso não é tratado: não existe ocorrência de `MEDIA:` em `app.js`, e `md()` não interpreta imagem markdown — assim, até uma imagem embutida viraria texto extenso. As tags `MEDIA:` do assistente persistem no banco (5 mensagens confirmadas), então podem ser interpretadas na recarga.

## 4. Rotas confirmadas por código

**Plugin, mesmo gate do dashboard:**
- `POST /api/plugins/treg-pwa/api/upload` — base64, limite de 25 MB.
- `GET /api/plugins/treg-pwa/api/uploads/{name}` — bytes com MIME.
- Hoje usadas para áudio e arquivos.

**Dashboard, autenticado por cookie (o PWA é mesma origem):**
- `GET /api/media?path=` — imagem em data URL; raízes `/opt/data/images`, `/screenshots`, `/cache`; até 25 MB.
- `GET /api/files/download?path=` — qualquer arquivo sob `/opt/data` (inline para áudio/vídeo, caso contrário download), com bloqueio de arquivos sensíveis.
- `GET /api/files/stream?path=` — áudio/vídeo inline com suporte a `Range` (seek).
- `GET /api/files/read?path=` — base64 de arquivo.
- `POST /api/chat/image-upload`, `/api/audio/transcribe` e `/api/audio/speak` também existem.
- A raiz de arquivos é fixada em `/opt/data` quando `HERMES_HOME=/opt/data` (`web_server_files.py`).

**Gateway:**
- `/v1/runs` aceita `text` e `image_url`.
- `/v1/artifacts/*` está desabilitado (`browser extension_control=false`).
- Não há rota de áudio no gateway.

Classificação observada: rotas existentes e usadas (upload/STT/runs/SSE); existentes e não usadas (`/api/files/*`, `/api/media)); não testadas com sessão nesta auditoria (essas rotas); apenas sugeridas pelo código (`/api/fs/*`, artifacts).

## 5. Comparação entre canais

| Tipo | Telegram/WhatsApp | TREG PWA |
|---|---|---|
| Imagem | Recebe e envia | Recebe para análise, mas não envia/exibe corretamente no histórico |
| Áudio | Recebe e envia voz | Recebe e transcreve; envia apenas texto, não reproduz áudio de saída |
| Vídeo | Recebe e envia | Não aceita entrada, não envia nem exibe |
| Documento/arquivo | Recebe e envia | Permite envio do usuário, mas não recebe do agente |
| Artefato de ferramenta | Entrega nativa nos canais | Só texto |

Não confirmado: envio nativo real de WhatsApp nesta auditoria, baseado na inspeção do adaptador, e qualquer teste em navegador.

## 6. Arquivos-chave

**Núcleo:**
- `agent/session_persistence.py` — `_durable_content`.
- `gateway/platforms/api_server.py` — `_resolve_media_to_data_urls`, `_message_response`.
- `gateway/run.py` — `_collect_auto_append_media_tags`.
- `gateway/platforms/base.py` — `MEDIA_DELIVERY_EXTS`, `send_*`.
- `hermes_cli/web_routers/files.py` — `/api/media`, `/api/files/*`.
- `web_server_files.py` — raiz de arquivos.
- `audio.py`, `toolsets.py` — `api_server` sem `text_to_speech`.
- `agent/provider_media.py` — TTL de 24 horas.

**Plugin:**
- `dashboard/plugin_api.py`: upload (aprox. linha 302), uploads (330), runs (354), chat/stream (412), STT (600).
- `dashboard/pwa/app.js`: `md` (64), `parseUserText` (542), `contentImages` (572), `bubble` (689), envio (aprox. 900), `shrinkImage` (1128), `uploadAttachment` (1184).

## 7. Solução recomendada: somente no plugin

**Imagens:** durante o envio, fazer upload da imagem pela rota existente e gravar a referência no texto (padrão semelhante ao áudio, por exemplo, `🖼️ Imagem: <path>`); no render, reconhecer a referência e exibir a imagem via `/api/plugins/treg-pwa/api/uploads/<name>`. Não requer migração e se aplica a mensagens novas.

**Mídia do agente:** implementar `parseMedia()` para reconhecer `MEDIA:<caminho>` (as tags persistem), removendo a tag do texto apresentado. Resolver a URL por tipo sem criar endpoint novo:
- `/api/files/stream` para áudio/vídeo (com suporte a `Range`);
- `/api/files/download` para os demais arquivos;
- `/api/media` para imagens em cache.

Renderizar controles de áudio, vídeo e imagem, além de cartões/links de download. Tratar arquivos indisponíveis e erros HTTP 404/403/409.

## 8. Limitações e itens não testados

Nada foi validado com sessão autenticada: não havia credenciais disponíveis para a auditoria. As conclusões são de inspeção de código e banco. Não foram testados navegador, celular nem envio real por WhatsApp/Telegram.

A projeção `[screenshot]` pode mudar em versões futuras; por isso a correção deve depender das referências gravadas pelo próprio plugin e das tags `MEDIA:` do assistente.

## 9. Requisitos para implementação no OpenCode

1. Em `app.js`, fazer upload da imagem no envio e gravar a referência textual, mantendo `image_url`.
2. Renderizar a referência como imagem via `/api/plugins/treg-pwa/api/uploads/<name>`, com tratamento de erro e lightbox.
3. Não quebrar o envio se o upload falhar; informar o usuário.
4. Implementar `parseMedia()` para `MEDIA:`, com allowlist de extensões, removendo a tag do texto exibido.
5. Resolver URL por tipo: stream para áudio/vídeo; download para outros arquivos.
6. Implementar elementos de áudio/vídeo/imagem/download e lightbox.
7. Exibir estados de erro para 404/403/409/413.
8. Não criar endpoints novos em `plugin_api.py` nesta fase; as rotas do dashboard bastam se o contrato for confirmado.
9. Critérios de aceitação: imagem enviada sobrevive ao reload; áudio do agente toca com seek; PDF/CSV baixa; arquivo ausente mostra cartão; nenhum caminho absoluto arbitrário é aceito do cliente.

## Estado da auditoria

Nenhuma alteração foi realizada além da criação deste relatório. A implementação permanece pendente. Esta auditoria não substitui os testes reais de navegador, celular ou canais externos.
