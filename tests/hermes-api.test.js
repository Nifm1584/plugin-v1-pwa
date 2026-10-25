"use strict";

const assert = require("node:assert/strict");
const TregApi = require("../dashboard/pwa/hermes-api.js");

function response(body, status) {
  return {
    ok: (status || 200) < 400,
    status: status || 200,
    text: function () { return Promise.resolve(JSON.stringify(body)); }
  };
}

let calls = [];
function mockFetch(resolver) {
  return function (url, init) {
    calls.push({ url: url, init: init });
    return Promise.resolve(resolver(url, init, calls.length));
  };
}

async function testSessionsAndPagination() {
  calls = [];
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function (url, init, n) {
      if (n === 1) return response({ data: [{ id: "s1", title: "Um", preview: "a", pinned: true }], has_more: true });
      return response({ data: [{ id: "s2", title: "Dois", preview: "b" }, { id: "s1", title: "Um atualizado" }], has_more: false });
    })
  });
  const first = await api.getSessions({ limit: 80, offset: 0 });
  assert.equal(first.items.length, 1);
  assert.equal(first.hasMore, true);
  assert.match(calls[0].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/sessions\?limit=80/);
  const second = await api.getSessions({ limit: 80, offset: 80, profile: "work" });
  assert.equal(second.hasMore, false);
  assert.match(calls[1].url, /offset=80/);
  assert.match(calls[1].url, /profile=work/);
  const merged = TregApi.mergeSessions(first.items, second.items);
  assert.deepEqual(merged.map(function (s) { return s.id; }), ["s1", "s2"]);
  assert.equal(merged[0].title, "Um atualizado");
}

async function testSearchAndFallbackSignal() {
  calls = [];
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function (url) {
      if (url.indexOf("missing") >= 0) return response({ detail: "Not found" }, 404);
      return response({ results: [{ session_id: "s9", title: "Achado", snippet: "trecho", source: "telegram" }] });
    })
  });
  const found = await api.searchHistory("termo", { profile: "work", limit: 20 });
  assert.equal(found.items.length, 1);
  assert.equal(found.items[0].id, "s9");
  assert.equal(found.items[0].snippet, "trecho");
  assert.match(calls[0].url, /^https:\/\/treg\.example\/api\/sessions\/search\?/);
  assert.match(calls[0].url, /q=termo/);
  assert.match(calls[0].url, /profile=work/);

  await assert.rejects(
    api.searchHistory("missing"),
    function (error) { return error && error.code === "not_found" && error.status === 404; }
  );
}

function testSearchMergeAndTitlePersistence() {
  const local = [
    { id: "s1", profile: "work", title: "Nome renomeado", preview: "prévia local", last_active: 20 },
    { id: "s3", profile: "work", title: "Só local", preview: "local", last_active: 10 }
  ];
  const remote = [
    { id: "s1", session_id: "s1", title: "Nome antigo", snippet: "trecho remoto", last_active: 30 },
    { id: "s2", session_id: "s2", title: "Só remota", snippet: "remoto" }
  ];
  const merged = TregApi.mergeSearchSessions(local, remote, "work");
  assert.deepEqual(merged.map(function (s) { return s.id; }), ["s1", "s3", "s2"]);
  assert.equal(merged[0].title, "Nome renomeado", "o título local renomeado deve prevalecer");
  assert.equal(merged[0].snippet, "trecho remoto", "o trecho remoto deve ser preservado");
  assert.equal(merged[0].profile, "work");
  assert.equal(merged[0].search, true);
  assert.equal(merged[1].title, "Só local");
  assert.equal(merged[2].title, "Só remota");
  assert.equal(merged[2].profile, "work");
  assert.equal(merged.length, 3, "não deve duplicar sessões");

  const preserved = TregApi.mergeSessions(
    [{ id: "s4", title: "Nome salvo", preview: "antiga" }],
    [{ id: "s4", title: "", preview: "nova" }]
  );
  assert.equal(preserved[0].title, "Nome salvo", "título local não deve ser apagado por resposta vazia");
  assert.equal(preserved[0].preview, "nova");
}

