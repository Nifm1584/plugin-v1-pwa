# 31 — Pesquisa visual e auditoria do cabeçalho TREG PWA

**Data:** 2026-10-24<br>
**Fase:** 4A — pesquisa visual e auditoria técnica (somente leitura)<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch de referência:** `feat/treg-pwa-botao-flutuante`<br>
**Commit-base obrigatório:** `064c1073dc6f776d37f67495bcc285ac84646e8c`<br>
**Área de trabalho da auditoria:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-floating-dev`<br>
**Branch documental desta publicação:** `docs/fase-4a-pesquisa-cabecalho`<br>
**Status:** pesquisa concluída; **nenhum código, CSS, manifesto ou teste foi alterado**.

## 1. Estado inicial e método

Antes de qualquer análise, foram confirmados:

- a branch `feat/treg-pwa-botao-flutuante` existe no remoto e aponta para `064c1073dc6f776d37f67495bcc285ac84646e8c`;
- o commit-base `064c107` é o mesmo commit da Fase 3, com o relatório 30;
- a worktree de auditoria já existente estava limpa, nessa branch, no commit-base;
- a branch documental `docs/fase-4a-pesquisa-cabecalho` não existia e foi criada somente para publicar este relatório, a partir do mesmo commit-base;
- nenhuma alteração foi feita na branch publicada da Fase 3, na `main`, em tags, releases ou no plugin original.

Foram lidos diretamente no repositório os relatórios 29 e 30 e, como contexto, os relatórios 03, 04, 07, 17, 18, 19, 21, 23 e 27. O foco foi:

- o cabeçalho real do app (`dashboard/pwa/index.html`, `app.js`, `app.css`);
- o botão de atualizar e o menu de três pontos;
- as APIs de identidade/perfil disponíveis no plugin e no Hermes local;
- as referências visuais externas do WhatsApp Android.

## 2. Pesquisa visual no navegador

### 2.1 Páginas consultadas e o que foi realmente visualizado

| Referência | O que foi feito | O que foi visto de fato | Limitação |
|---|---|---|---|
| [FAQ — Como editar seu perfil](https://faq.whatsapp.com/859240711908360/?cms_platform=web&locale=pt_BR) | Aberta no Playwright; artigo completo e captura de página inteira | Texto instrucional sobre foto, nome e recado; **não há screenshot da tela de perfil nem do cabeçalho** | Página sem imagem útil de UI; não foi usada como prova visual de avatar |
| [FAQ — Localização do ícone Mais opções](https://faq.whatsapp.com/1189188245314343/?cms_platform=android&locale=pt_BR) | Aberta no Playwright; captura de página inteira | Ilustração de linha do topo da aba Conversas: “WhatsApp”, câmera, busca e três pontos verticais no canto superior direito; texto confirma “Mais opções” | É uma ilustração, não uma captura real do app |
| [Meta — Mantendo o WhatsApp moderno, simples e acessível](https://about.fb.com/br/news/2024/05/mantendo-o-whatsapp-moderno-simples-e-acessivel/) | Aberta no Playwright; página, banner de cookies e imagens | Artigo de design com imagens promocionais, incluindo uma montagem com telefone, marca WhatsApp e uma conversa com foto de contato | Não é um close do cabeçalho; as imagens carregam com atraso e a página tem muitos anúncios |
| [Google Imagens — cabeçalho/menu do WhatsApp Android](https://www.google.com/search?q=WhatsApp+Android+chat+header+profile+avatar+three+dot+menu+screenshot&tbm=isch) | Aberta no Playwright; grade de resultados visualizada | Captura real de uma conversa: avatar circular à esquerda, nome/status, ícones de vídeo e chamada, três pontos à direita; menu aberto com ações secundárias (contato, mídia, busca, silenciar, mensagens temporárias, papel de parede, mais) | A origem/versão da captura não é identificada; é referência estrutural, não oficial |
| [Google Imagens — perfil/foto de perfil](https://www.google.com/search?q=WhatsApp+Android+perfil+foto+de+perfil+tela&tbm=isch) | Aberta no Playwright; grade de resultados visualizada | Telas de perfil do WhatsApp Android com avatar circular grande, câmera/editar, nome e status; telas de lista com avatar nas linhas | Resultados de terceiros; algumas imagens são ilustrações |
| [Tecnoblog — como trocar a foto de perfil](https://tecnoblog.net/responde/como-colocar-foto-no-perfil-do-whatsapp-dica-de-privacidade/) | Artigo aberto; imagens diretas abertas no navegador | Imagem de “Perfil”: avatar circular grande e neutro, câmera no canto, nome e lápis de edição, tema escuro, seta de voltar. Outra imagem: lista com “WhatsApp”, câmera, busca e três pontos; menu aberto com “Novo grupo”, “Nova transmissão”, “Dispositivos conectados”, “Mensagens favoritas”, “Encontrar empresas”, “Pagamentos” e “Configurações”; abas inferiores e FAB | Imagens editoriais/ilustrativas, não documentação oficial; usadas apenas para estrutura e posicionamento |
| [Root-Nation — mudanças no menu de três pontos](https://root-nation.com/en/news-en/en-whatsapp-three-dot-menu-might-be-getting-some-design-changes/) | Artigo aberto; tentativa de carregar a imagem interna | Texto confirma que o menu fica no canto superior direito e que ações secundárias ficam no dropdown; a captura específica do menu não apareceu de forma confiável no corpo do artigo | A captura usada veio do resultado do Google Imagens, não do corpo do artigo |

### 2.2 Observações visuais concretas

**Avatar e identidade**

- No cabeçalho de uma conversa, o avatar é circular, pequeno e fica à esquerda do nome; o nome e o status ocupam duas linhas; as ações ficam à direita.
- Na tela de perfil, o avatar é grande, circular e centralizado; há um botão de câmera/edição sobreposto ao canto inferior direito; o nome fica abaixo, com ícones de edição.
- Na lista de conversas, os avatares aparecem nas linhas de cada conversa, não no cabeçalho da lista. O topo da lista mostra o título “WhatsApp”, câmera, busca e três pontos.

**Cabeçalho e menu**

- O cabeçalho é compacto: título à esquerda; ações principais como ícones à direita; o menu de três pontos fica no extremo direito.
- O menu abre como dropdown/superfície sobre a tela, com uma lista de ações secundárias, ícones e rótulos. Ações como configurações, novo grupo, transmissão e dispositivos ficam no menu, não no cabeçalho.
- No cabeçalho da conversa, ações como vídeo e chamada permanecem como ícones; o restante vai para o menu.
- O menu de conversa não é o mesmo menu da lista; a organização é contextual.

**Espaçamento, telas estreitas e temas**

- O cabeçalho tem altura compacta e usa ícones com alvo de toque confortável; o nome/status precisa truncar em telas estreitas.
- O avatar do cabeçalho é pequeno o suficiente para conviver com nome, status e ações; o avatar do perfil é grande e não é um padrão de cabeçalho.
- As referências mostram tema escuro com superfícies escuras e acentos verdes; o TREG deve preservar sua paleta teal e seus tokens, não copiar o verde nem a marca do WhatsApp.
- O FAB de nova conversa fica no canto inferior direito, acima da barra inferior; isso já foi tratado na Fase 3 e não deve ser confundido com o botão de atualizar.

**Limite da referência**

As referências **não** mostram um avatar de perfil do usuário no cabeçalho da lista de conversas. Elas mostram avatar no cabeçalho da conversa e na tela de perfil. Portanto, colocar um avatar de usuário no topo da lista do TREG é uma **adaptação**, não uma cópia literal de um padrão observado. O TREG também não deve copiar câmera, chamadas, status ou marca do WhatsApp.

## 3. Diagnóstico do cabeçalho atual do TREG

### 3.1 Cabeçalho da lista

`dashboard/pwa/index.html:33-40`:

```html
<aside id="list" class="pane list">
  <header class="bar">
    <div class="brand"><span class="logo">☤</span><span>TREG</span></div>
    <div class="actions">
      <button id="btn-refresh" ...>...</button>
      <button id="btn-settings" ...>...</button>
    </div>
  </header>
