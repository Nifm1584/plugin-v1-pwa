"use strict";

const assert = require("node:assert/strict");
const ui = require("../dashboard/pwa/ui-utils.js");

function fakeDocument(ok) {
  const calls = [];
  const doc = {
    body: {
      appendChild: function (node) { calls.push(["append", node.value]); },
      removeChild: function (node) { calls.push(["remove", node.value]); }
    },
    createElement: function () {
      return {
        style: {},
        value: "",
        setAttribute: function () {},
        focus: function () {},
        select: function () {}
      };
    },
    execCommand: function (command) { calls.push(["exec", command]); return ok; }
  };
  return { doc: doc, calls: calls };
}

async function testCopy() {
  let copied = "";
  await ui.copyText("texto puro", {
    clipboard: { writeText: function (text) { copied = text; return Promise.resolve(); } }
  });
  assert.equal(copied, "texto puro");

  let fallbackText = "";
  await ui.copyText("fallback", {
    clipboard: { writeText: function () { return Promise.reject(new Error("negado")); } },
    document: {
      body: { appendChild: function (node) { fallbackText = node.value; }, removeChild: function () {} },
      createElement: function () { return { style: {}, setAttribute: function () {}, focus: function () {}, select: function () {} }; },
      execCommand: function () { return true; }
    }
  });
  assert.equal(fallbackText, "fallback");

  const fake = fakeDocument(true);
  await ui.copyText("legado", { document: fake.doc });
  assert.deepEqual(fake.calls[0], ["append", "legado"]);
  assert.deepEqual(fake.calls[1], ["exec", "copy"]);

  await assert.rejects(ui.copyText("", { clipboard: { writeText: function () {} } }));
}

function testVersionAndTheme() {
  assert.equal(ui.VERSION, "1.8.0b1");
  assert.equal(ui.versionLabel(), "TREG · Fase 5B · 1.8.0b1");
  assert.equal(ui.normalizeTheme("dark"), "dark");
  assert.equal(ui.normalizeTheme("invalido"), "auto");
  assert.equal(ui.resolveTheme("auto", { matches: true }), "dark");
  assert.equal(ui.resolveTheme("auto", { matches: false }), "light");
  assert.equal(ui.resolveTheme("light", { matches: true }), "light");
  assert.equal(ui.themeColor("dark"), "#0f2f31");
  assert.equal(ui.themeColor("light"), "#ffffff");
}

function testAvatarAndDates() {
  assert.equal(ui.avatarInitial("Saudação amigável", "A"), "SA");
  assert.equal(ui.avatarInitial("", "telegram"), "T");
  assert.equal(ui.avatarInitial("", ""), "?");

  const today = new Date(2026, 9, 18, 12, 0, 0);
  const yesterday = new Date(2026, 9, 17, 12, 0, 0);
  assert.match(ui.dayKey(today.getTime() / 1000), /^2026-10-18$/);
  assert.equal(ui.dayLabel(today.getTime() / 1000, today), "Hoje");
  assert.equal(ui.dayLabel(yesterday.getTime() / 1000, today), "Ontem");

  const groups = ui.groupMessages([
    { id: 1, timestamp: yesterday.getTime() / 1000 },
    { id: 2, timestamp: today.getTime() / 1000 },
    { id: 3, timestamp: null }
  ], today);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].label, "Ontem");
  assert.equal(groups[1].label, "Hoje");
  assert.equal(groups[2].key, "");
  assert.equal(groups[2].label, "");
}

async function main() {
  await testCopy();
  testVersionAndTheme();
  testAvatarAndDates();
  console.log("PASS ui-utils: copia, tema, versao, avatares e datas");
}

main().catch(function (error) {
  console.error("FAIL ui-utils:", error && error.stack || error);
  process.exitCode = 1;
});
