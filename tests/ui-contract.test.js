"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "dashboard", "pwa", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "dashboard", "pwa", "app.js"), "utf8");
const sw = fs.readFileSync(path.join(root, "dashboard", "pwa", "sw.js"), "utf8");

const requiredIds = [
  "net-banner", "list-status", "list-skeleton", "list-foot", "btn-more",
  "btn-stop", "chat-status", "btn-rec-cancel", "search", "sessions", "messages"
];

for (const id of requiredIds) {
  assert.ok(html.includes('id="' + id + '"'), "elemento ausente: #" + id);
}

assert.ok(html.indexOf("hermes-api.js") < html.indexOf("app.js"), "hermes-api.js deve carregar antes de app.js");
assert.ok(html.includes('data-act="pin"'), "ação de fixar ausente no menu");
assert.ok(sw.includes('"hermes-api.js"'), "service worker não inclui hermes-api.js");
assert.ok(app.includes("pageUrl: location.href"), "camada de API sem URL base da página");
assert.ok(app.includes("api.searchHistory"), "busca remota não usa a camada de API");
assert.ok(app.includes("api.stopRun"), "parada de execução não usa a camada de API");
assert.ok(app.includes("mergeSessions"), "paginação não reutiliza a mesclagem");
assert.ok(!/\bfetch\s*\(/.test(app), "app.js não deve chamar fetch diretamente");

console.log("PASS ui-contract: shell, menu, API layer e service worker");