```

- **Texto “TREG”:** `index.html:35`, dentro de `.brand`, ao lado do glifo `☤`. É a única ocorrência de “TREG” no cabeçalho do app; a palavra também aparece no título do documento, na aba do painel e na versão das configurações.
- **Ações atuais:** `#btn-refresh` (`index.html:37`) e `#btn-settings` (`index.html:38`).
- **Avatar/perfil:** não existe no cabeçalho da lista. O `.brand` tem apenas o glifo e o texto.
- **Menu de três pontos:** não existe no cabeçalho da lista.
- **Barra de agente:** `index.html:41-45`, logo abaixo do cabeçalho; tem label “Agente”, `#agent` e `#agent-model`. É ocultada quando há menos de dois perfis (`app.js:918`); o perfil selecionado é persistido em `localStorage` (`app.js:930`).

### 3.2 Cabeçalho da conversa

`dashboard/pwa/index.html:61-72`:

- `#btn-back` (voltar);
- `#chat-avatar` — avatar circular de 34 px com iniciais da sessão (`app.css:75`); fica oculto em telas ≤380 px (`app.css:142`);
- `#chat-title` e `#chat-sub` — título e subtítulo da sessão;
- `#btn-stop` — parar execução;
- `#btn-menu` — três pontos verticais, `aria-label="Opções"`.

