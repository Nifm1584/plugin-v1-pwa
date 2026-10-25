"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "dashboard", "pwa", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "dashboard", "pwa", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "dashboard", "pwa", "app.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "dashboard", "pwa", "sw.js"), "utf8");
const plugin = fs.readFileSync(path.join(root, "plugin.yaml"), "utf8");
const manifest = fs.readFileSync(path.join(root, "dashboard", "manifest.json"), "utf8");
const panel = fs.readFileSync(path.join(root, "dashboard", "dist", "index.js"), "utf8");

const requiredIds = [
  "net-banner", "list-status", "list-skeleton", "list-foot", "btn-more", "btn-new",
  "btn-stop", "chat-status", "btn-rec-cancel", "search", "sessions", "messages",
  "chat-avatar", "app-version"
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
assert.ok(!/\.list-actions\s*\{[^}]*position\s*:\s*(fixed|absolute)/.test(css), "list-actions não deve sobrepor a lista");

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
assert.ok(html.includes('data-theme-choice="auto"'), "opções de tema ausentes");
assert.ok(sw.includes('"ui-utils.js"'), "service worker não inclui ui-utils.js");
assert.ok(sw.includes("treg-pwa-v3"), "cache do service worker não foi versionado");
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

console.log("PASS ui-contract: shell, menu, API layer e service worker");
