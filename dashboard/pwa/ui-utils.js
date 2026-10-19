(function (root, factory) {
  "use strict";
  var ui = factory();
  if (typeof module === "object" && module.exports) module.exports = ui;
  if (root) root.TregUi = ui;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = "1.8.0b1";
  var PHASE = "Fase 5B";
  var NAME = "TREG";
  var THEME_KEY = "treg-pwa-theme";

  function normalizeTheme(value) {
    return value === "light" || value === "dark" ? value : "auto";
  }

  function resolveTheme(preference, media) {
    var pref = normalizeTheme(preference);
    if (pref === "auto") return media && media.matches ? "dark" : "light";
    return pref;
  }

  function themeColor(theme) {
    return resolveTheme(theme) === "dark" || theme === "dark" ? "#0f2f31" : "#ffffff";
  }

  function versionLabel() {
    return NAME + " · " + PHASE + " · " + VERSION;
  }

  function avatarInitial(title, fallback) {
    var words = String(title == null ? "" : title).trim().split(/\s+/).filter(Boolean);
    var value = words.length
      ? words.slice(0, 2).map(function (word) { return word.charAt(0); }).join("")
      : String(fallback == null ? "?" : fallback).charAt(0);
    return value.toUpperCase().slice(0, 2) || "?";
  }

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function asDate(timestamp) {
    if (timestamp === null || timestamp === undefined || timestamp === "") return null;
    var date = timestamp instanceof Date ? timestamp : new Date(Number(timestamp) * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  function dayKey(timestamp) {
    var date = asDate(timestamp);
    if (!date) return "";
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function dayLabel(timestamp, now) {
    var date = asDate(timestamp);
    if (!date) return "";
    var current = now ? asDate(now) : new Date();
    if (!current) current = new Date();
    var currentKey = dayKey(current.getTime() / 1000);
    var key = dayKey(timestamp);
    if (key === currentKey) return "Hoje";
    var yesterday = new Date(current.getTime());
    yesterday.setDate(yesterday.getDate() - 1);
    if (key === dayKey(yesterday.getTime() / 1000)) return "Ontem";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }

  function groupMessages(messages, now) {
    var groups = [];
    var lastKey = null;
    (messages || []).forEach(function (message) {
      var key = dayKey(message && message.timestamp);
      if (!groups.length || key !== lastKey) {
        groups.push({ key: key, label: key ? dayLabel(message.timestamp, now) : "", messages: [] });
        lastKey = key;
      }
      groups[groups.length - 1].messages.push(message);
    });
    return groups;
  }

  function legacyCopy(text, doc) {
    return new Promise(function (resolve, reject) {
      if (!doc || !doc.body || !doc.createElement || typeof doc.execCommand !== "function") {
        reject(new Error("Clipboard indisponível"));
        return;
      }
      var area = doc.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      area.style.pointerEvents = "none";
      doc.body.appendChild(area);
      area.focus();
      area.select();
      var ok = false;
      try { ok = doc.execCommand("copy"); } catch (error) { ok = false; }
      doc.body.removeChild(area);
      if (ok) resolve();
      else reject(new Error("Não foi possível copiar"));
    });
  }

  function copyText(text, options) {
    var value = String(text == null ? "" : text);
    if (!value.trim()) return Promise.reject(new Error("Mensagem sem texto"));
    var opts = options || {};
    var clipboard = opts.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      return Promise.resolve().then(function () { return clipboard.writeText(value); })
        .catch(function (error) {
          if (opts.document) return legacyCopy(value, opts.document);
          throw error;
        });
    }
    if (opts.document) return legacyCopy(value, opts.document);
    return Promise.reject(new Error("Clipboard indisponível"));
  }

  return {
    VERSION: VERSION,
    PHASE: PHASE,
    NAME: NAME,
    THEME_KEY: THEME_KEY,
    avatarInitial: avatarInitial,
    copyText: copyText,
    dayKey: dayKey,
    dayLabel: dayLabel,
    groupMessages: groupMessages,
    normalizeTheme: normalizeTheme,
    resolveTheme: resolveTheme,
    themeColor: themeColor,
    versionLabel: versionLabel
  };
});