O `#btn-menu` **não é um menu geral do cabeçalho**. Seu handler (`app.js:876`) faz:

```js
$("btn-menu").addEventListener("click", function () {
  if (state.current) openSheet(state.current);
});
```

`openSheet` (`app.js:828-837`) abre `#sheet`, que contém apenas ações da conversa:

- Fixar/desafixar;
- Renomear conversa;
- Recarregar mensagens (somente se a conversa estiver aberta);
- Apagar conversa;
- Cancelar.

O mesmo `#sheet` também é aberto pelo botão `⋯` de cada linha da lista (`app.js:184-186`). Não há um menu de três pontos da lista nem uma ação de atualizar nesse sheet.

### 3.3 Configurações

`#btn-settings` (`index.html:38`) chama `openSettings` (`app.js:846-856`), que abre `#settings` (`index.html:104-121`). Esse sheet contém:

- Aparência: Auto / Claro / Escuro (`data-theme-choice`);
- Autorização de comandos: Sempre perguntar / Inteligente / Não perguntar;
- Versão do app;
- Fechar.

Não há ação “Atualizar” em `#settings`.

### 3.4 Temas, tamanhos e telas estreitas

- Variáveis de tema em `app.css:5-15`: claro (`--bar: #ffffff`, `--bar-text: #111b21`, `--accent: #0f8a7e`) e escuro (`--bar: #0f2f31`, `--bar-text: #e6efef`, `--accent: #2bb39a`).
- `.bar` tem `min-height: 56px`, `gap: 6px`, padding superior com `--safe-t` (`app.css:27`).
- `.brand` tem fonte 20 px e `flex: 1` (`app.css:28`); `.actions` tem gap 2 (`app.css:31`); `.icon` é 42×42 px (`app.css:32`).
- Em `max-width: 380px`, `.brand` cai para 18 px, `.logo` para 21 px e `.icon` para 38×38 px (`app.css:136-139`); o avatar do chat é ocultado (`app.css:142`).
- Em `min-width: 900px`, a lista vira coluna de 360 px e o chat fica ao lado (`app.css:147-155`).
- O cabeçalho atual não tem avatar de usuário; os avatares existentes são de sessão/linha e usam iniciais determinísticas (`app.js:23-25`, `app.js:181`, `app.css:44-46`).

### 3.5 Painel, histórico e outros pontos