async function testMutationsAndCapabilities() {
  calls = [];
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function (url, init) {
      if (url.indexOf("/capabilities") >= 0) {
        return response({ gateway: { features: { run_stop: false, session_chat: true } }, plugin: { session_pin: true } });
      }
      return response({ ok: true });
    })
  });
  await api.patchSession("s1", { pinned: true }, "work");
  assert.equal(calls[0].init.method, "PATCH");
  assert.equal(calls[0].init.body, JSON.stringify({ pinned: true }));
  assert.match(calls[0].url, /profile=work/);

  await api.createRun("s1", "Olá", "work");
  assert.equal(calls[1].init.method, "POST");
  assert.equal(calls[1].init.body, JSON.stringify({ message: "Olá" }));
  assert.match(calls[1].url, /sessions\/s1\/runs/);

  await api.stopRun("run_1", "work");
  assert.equal(calls[2].init.method, "POST");
  assert.match(calls[2].url, /runs\/run_1\/stop/);

  const caps = await api.getCapabilities("work");
  assert.equal(TregApi.feature(caps, "run_stop"), false);
  assert.equal(TregApi.feature(caps, "session_chat"), true);
  assert.equal(TregApi.feature(caps, "unknown_feature"), null);
}

async function testCreateSession() {
  calls = [];
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function () { return response({ ok: true }); })
  });

  await api.createSession("Nova conversa", "work");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.body, JSON.stringify({ title: "Nova conversa" }));
  assert.match(calls[0].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/sessions\?profile=work$/);

  await api.createSession(null);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].init.method, "POST");
  assert.equal(calls[1].init.body, JSON.stringify({ title: null }));
  assert.match(calls[1].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/sessions$/);
}

async function testLegacyCapabilitiesAndAuth() {
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function (url) {
      if (url.indexOf("/sessions") >= 0) return response({ detail: "unauthorized" }, 401);
      return response({ gateway: null, gateway_error: { status: 404 } });
    })
  });
  const caps = await api.getCapabilities();
  assert.equal(caps.unavailable, true);
  assert.equal(TregApi.feature(caps, "run_stop"), null);
  await assert.rejects(
    api.getSessions({ limit: 80 }),
    function (error) { return error && error.code === "auth" && error.status === 401; }
  );
}

async function testResolvedPaths() {
  calls = [];
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function (url) {
      if (url.indexOf("/messages") >= 0) return response({ data: [] });
      if (url.indexOf("/runs") >= 0) return response({ run_id: "run_1" });
      if (url.indexOf("/search") >= 0) return response({ results: [] });
      if (url.indexOf("/transcribe") >= 0) return response({ transcript: "" });
      if (url.indexOf("/password-login") >= 0) return response({ ok: true });
      return response({ data: [], has_more: false });
    })
  });
  await api.getSessions({ limit: 80 });
  await api.getMessages("s1");
  await api.createRun("s1", "Olá");
  await api.runEvents("run_1");
  await api.searchHistory("termo");
  await api.transcribe({ data_url: "data:audio/webm;base64,AA==", mime_type: "audio/webm" });
  await api.login({ provider: "basic", username: "u", password: "p" });

  assert.match(calls[0].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/sessions\?limit=80$/);
  assert.match(calls[1].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/sessions\/s1\/messages$/);
  assert.match(calls[2].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/sessions\/s1\/runs$/);
  assert.match(calls[3].url, /^https:\/\/treg\.example\/api\/plugins\/treg-pwa\/api\/runs\/run_1\/events$/);
  assert.match(calls[4].url, /^https:\/\/treg\.example\/api\/sessions\/search\?q=termo/);
  assert.match(calls[5].url, /^https:\/\/treg\.example\/api\/audio\/transcribe$/);
  assert.match(calls[6].url, /^https:\/\/treg\.example\/auth\/password-login$/);
}

async function testEventStream() {
  calls = [];
  const streamResponse = { ok: true, status: 200, body: {} };
  const api = TregApi.create({
    base: "api/",
    origin: "https://treg.example",
    pageUrl: "https://treg.example/api/plugins/treg-pwa/",
    fetch: mockFetch(function () { return streamResponse; })
  });
  const result = await api.runEvents("run_1", "work");
  assert.equal(result, streamResponse);
  assert.match(calls[0].url, /runs\/run_1\/events\?profile=work/);
  assert.equal(calls[0].init.headers.Accept, "text/event-stream");
}

async function main() {
  await testSessionsAndPagination();
  await testSearchAndFallbackSignal();
  testSearchMergeAndTitlePersistence();
  await testMutationsAndCapabilities();
  await testCreateSession();
  await testLegacyCapabilitiesAndAuth();
  await testResolvedPaths();
  await testEventStream();
  console.log("PASS hermes-api: paginação, busca, criação, pin, stop, SSE, capabilities e auth");
}

main().catch(function (error) {
  console.error("FAIL hermes-api:", error && error.stack || error);
  process.exitCode = 1;
});
