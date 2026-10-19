"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "dashboard", "pwa", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "dashboard", "pwa", "app.js"), "utf8");
const sw = fs.readFileSync(path.join(root, "dashboard", "pwa", "sw.js"), "utf8");
const plugin = fs.readFileSync(path.join(root, "plugin.yaml"), "utf8");
const manifest = fs.readFileSync(path.join(root, "dashboard", "manifest.json"), "utf8");
const panel = fs.readFileSync(path.join(root, "dashboard", "dist", "index.js"), "utf8");

const requiredIds = [
  "net-banner", "list-status", "list-skeleton", "list-foot", "btn-more",
  "btn-stop", "chat-status", "btn-rec-cancel", "search", "sessions", "messages",
  "chat-avatar", "app-version"
];

for (const id of requiredIds) {
  assert.ok(html.includes('id="' + id + '"'), "elemento ausente: #" + id);
}

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