- `dashboard/dist/index.js` é a página de instalação/QR do painel; não tem avatar, perfil ou menu de usuário. A palavra TREG aparece no título da página e na versão.
- `plugin.yaml` está em `version: 1.8.0b1`; nenhuma versão foi alterada nesta fase.
- `dashboard/manifest.json` identifica o plugin/aba TREG; não fornece identidade de usuário.
- O relatório 17 (`report/17...:109`) já registrava: “Cabeçalho compacto: marca textual TREG, três ícones de ação e nenhum avatar de perfil.” A Fase 3 manteve esse cabeçalho; apenas o `+` foi movido para o FAB.
- O relatório 18 (`report/18...:144`) registra “Avatares apenas com inicial; sem foto de contato ou identidade visual de agente”; e (`:158`) que o cabeçalho mobile não foi validado naquela tentativa.

## 4. Auditoria do botão de atualizar

### 4.1 Identificação e handler

- HTML: `#btn-refresh`, `dashboard/pwa/index.html:37`, classe `icon`, `title="Atualizar"`, `aria-label="Atualizar"`, SVG circular de refresh.
- Handler: `dashboard/pwa/app.js:262`:

```js
$("btn-refresh").addEventListener("click", function () {
  loadSessions(false, true).then(function () { toast("Atualizado"); });
});
```

- `loadSessions` (`app.js:192-215`):
  - ignora a chamada se já houver carregamento;
  - reseta a lista/offset;
  - marca `state.sessionsLoading = true`;
  - renderiza o skeleton e o status “Carregando conversas…”;
  - chama `api.getSessions({ limit: 80, offset, profile })`;
  - em sucesso, mescla as sessões e atualiza `hasMore`;
  - em erro, define `state.sessionsError` e mostra `toast("Erro ao listar: ...")`;
  - no `then` final, desliga o loading e renderiza.
- O botão não tem estado de carregamento próprio, não é desabilitado e não tem spinner; o feedback de carregamento é o skeleton/status da lista.

### 4.2 Comportamento real e risco

Há um detalhe importante no fluxo atual: `loadSessions` captura o erro e **resolve** a promessa no `then` final. Assim, o `then` do handler de refresh também executa depois de uma falha e pode mostrar `toast("Atualizado")` logo depois do toast de erro, sobrescrevendo a mensagem de erro. Além disso, se `loadSessions` retornar cedo porque `state.sessionsLoading` já é verdadeiro, o refresh mostra “Atualizado” sem ter feito uma nova requisição.

Isso é comportamento existente, não introduzido nesta fase. A próxima fase deve **reutilizar o handler** para não alterar a lógica; se o objetivo for corrigir o falso “Atualizado”, isso deve ser tratado como decisão separada, com teste próprio.

### 4.3 Onde colocar a ação

- O botão de atualizar é uma ação da **lista**, não da conversa.
- O único menu de três pontos existente (`#btn-menu`) só existe no cabeçalho da conversa e abre ações da sessão; não é adequado para “Atualizar” e não está disponível na lista.
- O sheet de configurações (`#settings`) é aberto pelo botão de configurações e tem outra responsabilidade; adicionar “Atualizar” ali misturaria configurações com atualização e não atenderia ao padrão de menu do cabeçalho.
- **Não existe um menu geral/overflow no cabeçalho da lista.** Para mover “Atualizar” para um menu de três pontos sem mudar a lógica, a próxima fase precisará de um novo menu de cabeçalho (dropdown/popover) ou de uma decisão explícita de usar outro contêiner. Reutilizar `#sheet` ou `#settings` não é tecnicamente correto sem redefinir seus papéis.

## 5. Auditoria de APIs: identidade, nome e foto

### 5.1 O que o plugin expõe hoje

