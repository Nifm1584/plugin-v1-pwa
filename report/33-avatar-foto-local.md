# 33 — Avatar com foto pessoal local

**Data:** 2026-10-24<br>
**Fase:** 4C — avatar fotográfico local<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch-base:** `feat/treg-pwa-cabecalho-menu`<br>
**Commit-base:** `642adc9a372f38da09247eb5ad660a219a7f93f2`<br>
**Branch de implementação:** `feat/treg-pwa-avatar-foto-local`<br>
**Área de trabalho:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-avatar-dev`

## 1. Objetivo e escopo

Implementar somente a escolha, o armazenamento local e a exibição da foto pessoal do usuário no TREG PWA:

- selecionar uma imagem da galeria/arquivo;
- visualizar, substituir e remover;
- manter a foto após recarregar/reabrir;
- usar IndexedDB, sem base64 no `localStorage`;
- exibir a mesma foto no avatar do cabeçalho e no preview das configurações;
- preservar os demais avatares (sessões, conversas, assistente/agentes);
- não enviar a imagem ao servidor, ao Hermes ou ao agente;
- não criar endpoints, não alterar `dashboard/plugin_api.py`, não atualizar a versão.

## 2. Base e estado inicial

- O commit-base `642adc9a372f38da09247eb5ad660a219a7f93f2` foi confirmado no remoto e corresponde ao HEAD da branch `feat/treg-pwa-cabecalho-menu`.
- O relatório 32 foi lido na branch anterior; a branch da Fase 4B não foi alterada.
- A branch `feat/treg-pwa-avatar-foto-local` foi criada a partir do commit-base, em worktree isolada.
- A worktree inicial estava limpa, no commit-base.
- A branch da Fase 3 (`feat/treg-pwa-botao-flutuante`, `064c107`) e a branch da Fase 4B (`feat/treg-pwa-cabecalho-menu`, `642adc9`) permaneceram intactas.

## 3. Inventário dos avatares encontrados

| Local | Significado | Ação nesta fase |
|---|---|---|
| `.brand-avatar` no cabeçalho da lista | Avatar provisório do usuário (glyph `☤`) | **Substituído por foto quando existir**; glyph permanece como padrão |
| `#profile-avatar-preview` em Configurações | Novo preview do avatar do usuário | **Novo**, mostra a mesma foto/glyph |
| `#chat-avatar` no cabeçalho da conversa | Avatar da sessão/contato, com iniciais | **Preservado**; não é avatar do usuário |
| `.avatar` nas linhas de `#sessions` | Avatar da conversa/origem, com iniciais | **Preservado** |
| Mensagens do usuário/assistente | Não há avatar por mensagem; são bolhas | **Nenhuma alteração** |
| Painel `dashboard/dist/index.js` e login | Não há avatar do usuário | **Nenhuma alteração** |

A foto é aplicada somente aos dois primeiros locais, que representam o usuário. Não foi feita substituição indiscriminada de iniciais de conversas, sessões ou agentes.

## 4. Arquivos alterados e justificativa

| Arquivo | Alteração |
|---|---|
| `dashboard/pwa/index.html` | Cabeçalho ganhou `header-avatar-glyph` e `header-avatar-img`; Configurações ganhou a seção “Perfil” com preview, botão Escolher foto, botão Remover foto, input de arquivo e status acessível |
| `dashboard/pwa/app.css` | Foto com `object-fit: cover` no círculo do cabeçalho e no preview; estilos da seção de perfil; rolagem do sheet de configurações em telas curtas |
| `dashboard/pwa/app.js` | Carregamento da foto no boot; renderização sincronizada do cabeçalho e preview; seleção, processamento, salvamento, substituição e remoção; mensagens de erro |
| `dashboard/pwa/ui-utils.js` | Validação de tipo/tamanho, cálculo de dimensões, redimensionamento/compressão, acesso ao IndexedDB (`treg-pwa-avatar`) |
| `tests/ui-contract.test.js` | Contratos dos novos elementos, textos, handlers, IndexedDB e CSS |
| `tests/ui-utils.test.js` | Testes de validação de arquivo e escala da imagem |

Não foram alterados `plugin_api.py`, `plugin.yaml`, `dashboard/dist/`, `README.md`, versão, endpoints, contratos de API ou fluxo de mensagens.

## 5. Seleção, armazenamento, substituição e remoção

### 5.1 Seleção

- A entrada fica em **Configurações → Perfil**, sem criar uma tela extensa.
- “Escolher foto” aciona o input `#avatar-file` (`accept="image/jpeg,image/png,image/webp"`).
- O arquivo é validado antes de ser processado:
  - JPEG, PNG ou WebP;
  - no máximo **10 MB**;
  - arquivo não vazio;
  - SVG, GIF, HEIC e outros formatos são rejeitados com mensagem clara.
