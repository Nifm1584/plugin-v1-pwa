"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "dashboard", "pwa", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "dashboard", "pwa", "app.js"), "utf8");
const uiUtils = fs.readFileSync(path.join(root, "dashboard", "pwa", "ui-utils.js"), "utf8");
const css = fs.readFileSync(path.join(root, "dashboard", "pwa", "app.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "dashboard", "pwa", "sw.js"), "utf8");
const plugin = fs.readFileSync(path.join(root, "plugin.yaml"), "utf8");
const manifest = fs.readFileSync(path.join(root, "dashboard", "manifest.json"), "utf8");
const panel = fs.readFileSync(path.join(root, "dashboard", "dist", "index.js"), "utf8");

const requiredIds = [
  "net-banner", "list-status", "list-skeleton", "list-foot", "btn-more", "btn-new",
  "btn-header-menu", "header-menu", "btn-refresh", "btn-settings", "btn-menu", "sheet", "settings",
  "header-avatar-glyph", "header-avatar-img", "profile-avatar-preview", "profile-avatar-glyph",
  "profile-avatar-img", "btn-avatar-pick", "btn-avatar-remove", "avatar-file", "avatar-status",
  "btn-stop", "chat-status", "btn-rec-cancel", "search", "search-row", "btn-search", "sessions", "messages",
  "btn-scroll-bottom", "chat-avatar", "app-version"
];

for (const id of requiredIds) {
  assert.ok(html.includes('id="' + id + '"'), "elemento ausente: #" + id);
}

const listFootIndex = html.indexOf('id="list-foot"');
const listActionsIndex = html.indexOf('<div class="list-actions">');
const btnNewIndex = html.indexOf('id="btn-new"');
const listActionsEnd = html.indexOf('</div>', listActionsIndex);
const listActionsMarkup = html.slice(listActionsIndex, listActionsEnd);

assert.ok(listActionsIndex > listFootIndex, "a área de ação deve vir depois de #list-foot");
assert.ok(btnNewIndex > listActionsIndex, "btn-new deve ficar dentro de .list-actions");
assert.ok(listActionsMarkup.includes('id="btn-new"'), "btn-new deve estar dentro de .list-actions");
assert.equal((html.match(/id="btn-new"/g) || []).length, 1, "deve haver exatamente um btn-new");
assert.ok(html.slice(0, html.indexOf('</header>')).indexOf('id="btn-new"') < 0, "btn-new não deve ficar no cabeçalho");
assert.ok(html.includes("Use o botão + abaixo para começar."), "estado vazio deve apontar para o botão inferior");
assert.ok(app.includes("Use o botão + abaixo para começar."), "estado vazio dinâmico deve apontar para o botão inferior");

const btnNewMarkup = html.slice(btnNewIndex, html.indexOf('</button>', btnNewIndex) + 9);
assert.ok(btnNewMarkup.includes('class="icon primary"'), "btn-new deve preservar as classes originais");
assert.ok(btnNewMarkup.includes('title="Nova conversa"'), "btn-new deve preservar o title original");
assert.ok(btnNewMarkup.includes('aria-label="Nova conversa"'), "btn-new deve preservar o aria-label original");
assert.ok(btnNewMarkup.includes('width="22" height="22"'), "btn-new deve preservar o SVG 22x22");
assert.ok(btnNewMarkup.includes('d="M12 5v14M5 12h14"'), "btn-new deve preservar o ícone + original");

const listMarkup = html.slice(html.indexOf('<aside id="list"'), html.indexOf('</aside>') + 9);
const listHeaderStart = listMarkup.indexOf('<header class="bar">');
const listHeaderEnd = listMarkup.indexOf('</header>', listHeaderStart) + '</header>'.length;
const listHeader = listMarkup.slice(listHeaderStart, listHeaderEnd);
const listHeaderActionsStart = listHeader.indexOf('<div class="actions">');
const listHeaderActionsEnd = listHeader.indexOf('</div>', listHeaderActionsStart) + 6;
const listHeaderActions = listHeader.slice(listHeaderActionsStart, listHeaderActionsEnd);
const headerMenuStart = listHeader.indexOf('id="header-menu"');
const headerMenuEnd = listHeader.indexOf('</div>', headerMenuStart) + 6;
const headerMenuMarkup = listHeader.slice(headerMenuStart, headerMenuEnd);

assert.ok(!listHeader.includes("TREG"), "o texto TREG não deve aparecer no cabeçalho da lista");
assert.ok(listHeader.includes('class="brand-avatar"'), "o cabeçalho deve ter o avatar neutro");
assert.ok(listHeader.includes("☤"), "o avatar deve preservar o glifo existente");
assert.ok(listHeaderActions.includes('id="btn-header-menu"'), "o botão do menu deve ficar nas ações do cabeçalho");
assert.ok(!listHeaderActions.includes('id="btn-refresh"'), "Atualizar não deve ficar como ícone independente no cabeçalho");
assert.ok(!listHeaderActions.includes('id="btn-settings"'), "Configurações não deve ficar como ícone independente no cabeçalho");
assert.ok(listHeader.includes('aria-haspopup="menu"'), "o botão do menu deve declarar aria-haspopup");
assert.ok(listHeader.includes('aria-expanded="false"'), "o botão do menu deve iniciar com aria-expanded=false");
assert.ok(listHeader.includes('aria-controls="header-menu"'), "o botão do menu deve apontar para #header-menu");
assert.ok(headerMenuMarkup.includes('role="menu"'), "o menu deve ter role=menu");
assert.ok(headerMenuMarkup.includes('aria-labelledby="btn-header-menu"'), "o menu deve ser rotulado pelo botão");
assert.ok(headerMenuMarkup.includes('id="btn-refresh"'), "Atualizar deve estar dentro do menu");
assert.ok(headerMenuMarkup.includes('id="btn-settings"'), "Configurações deve estar dentro do menu");
assert.ok(headerMenuMarkup.includes('role="menuitem"'), "os itens do menu devem ter role=menuitem");
assert.ok(headerMenuMarkup.includes("Atualizar"), "o menu deve exibir Atualizar");
assert.ok(headerMenuMarkup.includes("Configurações"), "o menu deve exibir Configurações");
assert.equal((html.match(/id="btn-header-menu"/g) || []).length, 1, "deve haver exatamente um btn-header-menu");
assert.equal((html.match(/id="header-menu"/g) || []).length, 1, "deve haver exatamente um header-menu");
assert.equal((html.match(/id="btn-refresh"/g) || []).length, 1, "deve haver exatamente um btn-refresh");
assert.equal((html.match(/id="btn-settings"/g) || []).length, 1, "deve haver exatamente um btn-settings");
assert.ok(app.includes('$("btn-refresh").addEventListener("click"'), "o handler de Atualizar deve ser preservado");
assert.ok(app.includes("loadSessions(false, true)"), "Atualizar deve preservar a chamada loadSessions(false, true)");
assert.ok(app.includes('$("btn-settings").addEventListener("click", openSettings)'), "o handler de Configurações deve ser preservado");
assert.ok(app.includes("function openHeaderMenu"), "o menu deve ter abertura implementada");
assert.ok(app.includes("function closeHeaderMenu"), "o menu deve ter fechamento implementado");
assert.ok(app.includes('headerMenuBtn.setAttribute("aria-expanded"'), "o menu deve atualizar aria-expanded");
assert.ok(app.includes('document.addEventListener("click"'), "o menu deve fechar com clique fora");
assert.ok(app.includes('e.key === "Escape"'), "o menu deve fechar com Escape");
assert.ok(app.includes('$("btn-menu").addEventListener("click"'), "o menu de ações da conversa deve continuar existindo");
assert.ok(app.includes("openSheet(state.current)"), "o menu da conversa deve continuar abrindo o sheet da sessão");

assert.ok(listHeader.includes('id="header-avatar-glyph"'), "o avatar padrão deve ter o glyph do cabeçalho");
assert.ok(listHeader.includes('id="header-avatar-img"'), "o avatar do cabeçalho deve ter imagem opcional");
assert.ok(html.includes('id="profile-avatar-preview"'), "as configurações devem ter o preview do avatar");
assert.ok(html.includes('id="profile-avatar-glyph"'), "o preview deve ter o glyph padrão");
assert.ok(html.includes('id="profile-avatar-img"'), "o preview deve ter imagem opcional");
assert.ok(html.includes('id="btn-avatar-pick"'), "deve haver o botão de escolher foto");
assert.ok(html.includes('id="btn-avatar-remove"'), "deve haver o botão de remover foto");
assert.ok(html.includes('id="avatar-file"'), "deve haver o input de arquivo da foto");
assert.ok(html.includes('accept="image/jpeg,image/png,image/webp"'), "o input deve aceitar JPEG, PNG e WebP");
assert.ok(html.includes('id="avatar-status"'), "deve haver status acessível da foto");
assert.ok(html.includes('role="status"'), "o status da foto deve ser anunciado");
assert.ok(app.includes("loadProfileAvatar"), "o app deve carregar a foto salva");
assert.ok(app.includes("renderAvatar"), "o app deve renderizar a foto no cabeçalho e no preview");
assert.ok(app.includes("ui.validateAvatarFile"), "o app deve validar o arquivo");
assert.ok(app.includes("ui.prepareAvatarBlob"), "o app deve preparar/redimensionar a imagem");
assert.ok(app.includes("ui.saveAvatarBlob"), "o app deve salvar a foto no IndexedDB");
assert.ok(app.includes("ui.deleteAvatarBlob"), "o app deve remover a foto do IndexedDB");
assert.ok(app.includes("btn-avatar-pick"), "o app deve ligar o botão de escolher foto");
assert.ok(app.includes("btn-avatar-remove"), "o app deve ligar o botão de remover foto");
assert.ok(uiUtils.includes("indexedDB"), "a foto deve usar IndexedDB");
assert.ok(uiUtils.includes("prepareAvatarBlob"), "a camada de UI deve preparar a imagem");
assert.ok(uiUtils.includes("saveAvatarBlob"), "a camada de UI deve salvar a imagem");
assert.ok(uiUtils.includes("deleteAvatarBlob"), "a camada de UI deve excluir a imagem");
assert.ok(!/\bfetch\s*\(/.test(uiUtils), "a camada da foto não deve chamar fetch/upload");
assert.ok(/\.brand-avatar\s*\{[^}]*overflow:\s*hidden/.test(css), "o avatar deve recortar a foto no círculo");
assert.ok(/\.avatar-img\s*\{[^}]*object-fit:\s*cover/.test(css), "a foto deve usar object-fit: cover");
assert.ok(/\.profile-avatar-preview\s*\{[^}]*border-radius:\s*50%/.test(css), "o preview deve ser circular");
assert.ok(/#settings\s+\.sheet-card\s*\{[^}]*overflow-y:\s*auto/.test(css), "as configurações devem rolar quando necessário");
assert.ok(/\.bar\s*\{[^}]*position:\s*relative/.test(css), "o cabeçalho deve ser o contêiner do menu");
assert.ok(/\.brand-avatar\s*\{[^}]*border-radius:\s*50%/.test(css), "o avatar do cabeçalho deve ser circular");
assert.ok(/\.header-menu\s*\{[^}]*position:\s*absolute/.test(css), "o menu deve ser posicionado dentro do cabeçalho");
assert.ok(/\.header-menu\s*\{[^}]*top:\s*calc\(100% \+ 6px\)/.test(css), "o menu deve abrir abaixo do cabeçalho");
assert.ok(/\.header-menu\s*\{[^}]*right:\s*8px/.test(css), "o menu deve ficar à direita");
assert.ok(/\.header-menu\s*\{[^}]*z-index:\s*15/.test(css), "o menu deve ficar acima da lista");
assert.ok(!/\.header-menu\s*\{[^}]*position:\s*fixed/.test(css), "o menu não deve ser fixo ao viewport");
assert.ok(/\.header-menu\s+\.menu-item/.test(css), "o menu deve estilizar os itens");

assert.ok(/#list\s*\{[^}]*position:\s*relative/.test(css), "#list deve ser o contêiner de posicionamento");
assert.ok(/\.list-actions\s*\{[^}]*position:\s*absolute/.test(css), ".list-actions deve flutuar dentro de #list");
assert.ok(/\.list-actions\s*\{[^}]*right:\s*16px/.test(css), ".list-actions deve ficar à direita");
assert.ok(/\.list-actions\s*\{[^}]*bottom:\s*calc\(16px \+ var\(--safe-b\)\)/.test(css), ".list-actions deve respeitar a área segura inferior");
assert.ok(/\.list-actions\s*\{[^}]*z-index:\s*5/.test(css), ".list-actions deve ficar sobre a lista");
assert.ok(!/\.list-actions\s*\{[^}]*position:\s*fixed/.test(css), ".list-actions não deve ser fixo ao viewport");
assert.ok(/\.list-foot:not\(\.hidden\)\s*~\s*\.list-actions\s*\{[^}]*bottom:\s*calc\(72px \+ var\(--safe-b\)\)/.test(css), "o botão deve subir quando a paginação estiver visível");
assert.ok(!/\.list-actions[^{]*\{[^}]*width:\s*52px/.test(css), "o botão deve voltar ao tamanho original de 42px");
assert.ok(!/\.list-actions[^{]*\{[^}]*box-shadow/.test(css), "o botão não deve manter sombra personalizada da Fase 2");
assert.ok(/\.icon\s*\{[^}]*width:\s*42px;[^}]*height:\s*42px;/.test(css), ".icon original deve continuar com 42x42");
assert.ok(/\.icon\.primary\s*\{[^}]*background:\s*var\(--accent\)/.test(css), "tema original do botão deve ser preservado");
assert.ok(/\.sessions\s*\{[^}]*padding:\s*0 0 calc\(72px \+ var\(--safe-b\)\)/.test(css), "a lista deve reservar espaço para o botão");
assert.ok(/\.sessions\s*\{[^}]*scroll-padding-bottom:\s*calc\(72px \+ var\(--safe-b\)\)/.test(css), "a rolagem deve reservar espaço para o botão");
assert.ok(/\.list-foot\s*\{[^}]*padding:\s*8px 12px calc\(8px \+ var\(--safe-b\)\)/.test(css), "a paginação deve respeitar a área segura inferior");

const newHandlerStart = app.indexOf('$("btn-new").addEventListener');
const newHandlerEnd = app.indexOf("// ───────────────────────── chat", newHandlerStart);
const newHandler = app.slice(newHandlerStart, newHandlerEnd > newHandlerStart ? newHandlerEnd : app.length);

assert.ok(newHandlerStart >= 0, "handler de btn-new ausente");
assert.ok(newHandler.includes('ask("Nova conversa"'), "btn-new deve abrir o modal compartilhado");
assert.ok(newHandler.includes('req(pq("sessions"), { method: "POST"'), "confirmação deve criar a sessão via POST");
assert.ok(newHandler.includes('mergeSessions(state.sessions, [s])'), "sessão criada deve ser mesclada na lista");
assert.ok(newHandler.includes('openSession(s)'), "sessão criada deve ser aberta");
assert.ok(newHandler.includes('toast("Não criou: " + e.message)'), "erro de criação deve ser tratado como erro");
assert.ok(!newHandler.includes('toast("Nova conversa criada")'), "erro não deve ser apresentado como sucesso");
assert.equal((html.match(/aria-label="Nova conversa"/g) || []).length, 1, "deve haver um único botão Nova conversa");

assert.ok(html.indexOf("ui-utils.js") < html.indexOf("hermes-api.js"), "ui-utils.js deve carregar antes de hermes-api.js");
assert.ok(html.indexOf("hermes-api.js") < html.indexOf("app.js"), "hermes-api.js deve carregar antes de app.js");
assert.ok(html.includes('data-act="pin"'), "ação de fixar ausente no menu");
assert.ok(html.includes('data-theme-choice="auto"'), "opção Auto ausente");
assert.ok(html.includes('data-theme-choice="light"'), "opção Light ausente");
assert.ok(html.includes('data-theme-choice="black"'), "opção Black ausente");
assert.ok(html.includes(">Light<"), "rótulo Light ausente");
assert.ok(html.includes(">Black<"), "rótulo Black ausente");
assert.ok(!html.includes('data-theme-choice="dark"'), "a opção antiga Escuro não deve permanecer no seletor");
assert.ok(css.includes(':root, :root[data-theme="auto-light"]'), "paleta Auto clara atual ausente");
assert.ok(css.includes(':root[data-theme="auto-dark"]'), "paleta Auto escura atual ausente");
assert.ok(css.includes(':root[data-theme="light"]'), "paleta Light ausente");
assert.ok(css.includes(':root[data-theme="black"]'), "paleta Black ausente");
assert.ok(css.includes("--accent: #0f8a7e"), "verde/cinza da identidade atual (claro) ausente");
assert.ok(css.includes("--accent: #2bb39a"), "verde/cinza da identidade atual (escuro) ausente");
assert.ok(css.includes("--accent: #00a884"), "verde WhatsApp das novas paletas ausente");
assert.ok(css.includes("--bg: #000000"), "fundo preto do Black ausente");
assert.ok(css.includes("--me: #005c4b"), "mensagem enviada do Black ausente");
assert.ok(!css.includes('data-theme="dark"'), "não deve restar seletor data-theme=dark");
assert.ok(sw.includes('"ui-utils.js"'), "service worker não inclui ui-utils.js");
assert.ok(sw.includes("treg-pwa-v4"), "cache do service worker não foi versionado");
assert.ok(plugin.includes("version: 1.8.0b1"), "plugin.yaml sem a versão 1.8.0b1");
assert.ok(manifest.includes('"version": "1.8.0b1"'), "manifest do painel sem a versão 1.8.0b1");
assert.ok(panel.includes("1.8.0b1"), "aba do painel não exibe a versão 1.8.0b1");
assert.ok(app.includes("pageUrl: location.href"), "camada de API sem URL base da página");
assert.ok(app.includes("copyMessage"), "ação de copiar mensagem ausente");
assert.ok(app.includes("copy-msg"), "botão de copiar mensagem ausente");
assert.ok(app.includes("groupMessages"), "separadores de data ausentes");
assert.ok(app.includes("versionLabel"), "identificação da versão ausente");
assert.ok(html.includes("treg-pwa-theme"), "chave de tema exclusiva ausente");
assert.ok(app.includes("api.searchHistory"), "busca remota não usa a camada de API");
assert.ok(app.includes("api.stopRun"), "parada de execução não usa a camada de API");
assert.ok(app.includes("mergeSessions"), "paginação não reutiliza a mesclagem");
assert.ok(!/\bfetch\s*\(/.test(app), "app.js não deve chamar fetch diretamente");

const btnSearchIndex = listHeaderActions.indexOf('id="btn-search"');
const btnHeaderMenuIndex = listHeaderActions.indexOf('id="btn-header-menu"');
assert.ok(btnSearchIndex >= 0, "o cabeçalho deve ter o atalho de busca");
assert.ok(btnSearchIndex < btnHeaderMenuIndex, "a lupa deve ficar entre o avatar e o menu");
assert.ok(listHeaderActions.includes('aria-controls="search-row"'), "a lupa deve apontar para a busca");
assert.ok(listHeaderActions.includes('aria-expanded="false"'), "a lupa deve iniciar recolhida");
assert.ok(html.includes('id="search-row"'), "deve existir a linha de busca");
assert.ok(/id="search-row"[^>]*class="search hidden"/.test(html), "a busca deve começar oculta");
assert.ok(html.indexOf('id="search-row"') < html.indexOf('<div class="agentbar">'), "a busca deve abrir logo abaixo do cabeçalho");
assert.ok(app.includes('$("btn-search").addEventListener("click"'), "a lupa deve alternar a busca");
assert.ok(app.includes("function openSearch"), "a busca deve ter abertura implementada");
assert.ok(app.includes("function closeSearch"), "a busca deve ter fechamento implementado");
assert.ok(app.includes("mergeSearchSessions"), "a busca deve mesclar resultados locais e remotos");
assert.ok(app.includes("localSearch(q)"), "a busca deve sempre considerar os títulos locais");
assert.ok(app.includes("updateSession(s.id, { title: saved })"), "renomear deve atualizar lista e resultados de busca");

assert.ok(app.includes('var btn = $("btn-scroll-bottom")'), "a seta deve depender do botão acessível");
assert.equal((html.match(/id="btn-scroll-bottom"/g) || []).length, 1, "deve haver exatamente uma seta de rolagem");
assert.ok(html.includes('aria-label="Ir para a última mensagem"'), "a seta deve ter nome acessível");
assert.ok(html.indexOf('id="btn-scroll-bottom"') > html.indexOf('id="messages"'), "a seta deve ficar dentro da área da conversa");
assert.ok(html.indexOf('id="btn-scroll-bottom"') < html.indexOf('id="composer"'), "a seta não deve ficar depois do composer");
assert.ok(/\.messages-wrap\s*\{[^}]*position:\s*relative/.test(css), "a área da conversa deve conter a seta");
assert.ok(/\.scroll-bottom\s*\{[^}]*position:\s*absolute/.test(css), "a seta deve flutuar na conversa");
assert.ok(!/\.scroll-bottom\s*\{[^}]*position:\s*fixed/.test(css), "a seta não deve ser fixa ao viewport");
assert.ok(app.includes('$("btn-scroll-bottom").addEventListener("click"'), "a seta deve rolar até o fim");
assert.ok(app.includes("function updateScrollButton"), "a seta deve aparecer/sumir conforme a rolagem");
assert.ok(app.includes('addEventListener("scroll", updateScrollButton'), "a seta deve acompanhar a rolagem manual");

assert.ok(app.includes("function makeVoice"), "cada áudio deve ter renderização própria");
assert.ok(app.includes("voice-menu-btn"), "cada áudio deve ter menu de três pontos");
assert.ok(app.includes("Mostrar transcrição"), "o menu deve oferecer Mostrar transcrição");
assert.ok(app.includes("Ocultar transcrição"), "o menu deve oferecer Ocultar transcrição");
assert.ok(app.includes("Transcrição indisponível"), "áudio sem transcrição deve informar indisponibilidade");
assert.ok(css.includes(".hidden { display: none !important; }"), "a transcrição deve começar oculta");
assert.ok(/\.voice-menu\s*\{/.test(css), "o menu do áudio deve ter estilo próprio");
assert.ok(!app.includes("if (!state.streaming) send();"), "o microfone não deve enviar automaticamente");
assert.ok(app.includes("function stopRecording"), "a gravação deve ter encerramento explícito");
assert.ok(app.includes("function updateComposerState"), "o composer deve refletir gravação e envio");
assert.ok(app.includes("removePendingSend"), "falha de upload deve desfazer a mensagem otimista");

console.log("PASS ui-contract: shell, menu, API layer e service worker");