| Recurso | Evidência | Dados retornados | Tem foto? | Observações |
|---|---|---|---|---|
| `GET /api/plugins/treg-pwa/api/me` | `dashboard/plugin_api.py:209-219` | `user`, `model`, `api_base` | **Não** | `user = request.state.user_id or "admin"`. O frontend chama `req("me")` apenas para guardar `model` (`app.js:971`); não guarda `user` |
| `GET /api/plugins/treg-pwa/api/profiles` | `dashboard/plugin_api.py:158-184` | `profiles[]` com `name`, `is_default`, `model`, `provider`, `description`; `multiplex` | **Não** | Lista de agentes/perfis; não é identidade do usuário e não tem avatar |
| `GET /api/plugins/treg-pwa/api/capabilities` | `dashboard/plugin_api.py:222-247` | features do gateway e do plugin | **Não** | Não fornece identidade |
| `GET /api/plugins/treg-pwa/api/sessions` | `plugin_api.py:250-255` | sessões (título, preview, source, last_active etc.) | **Não** | Não é perfil do usuário |

O frontend tem `api.getMe` (`hermes-api.js:156`) e `api.getProfiles` (`:157`), mas **não os utiliza**: o boot usa `req("me")` e `req("profiles")`. Não há `state.user` nem exibição de nome/foto do usuário.

### 5.2 Identidade no dashboard do Hermes

O código local do Hermes Agent (versão instalada `0.18.0`) contém uma rota oficial de identidade do dashboard:

- `GET /api/auth/me` — `hermes_cli/dashboard_auth/routes.py:584-597`;
- retorna `user_id`, `email`, `display_name`, `org_id`, `provider`, `expires_at`;
- **não retorna avatar, foto, URL de imagem ou campo equivalente**;
- a dataclass `Session` (`hermes_cli/dashboard_auth/base.py:10-25`) também não tem campo de avatar;
- o provider básico (`plugins/dashboard_auth/basic/__init__.py:244-312`) cria `Session` com `user_id` = username, `email = ""`, `display_name` = username;
- o `AuthWidget` do dashboard usa `display_name || email || user_id truncado` (`web/src/components/AuthWidget.tsx:110-133`), sem foto.

Disponibilidade:

- a rota é **auth-required**; em modo gated, o middleware anexa `request.state.session` (`hermes_cli/web_server.py:362-368`; `dashboard_auth/middleware.py:402`);
- em loopback/`--insecure`, `/api/auth/me` tende a retornar 401 porque não há sessão;
- o plugin atualmente não chama `/api/auth/me`; ele tem seu próprio `/api/me`;
- o `/api/me` do plugin usa `request.state.user_id`, mas o código auditado do Hermes não define `request.state.user_id` (o gate anexa `request.state.session`). Isso indica que o campo `user` do plugin pode cair no fallback `"admin"`; **não foi executado em runtime para confirmar**.

A versão local do Hermes é `0.18.0` (`pyproject.toml`), enquanto o relatório 26 cita Hermes de referência `v0.22.2`. A rota e os campos precisam ser confirmados na versão realmente usada pelo TREG antes de qualquer implementação que dependa dela.

### 5.3 Foto de perfil

Não foi encontrada, no plugin nem no código auditado do Hermes, uma API ou propriedade que forneça **foto de perfil real** do usuário:

- o `/api/me` do plugin não tem foto;
- o `/api/auth/me` do dashboard não tem foto;
- `/api/profiles` não tem foto;
- o `AuthWidget` não usa foto;
- nenhum endpoint de avatar/foto foi encontrado na busca pelo código do dashboard/plugin;
- os relatórios anteriores já registram a mesma limitação:
  - relatório 03: “Sem `<img>`, sem foto do usuário” (`report/03...:20-21`);
  - relatório 04: “foto de perfil — não identificado; não prometer” (`report/04...:26`);
  - relatório 07: “foto do usuário: não há recurso correspondente no Hermes”; prevê local opt-in ou futuro avatar do dashboard (`report/07...:39`);
  - relatório 19: “Hermes não expõe foto; TREG usa inicial” (`report/19...:185`);
  - relatório 21: avatares de inicial, sem foto (`report/21...:135`).

**Conclusão:** não há foto real comprovada. Não se deve usar uma imagem aleatória nem inventar upload/armazenamento nesta fase.

### 5.4 Nome e identidade do agente

O agente selecionado é uma identidade **real e disponível**:

- `state.profile` é o nome do perfil selecionado (`app.js:9`, `:925-932`);
- `/api/profiles` retorna `name`, `model`, `provider`, `description`;
- o `#agent` select permite trocar de agente quando `multiplex` está ativo;
- a `.agentbar` mostra o agente/modelo, mas é ocultada quando há menos de dois perfis (`app.js:918`);
- o cabeçalho do chat mostra “Agente {profile}” no subtítulo quando o perfil não é `default` (`app.js:293`).

Isso serve para um rótulo/avatar de **agente**, não para a foto/nome do **usuário**. Não confundir os dois.

## 6. Alternativas visuais

### 6.1 Alternativa recomendada: avatar circular neutro com iniciais/glyph

- Avatar circular pequeno no cabeçalho da lista (ordem de 34–42 px), ao lado de um nome opcional.
- Fonte de iniciais, em ordem de preferência:
  1. `display_name` de `/api/auth/me`, **se** confirmado disponível no modo de autenticação do TREG;
  2. `user` de `/api/me`, **somente se** o backend for corrigido/confirmado para não devolver sempre `"admin"`;
  3. nome do agente selecionado (`/api/profiles`), como identidade de agente, não de usuário;
  4. fallback: glifo `☤` já existente ou inicial “T”, sem inventar pessoa.
- Não exibir `email`, `user_id` completo ou telefone no cabeçalho. Se só houver um `user_id` opaco, usar uma inicial genérica ou o glifo, não o identificador completo.
- Reutilizar `ui.avatarInitial` (`ui-utils.js:32-38`) e as variáveis de tema existentes; não criar imagem/arquivo novo.
- Mostrar nome ao lado do avatar **somente** quando houver uma fonte confiável; caso contrário, apenas o avatar com `aria-label="Perfil"` (ou “Conta”) e sem texto falso.
- O avatar pode ser não interativo; não há tela de perfil/edição comprovada no TREG. Não criar uma tela de perfil sem decisão.

### 6.2 Foto personalizada local (nova funcionalidade, não recomendada agora)

- Uma foto escolhida pelo usuário poderia ser armazenada localmente (IndexedDB ou `localStorage` como data URL) e nunca enviada ao servidor.
- Isso exigiria: seleção/recorte, limite de tamanho, validação de tipo, tratamento de quota, botão para remover, comportamento em PWA/offline e decisão de privacidade.
- Não é suportado pelo Hermes, não existe no TREG e não deve ser implementado nesta fase. O relatório 07 já menciona “foto local opt-in” como hipótese, mas não há implementação.
- Não use uma foto aleatória nem um avatar de terceiro como se fosse a foto do usuário.

### 6.3 Avatar do dashboard no futuro

- O dashboard do Hermes tem `display_name`/`email`/`user_id`, mas não avatar.
- Se uma versão futura expuser uma URL de avatar, o TREG poderia reutilizá-la; isso não existe hoje e não foi confirmado na v0.22.2. Não projetar contra uma API hipotética.

## 7. Proposta objetiva para a próxima fase

### 7.1 Cabeçalho da lista

- Remover o texto “TREG” do `.brand` (`index.html:35`), preservando o glifo `☤` apenas se ele for usado como avatar/fallback.
- Substituir o bloco por uma identidade compacta:
  - avatar circular de 34–42 px;
  - nome opcional, truncável, somente com fonte confiável;
  - um único botão de três pontos à direita.
- Não alterar o cabeçalho do chat (`#chat-avatar`, título, subtítulo, `#btn-menu` de sessão), o FAB `#btn-new`, os sheets de sessão/configurações, a lista, o composer ou os temas.
- Não adicionar câmera, chamada, status, “online” ou qualquer elemento do WhatsApp sem contrato real.

### 7.2 Menu de três pontos

- Criar um menu de cabeçalho da lista (dropdown/popover ancorado no botão), com:
  - **Atualizar** — chama exatamente o handler atual de `loadSessions(false, true)`, sem novo endpoint;
  - **Configurações** — abre o `#settings` existente, se a decisão for retirar o ícone de configurações do cabeçalho; ou manter o ícone, se aprovado.