- A imagem é decodificada com `createImageBitmap` (com fallback para `Image`) e desenhada em canvas.
- O maior lado é limitado a **512 px**, sem ampliar imagens menores.
- A saída é WebP com fallback para JPEG, com qualidade 0.86.
- O arquivo original não é guardado; somente a versão redimensionada/compactada.

### 5.2 Armazenamento

- Banco: IndexedDB `treg-pwa-avatar`, versão 1.
- Object store: `media`, chave `profile`.
- Registro: `{ key: "profile", blob, updatedAt }`.
- Nenhuma imagem é gravada em `localStorage` e nenhum base64 é usado como armazenamento principal.
- A foto é local ao navegador/aparelho; não há sincronização remota.
- `getAvatarBlob`, `saveAvatarBlob` e `deleteAvatarBlob` tratam erros de abertura, leitura, gravação e remoção.
- O estado de erro aparece em `#avatar-status` com `role="status"` e `aria-live="polite"`.

### 5.3 Exibição consistente

- `renderAvatar(blob)` atualiza **o mesmo** objeto URL em:
  - `#header-avatar-img`;
  - `#profile-avatar-img`.
- Quando há foto:
  - as imagens aparecem com `object-fit: cover`;
  - os glyphs `☤` ficam ocultos;
  - “Remover foto” aparece.
- Quando não há foto:
  - as imagens são ocultadas e os glyphs `☤` voltam;
  - “Remover foto” fica oculto.
- O cabeçalho continua com 34 px e o preview com 56 px; a foto é recortada no círculo sem distorção.
- Não há lógica duplicada de armazenamento: cabeçalho e preview usam o mesmo blob/objeto URL.

### 5.4 Substituição e remoção

- Substituir: a nova imagem é processada e salva **antes** de substituir a antiga; se falhar, a foto anterior permanece.
- Remover: o registro é apagado do IndexedDB, o objeto URL é revogado e os glyphs padrão voltam.
- A remoção também é refletida após recarregar a página.
- Erros de tipo, tamanho, imagem corrompida e processamento são exibidos sem quebrar a interface.

## 6. Diferenciação dos avatares

- **Usuário:** `.brand-avatar` e `#profile-avatar-preview` podem mostrar a foto local.
- **Sessão/conversa:** `.sessions li .avatar` e `#chat-avatar` continuam com iniciais determinísticas; não recebem a foto.
- **Assistente/agentes:** não existe avatar próprio do assistente no cabeçalho atual; os avatares de sessão/agente permanecem inalterados.
- A foto não é usada em mensagens, anexos, histórico, agente, API ou servidor.

## 7. Tipos e limites aplicados

| Item | Valor |
|---|---|
| Tipos aceitos | `image/jpeg`, `image/png`, `image/webp` |
| SVG | Rejeitado explicitamente |
| Tamanho máximo de entrada | 10 MB |
| Dimensão máxima armazenada | 512 px no maior lado |
| Formatos de saída | WebP; fallback JPEG |
| Armazenamento | IndexedDB (`treg-pwa-avatar` / `media` / `profile`) |
| Upload/rede | Nenhum |

## 8. Testes automatizados

| Teste | Resultado real |
|---|---|
| `npm run test:ui` | **PASS** — contratos do cabeçalho, menu, avatar, preview, input e handlers |
| `npm run test:api` | **PASS** |
| `npm run test:uiutils` | **PASS** — inclui validação de tipos/tamanho e escala da foto |
| `npm run test:qrcode` | **3/3 PASS** |
| `pytest tests -q` | **7 passed** |
| `node --check` nos JS alterados | **OK** |
| `python -m py_compile __init__.py dashboard/plugin_api.py` | **OK** |
| `git diff --check` | **OK** |

Os testes Node foram executados com `npm.cmd` porque `npm.ps1` está bloqueado pela política do PowerShell. As dependências Node foram instaladas em `tests/node_modules` (ignorado) apenas para o teste de QR.

## 9. Validação visual e funcional em navegador

Foi usado Chromium via Playwright contra servidor HTTP local com **API simulada**. Não foi uma execução contra o Hermes real.

### 9.1 Fluxos testados

- Estado inicial sem foto: glyph `☤` no cabeçalho e no preview; “Remover foto” oculto.
- SVG: rejeitado com mensagem clara; nenhuma imagem armazenada.
- Arquivo maior que 10 MB: rejeitado com mensagem clara.
- JPEG corrompido: erro de leitura apresentado; nenhuma imagem armazenada.
- JPEG válido 800×600: processado para WebP de 512×384 (912 bytes); cabeçalho e preview exibem a foto; status “Foto atualizada.”.
- Substituição por outra imagem: novo blob URL e novo conteúdo visual (pixel laranja 214,122,59), confirmando que não ficou a foto antiga.
- Recarregar a página: foto recuperada do IndexedDB e exibida imediatamente no cabeçalho e no preview.
- Remover: registro apagado do IndexedDB, imagens ocultadas, glyphs restaurados, “Remover foto” oculto, status “Foto removida.”.
- Recarregar após remover: avatar padrão `☤`, sem foto.
- Avatares de conversa: as 12 linhas continuaram com iniciais `C1`…`C12`, sem `<img>`; o cabeçalho da conversa continuou com `C1` em texto, sem foto.
- Menu geral e Configurações continuaram funcionando; o menu abre, Configurações abre, Atualizar continua disponível.
- Nenhuma chamada de rede foi feita para escolher, salvar, recuperar ou remover a foto. O log de chamadas permaneceu restrito a `me`, `capabilities`, `profiles` e `sessions`.
- 66 IDs no DOM, **0 duplicados**; sem `TREG` no cabeçalho; **0 erros de JavaScript**; 1 aviso pré-existente sobre a meta tag Apple.

