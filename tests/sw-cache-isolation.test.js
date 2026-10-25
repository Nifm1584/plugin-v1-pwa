"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const swSource = fs.readFileSync(path.join(root, "dashboard", "pwa", "sw.js"), "utf8");

const handlers = {};
const deleted = [];
let claimed = false;
const cacheKeys = [
  "treg-pwa-v5",
  "treg-pwa-v4",
  "treg-pwa-v3",
  "treg-pwa-v2",
  "treg-pwa-v1",
  "hermes-pwa-v12",
  "hermes-pwa-v11",
  "other-app-cache-v9",
  "workbox-precache-v2"
];

const caches = {
  keys: function () { return Promise.resolve(cacheKeys.slice()); },
  delete: function (key) { deleted.push(key); return Promise.resolve(true); },
  open: function () { return Promise.resolve({ addAll: function () { return Promise.resolve(); }, put: function () { return Promise.resolve(); } }); },
  match: function () { return Promise.resolve(null); }
};

const self = {
  location: {
    href: "https://hermes.example/api/plugins/treg-pwa/sw.js",
    origin: "https://hermes.example"
  },
  clients: {
    claim: function () { claimed = true; return Promise.resolve(); }
  },
  skipWaiting: function () { return Promise.resolve(); },
  addEventListener: function (type, handler) { handlers[type] = handler; }
};

const context = {
  self: self,
  caches: caches,
  URL: URL,
  Request: function Request() {},
  fetch: function () { return Promise.resolve({}); },
  console: console
};

vm.createContext(context);
vm.runInContext(swSource, context, { filename: "dashboard/pwa/sw.js" });

assert.equal(typeof handlers.activate, "function", "o service worker deve registrar o evento activate");
assert.equal(typeof handlers.install, "function", "o service worker deve manter o evento install");

let activation = null;
handlers.activate({
  waitUntil: function (promise) { activation = promise; }
});

assert.ok(activation && typeof activation.then === "function", "activate deve usar event.waitUntil");
activation.then(function () {
  assert.equal(claimed, true, "o service worker deve assumir os clientes após a limpeza");

  const removed = deleted.slice().sort();
  assert.deepEqual(
    removed,
    ["treg-pwa-v1", "treg-pwa-v2", "treg-pwa-v3", "treg-pwa-v4"],
    "somente caches antigos do namespace treg-pwa- devem ser removidos"
  );

  assert.equal(deleted.includes("treg-pwa-v5"), false, "o cache atual treg-pwa-v5 deve permanecer");
  assert.equal(deleted.includes("hermes-pwa-v12"), false, "o cache do plugin original deve permanecer");
  assert.equal(deleted.includes("hermes-pwa-v11"), false, "outros caches do plugin original devem permanecer");
  assert.equal(deleted.includes("other-app-cache-v9"), false, "caches de outras aplicações devem permanecer");
  assert.equal(deleted.includes("workbox-precache-v2"), false, "caches de terceiros devem permanecer");
  assert.ok(deleted.every(function (key) { return key.startsWith("treg-pwa-"); }), "a limpeza deve ser restrita ao namespace TREG");

  console.log("PASS service-worker: caches antigos TREG removidos; cache atual e caches externos preservados");
}).catch(function (error) {
  console.error("FAIL service-worker:", error && error.stack || error);
  process.exitCode = 1;
});