- Não reutilizar o `#sheet` de sessão para isso; ele é contextual da conversa.
- Preservar o comportamento de atualização, inclusive o toast atual. A correção do falso “Atualizado” deve ser uma decisão separada.
- Requisitos de acessibilidade para o novo menu:
  - `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`;
  - foco no primeiro item ao abrir, navegação por setas/Tab, Escape fecha e devolve o foco ao botão;
  - clique fora fecha;
  - rótulos claros; não depender só de ícone.
- O botão de três pontos deve continuar visualmente distinto do menu de sessão do chat; não duplicar IDs.

### 7.3 Fonte de identidade, por ordem de segurança

1. Confirmar `/api/auth/me` no Hermes real usado pelo TREG (versão, modo gated/loopback e login básico). Se disponível, usar `display_name`/username para iniciais e, se desejado, nome; `email` não é necessário; nunca exibir `user_id` completo.
2. Se `/api/auth/me` não estiver disponível, confirmar/corrigir o `/api/me` do plugin para expor um nome confiável; hoje ele pode retornar `"admin"`.
3. Se nenhuma identidade confiável estiver disponível, usar avatar neutro com o glifo `☤`/inicial “T” e sem nome; não inventar dado.
4. O nome do agente selecionado pode ser um rótulo secundário quando houver múltiplos perfis, mas não substitui a identidade do usuário.

### 7.4 O que deve permanecer intacto

- `#btn-new` e o FAB da Fase 3;
- modal de nova conversa;
- lista, busca, chat, composer, anexos, áudio, aprovações, perfis, temas;
- `#btn-menu` e `#sheet` de sessão;
- `#btn-settings` e `#settings`, se não houver decisão de movê-los;
- endpoints, contratos, backend e versão `1.8.0b1`;
- branches publicadas, `main`, tags, releases e plugin original.

## 8. Testes existentes e lacunas

- `tests/ui-contract.test.js` exige `btn-new`, `chat-avatar`, `app-version` etc. (`linhas 15-19`), mas **não exige** `btn-refresh`, `btn-settings` ou `btn-menu`; não testa o cabeçalho, o menu de três pontos, o perfil ou o handler de atualização.
- `tests/hermes-api.test.js` cobre sessões, busca, mutações, runs, SSE, capabilities e auth, mas **não testa `getMe`/`getProfiles`** nem a identidade do usuário.
- `tests/test_plugin_api.py` cobre stop/capabilities/estáticos, mas **não testa `/api/me` nem `/api/profiles`**.
- `tests/ui-utils.test.js` testa `avatarInitial` apenas para títulos de sessão, não para identidade do usuário.
- Não há teste de navegador para o cabeçalho; os relatórios 18 e 27 registram que a validação visual anterior falhou/pendente.

Testes recomendados para a próxima fase:

1. Contrato do cabeçalho: remoção de “TREG” do header, um único menu, refresh acessível apenas no menu, settings acessível, avatar presente.
2. Identidade: `/api/auth/me` 200/401, `display_name` vazio, fallback; `/api/me` sem nome confiável; nunca mostrar `user_id` completo.
3. Atualização: item do menu chama o mesmo `loadSessions(false, true)`; estado de loading; sucesso/erro; evitar afirmar sucesso em erro (se decidido).
4. Menu: teclado, Escape, foco, clique fora, `aria-expanded`; sem duplicar IDs.
5. Visual: 320/390/1280, nome truncado, avatar, menu, temas claro/escuro, área segura.
6. Regressão: FAB, modal, sheet de sessão, configurações, lista/chat.

## 9. Limitações e dúvidas técnicas