### 9.2 Larguras e temas

As validações visuais foram feitas em **320×568**, **390×844** e **1280×800**, nos temas claro e escuro:

- o avatar fotográfico de 34 px fica no cabeçalho e o preview de 56 px nas configurações;
- a foto preenche o círculo com `object-fit: cover`;
- o sheet de configurações rola em 320 px, mantendo os controles de foto acessíveis;
- o menu e o cabeçalho continuam compactos;
- o FAB, a lista, a busca, o chat e o menu de conversa continuam nos mesmos lugares.

As capturas de largura/tema foram feitas sobre os mesmos arquivos (hash idênticos) e os fluxos de seleção, persistência e remoção foram repetidos na branch final.

## 10. Limitações e pendências

Não foram executados:

- validação no Hermes real, com login e sessões reais;
- teste em celular físico, galeria/câmera do sistema ou PWA instalado;
- teste de cota cheia, IndexedDB bloqueado por outra aba ou falha de gravação real;
- teste offline completo do PWA instalado (a leitura usa IndexedDB e não faz rede, mas o shell offline não foi revalidado);
- suporte a HEIC ou outros formatos de câmera do iPhone; esses arquivos são rejeitados com mensagem;
- recorte/ajuste manual do enquadramento; a foto é recortada automaticamente por `object-fit: cover`;
- teste com zoom/fonte extremos; o sheet de configurações agora tem rolagem.

O gerenciamento de foco do sheet de configurações continua sendo o comportamento anterior, não alterado nesta fase.

## 11. Preservação

Não foram alterados:

- o cabeçalho compacto e o menu geral da Fase 4B;
- o FAB `#btn-new`, o modal, a lista, a busca, o composer, os temas ou os perfis;
- o menu de ações da conversa, `#btn-menu` e `#sheet`;
- `dashboard/plugin_api.py`, `dashboard/dist/`, `plugin.yaml` ou a versão `1.8.0b1`;
- a `main`, a branch da Fase 3, a branch da Fase 4B, a branch documental, tags ou releases;
- o plugin original `hermes-pwa` e o Hermes instalado.

Não houve upload, sincronização remota, envio ao agente, deploy, instalação, PR, tag ou release.

## 12. Git e publicação

- **Commit de implementação:** `21ddb4ae6c297aa4f6c80b293a3fd375cde9d437`
  - Mensagem: `feat(treg-pwa): adicionar foto de perfil local`
  - 6 arquivos alterados: `dashboard/pwa/index.html`, `dashboard/pwa/app.css`, `dashboard/pwa/app.js`, `dashboard/pwa/ui-utils.js`, `tests/ui-contract.test.js`, `tests/ui-utils.test.js`.
- **Commit deste relatório:** o HEAD final da branch, criado após a implementação.
- **Branch de implementação:** `feat/treg-pwa-avatar-foto-local`.
- **Publicação:** a branch é enviada ao GitHub após o commit deste relatório; o SHA final é informado no resumo da publicação.

## 13. Encerramento

- **Fase concluída:** 4C — avatar com foto pessoal local.
- **Commit-base:** `642adc9a372f38da09247eb5ad660a219a7f93f2`.
- **Branch:** `feat/treg-pwa-avatar-foto-local`.
- **Mudanças efetivas:** foto local em IndexedDB, validação/redimensionamento, seleção/substituição/remoção, cabeçalho e preview sincronizados, testes e rolagem do sheet em telas curtas.
- **Testes executados:** Node UI/API/UI utils/QR 3/3; Python 7 passed; `py_compile`; `node --check`; `git diff --check`; Playwright em 320/390/1280, claro/escuro, com API stub.
- **Pendências:** Hermes real, dispositivo físico/PWA, falhas reais de IndexedDB/cota, offline completo e HEIC.
- **Estado final do Git:** branch local com commit de implementação e commit deste relatório; sem PR, tag ou release.
- **Caminho completo deste relatório:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-avatar-dev\report\33-avatar-foto-local.md`.
- **Próximo passo recomendado:** revisar este relatório e validar no Hermes/dispositivo real antes de qualquer nova fase.
