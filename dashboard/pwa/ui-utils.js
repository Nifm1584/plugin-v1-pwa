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
  var AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
  var AVATAR_MAX_BYTES = 10 * 1024 * 1024;
  var AVATAR_MAX_SIDE = 512;
  var AVATAR_DB = "treg-pwa-avatar";
  var AVATAR_STORE = "media";
  var AVATAR_KEY = "profile";

  function normalizeTheme(value) {
    if (value === "light" || value === "black") return value;
    if (value === "dark") return "black";
    return "auto";
  }

  function resolveTheme(preference, media) {
    var pref = normalizeTheme(preference);
    if (pref === "auto") return media && media.matches ? "auto-dark" : "auto-light";
    return pref;
  }

  function themeColor(theme) {
    if (theme === "black") return "#000000";
    if (theme === "auto-dark" || theme === "dark") return "#0f2f31";
    return "#ffffff";
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

  function validateAvatarFile(file) {
    if (!file) return "Selecione uma imagem JPEG, PNG ou WebP.";
    if (!file.size) return "O arquivo de imagem está vazio.";
    if (file.size > AVATAR_MAX_BYTES) return "A imagem deve ter no máximo 10 MB.";
    var type = String(file.type || "").toLowerCase();
    if (AVATAR_TYPES.indexOf(type) < 0) {
      return "Use uma imagem JPEG, PNG ou WebP. SVG e outros formatos não são aceitos.";
    }
    return "";
  }

  function fitAvatarDimensions(width, height, maxSide) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    var max = Number(maxSide) || AVATAR_MAX_SIDE;
    if (w <= 0 || h <= 0 || max <= 0) return null;
    var scale = Math.min(1, max / Math.max(w, h));
    return {
      width: Math.max(1, Math.round(w * scale)),
      height: Math.max(1, Math.round(h * scale))
    };
  }

  function openAvatarDb() {
    if (typeof indexedDB === "undefined" || !indexedDB) {
      return Promise.reject(new Error("Armazenamento local indisponível neste navegador."));
    }
    return new Promise(function (resolve, reject) {
      var request;
      try {
        request = indexedDB.open(AVATAR_DB, 1);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(AVATAR_STORE)) {
          db.createObjectStore(AVATAR_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Falha ao abrir o armazenamento local.")); };
      request.onblocked = function () { reject(new Error("O armazenamento local está bloqueado por outra aba.")); };
    });
  }

  function getAvatarBlob() {
    return openAvatarDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(AVATAR_STORE, "readonly");
        var request = tx.objectStore(AVATAR_STORE).get(AVATAR_KEY);
        request.onsuccess = function () {
          var record = request.result;
          resolve(record && record.blob ? record.blob : null);
        };
        request.onerror = function () { reject(request.error || new Error("Falha ao ler a foto.")); };
        tx.oncomplete = function () { db.close(); };
        tx.onerror = function () { db.close(); };
      });
    });
  }

  function saveAvatarBlob(blob) {
    if (!blob) return Promise.reject(new Error("Imagem inválida."));
    return openAvatarDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(AVATAR_STORE, "readwrite");
        tx.objectStore(AVATAR_STORE).put({ key: AVATAR_KEY, blob: blob, updatedAt: Date.now() });
        tx.oncomplete = function () { db.close(); resolve(blob); };
        tx.onerror = function () { db.close(); reject(tx.error || new Error("Falha ao salvar a foto.")); };
        tx.onabort = function () { db.close(); reject(tx.error || new Error("Gravação da foto cancelada.")); };
      });
    });
  }

  function deleteAvatarBlob() {
    return openAvatarDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(AVATAR_STORE, "readwrite");
        tx.objectStore(AVATAR_STORE).delete(AVATAR_KEY);
        tx.oncomplete = function () { db.close(); resolve(); };
        tx.onerror = function () { db.close(); reject(tx.error || new Error("Falha ao remover a foto.")); };
        tx.onabort = function () { db.close(); reject(tx.error || new Error("Remoção da foto cancelada.")); };
      });
    });
  }

  function encodeAvatar(canvas) {
    return new Promise(function (resolve, reject) {
      if (!canvas || typeof canvas.toBlob !== "function") {
        reject(new Error("Não foi possível processar a imagem neste navegador."));
        return;
      }
      canvas.toBlob(function (blob) {
        if (blob) { resolve(blob); return; }
        canvas.toBlob(function (jpeg) {
          if (jpeg) resolve(jpeg);
          else reject(new Error("Não foi possível processar a imagem."));
        }, "image/jpeg", 0.86);
      }, "image/webp", 0.86);
    });
  }

  function prepareAvatarBlob(file) {
    var validation = validateAvatarFile(file);
    if (validation) return Promise.reject(new Error(validation));
    if (typeof document === "undefined") {
      return Promise.reject(new Error("Processamento de imagem indisponível."));
    }
    return new Promise(function (resolve, reject) {
      var source = null;
      var objectUrl = null;
      function finishSource() {
        if (source && typeof source.close === "function") source.close();
        if (objectUrl && typeof URL !== "undefined" && URL.revokeObjectURL) URL.revokeObjectURL(objectUrl);
      }
      function fail(error) {
        finishSource();
        reject(error instanceof Error ? error : new Error("Não foi possível ler a imagem."));
      }
      function encode(width, height) {
        var dimensions = fitAvatarDimensions(width, height, AVATAR_MAX_SIDE);
        if (!dimensions) { fail(new Error("A imagem não tem dimensões válidas.")); return; }
        var canvas = document.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        var context = canvas.getContext("2d");
        if (!context) { fail(new Error("Não foi possível processar a imagem.")); return; }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(source, 0, 0, dimensions.width, dimensions.height);
        encodeAvatar(canvas).then(function (blob) {
          finishSource();
          resolve(blob);
        }, fail);
      }
      function useImage(image) {
        source = image;
        encode(image.width || image.naturalWidth || 0, image.height || image.naturalHeight || 0);
      }
      function useFallback() {
        if (typeof Image !== "function" || typeof URL === "undefined" || !URL.createObjectURL) {
          fail(new Error("Não foi possível ler a imagem neste navegador."));
          return;
        }
        objectUrl = URL.createObjectURL(file);
        var image = new Image();
        image.onload = function () { useImage(image); };
        image.onerror = function () { fail(new Error("Não foi possível ler a imagem.")); };
        image.src = objectUrl;
      }
      if (typeof createImageBitmap === "function") {
        createImageBitmap(file, { imageOrientation: "from-image" })
          .then(useImage)
          .catch(function () { useFallback(); });
      } else {
        useFallback();
      }
    });
  }

  return {
    VERSION: VERSION,
    PHASE: PHASE,
    NAME: NAME,
    THEME_KEY: THEME_KEY,
    AVATAR_TYPES: AVATAR_TYPES,
    AVATAR_MAX_BYTES: AVATAR_MAX_BYTES,
    AVATAR_MAX_SIDE: AVATAR_MAX_SIDE,
    avatarInitial: avatarInitial,
    copyText: copyText,
    dayKey: dayKey,
    dayLabel: dayLabel,
    deleteAvatarBlob: deleteAvatarBlob,
    fitAvatarDimensions: fitAvatarDimensions,
    getAvatarBlob: getAvatarBlob,
    groupMessages: groupMessages,
    normalizeTheme: normalizeTheme,
    prepareAvatarBlob: prepareAvatarBlob,
    resolveTheme: resolveTheme,
    saveAvatarBlob: saveAvatarBlob,
    themeColor: themeColor,
    validateAvatarFile: validateAvatarFile,
    versionLabel: versionLabel
  };
});