1. **Versão do Hermes:** o código local auditado é `0.18.0`; o relatório 26 usa `v0.22.2` como referência. A existência/comportamento de `/api/auth/me` e dos campos `display_name`/`email` precisa ser confirmada na versão do TREG.
2. **Modo de autenticação:** `/api/auth/me` é auth-required; em loopback/`--insecure` pode retornar 401. O plugin usa `/auth/password-login` e tem seu próprio `/api/me`; não foi executado com o Hermes real nesta fase.
3. **`/api/me` do plugin:** usa `request.state.user_id`, mas o gate do Hermes anexa `request.state.session`; o fallback `"admin"` pode ser o valor real. Não foi feito runtime.
4. **Sem foto:** nenhuma foto real foi encontrada; não implementar upload/armazenamento agora.
5. **Referências visuais:** as páginas oficiais não têm screenshot de perfil; a principal evidência veio de Google Imagens/Tecnoblog, com origem/versão não documentada. São referências estruturais, não oficiais.
6. **Nenhuma captura atual do TREG:** a auditoria do cabeçalho atual é por código e relatórios anteriores; não foi feita uma nova captura de runtime do TREG nesta fase.
7. **Menu:** não existe componente de menu de cabeçalho reutilizável; a próxima fase precisa decidir entre dropdown novo ou adaptação do sheet, com impacto em acessibilidade e testes.
8. **Atualização:** o toast de sucesso pode aparecer após erro/early return; preservar ou corrigir é uma decisão separada.

## 10. Preservação

Nenhum arquivo de código, CSS, HTML, manifesto, teste ou `plugin.yaml` foi alterado. Nenhuma versão foi atualizada. Não houve:

- branch de implementação;
- commit de código;
- tag ou release;
- PR;
- instalação/deploy no Hermes;
- alteração da `main`, da branch `feat/treg-pwa-botao-flutuante`, da branch `docs/fase-5b...`, das tags C7/1.8.0b1 ou do plugin original.

A única alteração desta fase é este relatório, na branch documental `docs/fase-4a-pesquisa-cabecalho`.

## 11. Git e publicação

- **Commit-base:** `064c1073dc6f776d37f67495bcc285ac84646e8c` (`feat/treg-pwa-botao-flutuante`, Fase 3).
- **Branch documental:** `docs/fase-4a-pesquisa-cabecalho`, criada a partir do commit-base.
- **Arquivo:** `report/31-pesquisa-visual-e-auditoria-cabecalho.md`.
- **Commit deste relatório:** o commit que contém este arquivo; o SHA final é informado no resumo da publicação.
- A branch da Fase 3 permanece em `064c107` e não foi alterada.

## 12. Encerramento

- **Fase concluída:** 4A — pesquisa visual e auditoria do cabeçalho, perfil/avatar e menu.
- **Commit-base:** `064c1073dc6f776d37f67495bcc285ac84646e8c`.
- **Branch de referência:** `feat/treg-pwa-botao-flutuante` (preservada).
- **Branch documental:** `docs/fase-4a-pesquisa-cabecalho`.
- **Mudanças efetivas:** nenhuma no código; somente este relatório.
- **Pesquisa visual:** FAQ do WhatsApp (texto), FAQ do menu (ilustração), artigo da Meta, Google Imagens (cabeçalho/menu e perfil) e imagens da Tecnoblog; links e limitações registrados acima.
- **Conclusões principais:** não há foto real comprovada; `/api/auth/me` fornece nome/identidade sem avatar (a confirmar na versão do Hermes); o `/api/me` do plugin pode retornar “admin”; o cabeçalho atual mostra TREG + atualizar + configurações, sem avatar e sem menu geral; o menu de três pontos existente é somente de sessão; a ação de atualizar pode ser movida para um novo menu de cabeçalho reutilizando o handler, mas isso deve ser decidido/implementado na próxima fase.
- **Pendências:** confirmar auth/identidade na versão real do Hermes; decidir avatar/fallback; definir o componente de menu; validar o comportamento de atualização e acessibilidade; validar em 320/390/desktop com Hermes real.
- **Caminho completo deste relatório:** `C:\Users\Nilton A\AppData\Local\Temp\opencode\plugin-v1-pwa-treg-docs-4a\report\31-pesquisa-visual-e-auditoria-cabecalho.md`.
- **Próximo passo recomendado:** analisar este relatório e, somente depois, implementar a remoção do texto TREG, o avatar/identidade com fallback e o menu com “Atualizar”, preservando o restante da interface.
