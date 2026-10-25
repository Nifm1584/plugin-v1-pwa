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
  assert.equal(ui.normalizeTheme("light"), "light");
  assert.equal(ui.normalizeTheme("black"), "black");
  assert.equal(ui.normalizeTheme("dark"), "black");
  assert.equal(ui.normalizeTheme("invalido"), "auto");
  assert.equal(ui.resolveTheme("auto", { matches: true }), "auto-dark");
  assert.equal(ui.resolveTheme("auto", { matches: false }), "auto-light");
  assert.equal(ui.resolveTheme("light", { matches: true }), "light");
  assert.equal(ui.resolveTheme("black", { matches: false }), "black");
  assert.equal(ui.themeColor("auto-dark"), "#0f2f31");
  assert.equal(ui.themeColor("auto-light"), "#ffffff");
  assert.equal(ui.themeColor("black"), "#000000");
  assert.equal(ui.themeColor("light"), "#ffffff");
  assert.equal(ui.themeColor("dark"), "#0f2f31");
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

async function testAvatarPhotoHelpers() {
  assert.ok(ui.AVATAR_TYPES.includes("image/jpeg"));
  assert.ok(ui.AVATAR_TYPES.includes("image/png"));
  assert.ok(ui.AVATAR_TYPES.includes("image/webp"));
  assert.equal(ui.validateAvatarFile({ type: "image/jpeg", size: 1024 }), "");
  assert.equal(ui.validateAvatarFile({ type: "image/png", size: 1024 }), "");
  assert.equal(ui.validateAvatarFile({ type: "image/webp", size: 1024 }), "");
  assert.match(ui.validateAvatarFile(null), /Selecione/);
  assert.match(ui.validateAvatarFile({ type: "image/svg+xml", size: 100 }), /JPEG, PNG ou WebP/);
  assert.match(ui.validateAvatarFile({ type: "text/plain", size: 100 }), /JPEG, PNG ou WebP/);
  assert.match(ui.validateAvatarFile({ type: "image/jpeg", size: 0 }), /vazio/);
  assert.match(ui.validateAvatarFile({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 }), /10 MB/);
  assert.deepEqual(ui.fitAvatarDimensions(1000, 500, 512), { width: 512, height: 256 });
  assert.deepEqual(ui.fitAvatarDimensions(500, 1000, 512), { width: 256, height: 512 });
  assert.deepEqual(ui.fitAvatarDimensions(200, 100, 512), { width: 200, height: 100 });
  assert.equal(ui.fitAvatarDimensions(0, 100, 512), null);
  await assert.rejects(ui.prepareAvatarBlob({ type: "image/svg+xml", size: 100 }), /JPEG, PNG ou WebP/);
}

async function main() {
  await testCopy();
  testVersionAndTheme();
  testAvatarAndDates();
  await testAvatarPhotoHelpers();
  console.log("PASS ui-utils: copia, tema, versao, avatares, foto e datas");
}

main().catch(function (error) {
  console.error("FAIL ui-utils:", error && error.stack || error);
  process.exitCode = 1;
});
