/* treg-pwa (versão independente do hermes-pwa) — app móvel do Hermes. Vanilla JS, sem build. */
(function () {
  "use strict";
  var API = "api/";            // relativo a /api/plugins/treg-pwa/
  var $ = function (id) { return document.getElementById(id); };
  var ui = window.TregUi;
  var api = window.TregApi && window.TregApi.create({ base: API, origin: location.origin, pageUrl: location.href, timeout: 30000 });
  var themeMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var state = { sessions: [], sessionsOffset: 0, sessionsHasMore: false, sessionsLoading: false, sessionsError: null, searchResults: null, searchQuery: "", searchLoading: false, searchError: null, searchAvailable: true, searchSeq: 0, capabilities: null, current: null, messages: [], messagesLoading: false, messagesError: null, streaming: false, filter: "", pollList: null, pollMsgs: null, model: {}, attachments: [], recorder: null, recChunks: [], recTimer: null, recStart: 0, recCancel: false, profile: "default", profiles: [], multiplex: false, runCtx: null, themePref: "auto" };

  // ───────────────────────── util
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(msg, ms) { var t = $("toast"); t.textContent = msg; t.classList.remove("hidden"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.add("hidden"); }, ms || 2600); }
  function fmtTime(ts) {
    if (!ts) return ""; var d = new Date(ts * 1000), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    var y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  function sourceLabel(s) { return ({ whatsapp: "WhatsApp", telegram: "Telegram", discord: "Discord", slack: "Slack", tui: "Terminal", cli: "Terminal", api_server: "App", dashboard: "Painel", desktop: "Desktop", cron: "Cron", hermes_browser: "Browser" })[s] || (s || "?"); }
  function initial(s) { return sourceLabel(s).charAt(0).toUpperCase(); }
  function sessionTitle(s) { return (s.title && s.title.trim()) || (s.preview && s.preview.trim().split("\n")[0].slice(0, 48)) || s.id; }
  function shortModel(m) { return (m || "").replace(/^.*\//, ""); }
  function avatarLabel(s) { return ui ? ui.avatarInitial(sessionTitle(s), sourceLabel(s.source)) : initial(s.source); }

  function markTheme(pref) {
    Array.prototype.forEach.call($("settings").querySelectorAll("[data-theme-choice]"), function (button) {
      var current = button.getAttribute("data-theme-choice") === pref;
      button.classList.toggle("current", current);
      button.setAttribute("aria-pressed", current ? "true" : "false");
    });
  }
  function applyTheme(preference, persist) {
    var pref = ui ? ui.normalizeTheme(preference) : "auto";
    var resolved = ui ? ui.resolveTheme(pref, themeMedia) : (themeMedia.matches ? "dark" : "light");
    state.themePref = pref;
    document.documentElement.setAttribute("data-theme", resolved);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && ui) meta.setAttribute("content", ui.themeColor(resolved));
    markTheme(pref);
    if (persist) {
      try { localStorage.setItem(ui.THEME_KEY, pref); } catch (error) { }
    }
  }
  function initTheme() {
    var stored = "auto";
    try { stored = ui ? localStorage.getItem(ui.THEME_KEY) : "auto"; } catch (error) { }
    applyTheme(stored || "auto", false);
    var onThemeChange = function () {
      if (state.themePref === "auto") applyTheme("auto", false);
    };
    if (themeMedia.addEventListener) themeMedia.addEventListener("change", onThemeChange);
    else if (themeMedia.addListener) themeMedia.addListener(onThemeChange);
  }
  function copyMessage(text) {
    if (!ui || !String(text || "").trim()) return;
    ui.copyText(text, { clipboard: navigator.clipboard, document: document })
      .then(function () { toast("Mensagem copiada"); })
      .catch(function () { toast("Não foi possível copiar a mensagem"); });
  }

  // markdown-lite seguro: escapa tudo, depois aplica blocos de código, inline code, negrito, itálico, links, listas e parágrafos
  function md(text) {
    var t = esc(text);
    var blocks = [];
    t = t.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, function (_, lang, code) { blocks.push("<pre><code>" + code.replace(/\n$/, "") + "</code></pre>"); return "@@BLOCK" + (blocks.length - 1) + "@@"; });
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
    t = t.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
    var lines = t.split("\n"), out = [], inList = null;
    lines.forEach(function (ln) {
      var m = ln.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
      if (m) { var kind = /\d/.test(m[1]) ? "ol" : "ul"; if (inList !== kind) { if (inList) out.push("</" + inList + ">"); out.push("<" + kind + ">"); inList = kind; } out.push("<li>" + m[2] + "</li>"); return; }
      if (inList) { out.push("</" + inList + ">"); inList = null; }
      if (/^@@BLOCK\d+@@$/.test(ln.trim())) { out.push(ln.trim()); return; }
      if (ln.trim() === "") return;
      out.push("<p>" + ln.replace(/^#{1,6}\s+/, "") + "</p>");
    });
    if (inList) out.push("</" + inList + ">");
    return out.join("").replace(/@@BLOCK(\d+)@@/g, function (_, i) { return blocks[+i]; });
  }

  // ───────────────────────── rede
  function pq(path, profile) {  // acrescenta ?profile= quando não for o default
    var prof = profile || state.profile;
    if (!prof || prof === "default") return path;
    return path + (path.indexOf("?") >= 0 ? "&" : "?") + "profile=" + encodeURIComponent(prof);
  }
  function callApi(promise) {
    return promise.catch(function (e) {
      if (e && (e.code === "auth" || e.status === 401 || e.status === 403)) { showLogin(); throw new Error("login"); }
      throw e;
    });
  }
  function req(path, opts) {
    if (!api) return Promise.reject(new Error("Camada de API indisponível"));
    return callApi(api.request(path, opts));
  }

  // ───────────────────────── login embutido (sessão do dashboard expirada)
  function showLogin() { $("login").classList.remove("hidden"); }
  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault(); $("login-err").textContent = "";
    if (!api) { $("login-err").textContent = "Camada de API indisponível"; return; }
    api.login({ provider: "basic", username: $("login-user").value.trim(), password: $("login-pass").value, next: location.pathname })
      .then(function () { $("login").classList.add("hidden"); boot(); })
      .catch(function (x) { $("login-err").textContent = (x && (x.detail || x.message)) || "Usuário ou senha inválidos"; });
  });


  // ───────────────────────── diálogos próprios (sem prompt/confirm do navegador)
  function dialog(opts) {
    return new Promise(function (resolve) {
      var m = $("modal"), inp = $("modal-input"), txt = $("modal-text");
      $("modal-title").textContent = opts.title || "";
      if (opts.text) { txt.textContent = opts.text; txt.classList.remove("hidden"); } else { txt.classList.add("hidden"); }
      if (opts.input === false) { inp.classList.add("hidden"); } else { inp.classList.remove("hidden"); inp.value = opts.value || ""; inp.placeholder = opts.placeholder || ""; }
      $("modal-ok").textContent = opts.ok || "OK"; $("modal-ok").className = "btn " + (opts.danger ? "danger" : "primary");
      m.classList.remove("hidden");
      if (opts.input !== false) setTimeout(function () { inp.focus(); inp.select(); }, 30);
      function done(v) { m.classList.remove("hidden"); m.classList.add("hidden"); $("modal-form").onsubmit = null; $("modal-cancel").onclick = null; m.onclick = null; resolve(v); }
      $("modal-form").onsubmit = function (e) { e.preventDefault(); done(opts.input === false ? true : inp.value); };
      $("modal-cancel").onclick = function () { done(null); };
      m.onclick = function (e) { if (e.target === m) done(null); };
    });
  }
  function ask(title, value, placeholder, ok) { return dialog({ title: title, value: value, placeholder: placeholder, ok: ok || "Salvar" }); }
  function confirmDlg(title, text, ok) { return dialog({ title: title, text: text, input: false, ok: ok || "Confirmar", danger: true }).then(function (v) { return v === true; }); }

  // ───────────────────────── lista de sessões
  function setListStatus(text, retry) {
    var el = $("list-status"); el.innerHTML = "";
    if (!text) { el.classList.add("hidden"); return; }
    var span = document.createElement("span"); span.textContent = text; el.appendChild(span);
    if (retry) {
      var btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Tentar novamente";
      btn.addEventListener("click", retry); el.appendChild(btn);
    }
    el.classList.remove("hidden");
  }
  function localSearch(q) {
    var needle = String(q || "").toLowerCase();
    return state.sessions.filter(function (s) { return !s.hidden && !s.archived; })
      .filter(function (s) { return (sessionTitle(s) + " " + (s.preview || "") + " " + sourceLabel(s.source)).toLowerCase().indexOf(needle) >= 0; })
      .map(function (s) { return Object.assign({}, s, { search: true, snippet: s.preview || "", preview: s.preview || "" }); });
  }
  function sessionListItems() {
    var q = state.searchQuery.trim();
    var searching = q.length >= 2;
    if (searching) return (state.searchResults || []).filter(function (s) { return !s.archived; });
    var f = q.toLowerCase();
    return state.sessions.filter(function (s) { return !s.hidden && !s.archived; })
      .filter(function (s) { return !f || (sessionTitle(s) + " " + (s.preview || "") + " " + sourceLabel(s.source)).toLowerCase().indexOf(f) >= 0; })
      .sort(function (a, b) { return ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || ((b.last_active || b.started_at || 0) - (a.last_active || a.started_at || 0)); });
  }
  function renderSessions() {
    var ul = $("sessions");
    var keepScroll = ul.scrollTop;
    ul.innerHTML = "";
    var q = state.searchQuery.trim();
    var searching = q.length >= 2;
    var items = sessionListItems();
    var loading = searching ? state.searchLoading : state.sessionsLoading;
    $("list-skeleton").classList.toggle("hidden", !loading || items.length > 0);
    var hasError = searching ? !!state.searchError : !!state.sessionsError;
    $("list-empty").classList.toggle("hidden", items.length > 0 || loading || hasError);
    $("list-empty").textContent = searching ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda. Use o botão + abaixo para começar.";
    $("list-foot").classList.toggle("hidden", searching || loading || !state.sessionsHasMore);
    $("btn-more").disabled = state.sessionsLoading;
    $("btn-more").textContent = state.sessionsLoading ? "Carregando…" : "Carregar mais";
    if (loading) setListStatus(searching ? "Buscando no histórico…" : "Carregando conversas…");
    else if (searching && state.searchError) setListStatus(state.searchError, function () { performSearch(q); });
    else if (!searching && state.sessionsError) setListStatus(state.sessionsError, function () { loadSessions(false, true); });
    else if (searching && !state.searchAvailable) setListStatus("Busca no histórico indisponível; mostrando resultados das conversas carregadas.");
    else setListStatus("");
    items.forEach(function (s) {
      var li = document.createElement("li");
      if (state.current && state.current.id === s.id) li.className = "active";
      var preview = (s.search ? (s.snippet || s.preview || "") : (s.preview || "")).replace(/\s+/g, " ").slice(0, 100);
      li.innerHTML = '<div class="avatar ' + esc(s.source || "") + '">' + esc(avatarLabel(s)) + '</div>' +
        '<div class="s-main"><div class="s-title">' + (s.pinned ? "📌 " : "") + esc(sessionTitle(s)) + '</div><div class="s-prev">' + esc(preview || "sem mensagens") + '</div></div>' +
        '<div class="s-meta"><span>' + esc(fmtTime(s.last_active || s.started_at)) + '</span><span class="badge">' + esc(s.search ? "Busca" : sourceLabel(s.source)) + '</span></div>';
      var more = document.createElement("button"); more.type = "button"; more.className = "more"; more.setAttribute("aria-label", "Opções"); more.innerHTML = "&#8943;";
      more.addEventListener("click", function (e) { e.stopPropagation(); openSheet(s); });
      li.querySelector(".s-meta").appendChild(more);
      li.addEventListener("click", function () { openSession(s); });
      ul.appendChild(li);
    });
    ul.scrollTop = keepScroll;
  }
  function loadSessions(silent, reset) {
    if (!api) return Promise.resolve();
    if (state.sessionsLoading) return Promise.resolve();
    if (reset !== false) { state.sessions = []; state.sessionsOffset = 0; state.sessionsHasMore = false; }
    var prof = state.profile;
    var offset = state.sessionsOffset;
    state.sessionsLoading = true; state.sessionsError = null;
    if (!silent) renderSessions();
    return api.getSessions({ limit: 80, offset: offset, profile: prof }).then(function (d) {
      if (prof !== state.profile) return;
      var items = d.items.map(function (item) { item.profile = prof; return item; });
      state.sessions = window.TregApi.mergeSessions(state.sessions, items);
      state.sessionsOffset = offset + 80;
      state.sessionsHasMore = !!d.hasMore && d.items.length > 0;
    }).catch(function (e) {
      if (e.code === "auth" || e.status === 401 || e.status === 403) { showLogin(); return; }
      state.sessionsError = "Não foi possível carregar as conversas. " + (e.message || "Tente novamente.");
      if (!silent) toast("Erro ao listar: " + e.message);
    }).then(function () {
      state.sessionsLoading = false;
      if (state.current && state.current.profile === prof && !state.streaming && !state.messagesLoading) loadMessages(true);
      renderSessions();
    });
  }
  function loadMore() {
    if (state.sessionsLoading || !state.sessionsHasMore || state.searchQuery.trim().length >= 2) return;
    var pending = loadSessions(true, false);
    renderSessions();
    return pending;
  }
  $("btn-more").addEventListener("click", loadMore);
  function performSearch(q) {
    q = String(q || "").trim();
    if (q.length < 2) { state.searchResults = null; state.searchError = null; state.searchLoading = false; renderSessions(); return; }
    if (!state.searchAvailable) {
      state.searchResults = localSearch(q); state.searchLoading = false;
      state.searchError = null; renderSessions(); return;
    }
    var seq = ++state.searchSeq;
    state.searchLoading = true; state.searchError = null; renderSessions();
    api.searchHistory(q, { profile: state.profile, limit: 50 }).then(function (d) {
      if (seq !== state.searchSeq) return;
      state.searchResults = window.TregApi.mergeSessions([], d.items); state.searchAvailable = true;
    }).catch(function (e) {
      if (seq !== state.searchSeq) return;
      if (e.code === "auth" || e.status === 401 || e.status === 403) { showLogin(); return; }
      state.searchResults = localSearch(q);
      if (e.code === "not_found" || e.code === "unsupported") {
        state.searchAvailable = false;
        state.searchError = "Busca no histórico indisponível nesta versão do Hermes.";
      } else {
        state.searchError = "Falha na busca no histórico: " + (e.message || "tente novamente") + ".";
      }
    }).then(function () {
      if (seq !== state.searchSeq) return;
      state.searchLoading = false; renderSessions();
    });
  }
  var searchTimer = null;
  $("search").addEventListener("input", function (e) {
    state.searchQuery = e.target.value;
    state.searchResults = null; state.searchError = null; state.searchSeq += 1;
    $("sessions").scrollTop = 0;
    clearTimeout(searchTimer);
    if (state.searchQuery.trim().length < 2) {
      state.searchLoading = false; state.filter = state.searchQuery; renderSessions(); return;
    }
    state.searchLoading = true; renderSessions();
    searchTimer = setTimeout(function () { performSearch(state.searchQuery); }, 350);
  });
  $("btn-refresh").addEventListener("click", function () { loadSessions(false, true).then(function () { toast("Atualizado"); }); });

  // menu geral do cabeçalho da lista
  var headerMenu = $("header-menu");
  var headerMenuBtn = $("btn-header-menu");
  function headerMenuItems() {
    return Array.prototype.slice.call(headerMenu.querySelectorAll('[role="menuitem"]'));
  }
  function openHeaderMenu(focusLast) {
    headerMenu.classList.remove("hidden");
    headerMenuBtn.setAttribute("aria-expanded", "true");
    var items = headerMenuItems();
    if (items.length) items[focusLast ? items.length - 1 : 0].focus();
  }
  function closeHeaderMenu(returnFocus) {
    if (headerMenu.classList.contains("hidden")) return;
    headerMenu.classList.add("hidden");
    headerMenuBtn.setAttribute("aria-expanded", "false");
    if (returnFocus) headerMenuBtn.focus();
  }
  headerMenuBtn.addEventListener("click", function () {
    if (headerMenu.classList.contains("hidden")) openHeaderMenu(false);
    else closeHeaderMenu(true);
  });
  headerMenuBtn.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openHeaderMenu(e.key === "ArrowUp");
    }
  });
  headerMenu.addEventListener("keydown", function (e) {
    var items = headerMenuItems();
    var index = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(index + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(index - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); closeHeaderMenu(true); }
  });
  headerMenu.addEventListener("click", function () { closeHeaderMenu(true); });
  headerMenu.addEventListener("focusout", function () {
    setTimeout(function () {
      if (headerMenu.classList.contains("hidden")) return;
      if (headerMenu.contains(document.activeElement) || document.activeElement === headerMenuBtn) return;
      closeHeaderMenu(false);
    }, 0);
  });
  document.addEventListener("click", function (e) {
    if (headerMenu.classList.contains("hidden")) return;
    if (headerMenu.contains(e.target) || headerMenuBtn.contains(e.target)) return;
    closeHeaderMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !headerMenu.classList.contains("hidden")) {
      e.preventDefault();
      closeHeaderMenu(true);
    }
  });

  $("btn-new").addEventListener("click", function () {
    ask("Nova conversa", "", "Nome (opcional)", "Criar").then(function (title) {
      if (title === null) return;
      req(pq("sessions"), { method: "POST", body: { title: title.trim() || null } }).then(function (d) {
        var s = (d && (d.session || d.data)) || d; s = window.TregApi.normalizeSession(s); s.profile = state.profile;
        state.sessions = window.TregApi.mergeSessions(state.sessions, [s]); renderSessions(); openSession(s);
      }).catch(function (e) { toast("Não criou: " + e.message); });
    });
  });

  // ───────────────────────── chat
  function renderChatStatus() {
    var el = $("chat-status");
    var text = state.messagesLoading ? "Carregando mensagens…" : "";
    if (state.messagesError) text = state.messagesError;
    else if (!text && state.current && !state.messages.length) text = "Nenhuma mensagem ainda. Envie a primeira.";
    el.innerHTML = "";
    if (!text) { el.classList.add("hidden"); return; }
    var span = document.createElement("span"); span.textContent = text; el.appendChild(span);
    if (state.messagesError) {
      var retry = document.createElement("button"); retry.type = "button"; retry.textContent = "Tentar novamente";
      retry.addEventListener("click", function () { loadMessages(); }); el.appendChild(retry);
    }
    el.classList.remove("hidden");
  }
  function openSession(s) {
    state.current = s; state.messages = []; state.messagesLoading = true; state.messagesError = null;
    var chatAvatar = $("chat-avatar");
    if (chatAvatar) { chatAvatar.className = "avatar chat-avatar " + (s.source || ""); chatAvatar.textContent = avatarLabel(s); }
    $("chat-title").textContent = sessionTitle(s);
    $("chat-sub").textContent = (s.profile && s.profile !== "default" ? "Agente " + s.profile + " · " : "") + sourceLabel(s.source) + (s.model ? " · " + shortModel(s.model) : (function () { var pr = state.profiles.filter(function (x) { return x.name === (s.profile || "default"); })[0]; var m = (pr && pr.model) || state.model.default; return m ? " · " + shortModel(m) : ""; })());
    $("messages").innerHTML = ""; renderChatStatus(); updateStopButton();
    $("chat").classList.remove("hidden"); $("list").classList.add("hidden");
    renderSessions();
    var lm = loadMessages();
    if (lm && lm.then) lm.then(resumePendingRun); else resumePendingRun();
    clearInterval(state.pollMsgs); state.pollMsgs = setInterval(function () { if (!state.streaming && state.current) loadMessages(true); }, 12000);
    setTimeout(function () { $("input").focus(); scrollBottom(); }, 80);
  }
  function closeSession() {
    state.current = null; clearInterval(state.pollMsgs);
    state.messagesLoading = false; state.messagesError = null; renderChatStatus(); updateStopButton();
    $("chat").classList.add("hidden"); $("list").classList.remove("hidden"); renderSessions();
  }
  $("btn-back").addEventListener("click", closeSession);
  function loadMessages(silent) {
    if (!state.current) return Promise.resolve();
    var id = state.current.id;
    var seq = (state.messagesSeq || 0) + 1; state.messagesSeq = seq;
    if (!silent) { state.messagesLoading = true; state.messagesError = null; renderChatStatus(); }
    return api.getMessages(id, state.current.profile).then(function (data) {
      if (seq !== state.messagesSeq || !state.current || state.current.id !== id) return;
      var list = (data || []).filter(function (m) { return (m.role === "user" || m.role === "assistant") && m.content && String(m.content).trim(); });
      var last = function (a) { return a.length ? a[a.length - 1].id : null; };
      var changed = list.length !== state.messages.length || last(list) !== last(state.messages);
      state.messages = list;
      if (changed || !silent) renderMessages();
    }).catch(function (e) {
      if (seq !== state.messagesSeq) return;
      if (e.code === "auth" || e.status === 401 || e.status === 403) { showLogin(); return; }
      state.messagesError = "Não foi possível carregar as mensagens. " + (e.message || "Tente novamente.");
      if (!silent) toast("Erro ao carregar: " + e.message);
    }).then(function () {
      if (seq !== state.messagesSeq) return;
      state.messagesLoading = false; renderChatStatus();
    });
  }

  // Blocos que o app coloca no texto da mensagem (o agente lê tudo como texto):
  //   🎤 Áudio (12s): /opt/data/home/uploads/xxx.webm
  //   Transcrição: ...
  //   📎 Arquivo: /opt/data/home/uploads/yyy.pdf (nome, 1.2 MB)
  function parseUserText(text) {
    var out = { voices: [], files: [], text: "" }, rest = [];
    var lines = (text || "").split("\n"), i = 0;
    while (i < lines.length) {
      var ln = lines[i];
      var mv = ln.match(/^🎤 Áudio(?: \((\d+)s\))?: (\S+)\s*$/);
      if (mv) {
        var v = { src: "api/uploads/" + encodeURIComponent(mv[2].split("/").pop()), transcript: "", note: "" }; i++;
        if (i < lines.length && /^Transcrição: /.test(lines[i])) { v.transcript = lines[i].replace(/^Transcrição: /, ""); i++; while (i < lines.length && lines[i] && !/^(🎤|📎|Transcrição:)/.test(lines[i]) && v.transcript && !/^Arquivos anexados/.test(lines[i])) { v.transcript += "\n" + lines[i]; i++; } }
        else if (i < lines.length && /^\(sem transcrição/.test(lines[i])) { v.note = lines[i]; i++; }
        out.voices.push(v); continue;
      }
      var mf = ln.match(/^📎 Arquivo: (\S+) \((.*)\)\s*$/);
      if (mf) {
        var fname = mf[2].split(",")[0].trim();
        var base = mf[1].split(/[\\/]/).pop();
        out.files.push({ name: fname || base, size: (mf[2].split(",")[1] || "").trim(), path: mf[1], url: "api/uploads/" + encodeURIComponent(base) });
        i++; continue;
      }
      if (/^Arquivos anexados pelo usuário/.test(ln) || /^- \/.*uploads\//.test(ln) || /^\(Os arquivos ficam em/.test(ln)) { i++; continue; }
      rest.push(ln); i++;
    }
    out.text = rest.join("\n").trim();
    return out;
  }
  function contentText(c) {
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.filter(function (p) { return p && p.type === "text"; }).map(function (p) { return p.text || ""; }).join("\n");
    return c == null ? "" : String(c);
  }
  function contentImages(c) {
    if (!Array.isArray(c)) return [];
    return c.filter(function (p) { return p && p.type === "image_url" && p.image_url && p.image_url.url; }).map(function (p) { return p.image_url.url; });
  }
    function addCopyAction(div, text) {
    var existing = div.querySelector(".msg-actions");
    if (existing) existing.remove();
    if (!String(text || "").trim()) return;
    var actions = document.createElement("div"); actions.className = "msg-actions";
    var copy = document.createElement("button"); copy.type = "button"; copy.className = "copy-msg";
    copy.title = "Copiar mensagem"; copy.setAttribute("aria-label", "Copiar mensagem");
    copy.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    copy.addEventListener("click", function (event) { event.stopPropagation(); copyMessage(text); });
    actions.appendChild(copy); div.appendChild(actions);
  }
  function bubble(m) {
    var div = document.createElement("div");
    div.className = "msg " + (m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system") + (m.error ? " error" : "");
    var imgs = (m.images || contentImages(m.content));
    var html = "";
    if (imgs.length) html += '<div class="imgs">' + imgs.map(function (u) { return '<img src="' + esc(u) + '" alt="imagem">'; }).join("") + "</div>";
    var text = contentText(m.content);
    var copyable = "";
    if (m.role === "user") {
      var parsed = parseUserText(text);
      copyable = parsed.text || "";
      parsed.voices.forEach(function (v) {
        html += '<div class="voice"><audio controls preload="metadata" src="' + esc(v.src) + '"></audio>' +
          (v.transcript ? '<div class="transcript"><span class="tlabel">Transcrição</span>' + esc(v.transcript).replace(/\n/g, "<br>") + '</div>' : '<div class="transcript co-muted">' + esc(v.note || "sem transcrição") + '</div>') + '</div>';
      });
      if (parsed.files.length) html += '<div class="files">' + parsed.files.map(function (f) {
        return '<a class="file-link" href="' + esc(f.url) + '" download="' + esc(f.name) + '" target="_blank" rel="noreferrer"><span>📎</span><span>' + esc(f.name) + '</span><small>' + esc(f.size || "") + '</small></a>';
      }).join("") + "</div>";
      if (parsed.text) html += "<p>" + esc(parsed.text).replace(/\n/g, "<br>") + "</p>";
    } else {
      copyable = text;
      if (text) html += md(text);
    }
    if (m.timestamp) html += '<span class="time">' + esc(fmtTime(m.timestamp)) + "</span>";
    div.innerHTML = html;
    div.querySelectorAll(".imgs img").forEach(function (im) { im.addEventListener("click", function () { lightbox(im.src); }); });
    if (m.role !== "system") addCopyAction(div, copyable);
    return div;
  }
  function lightbox(src) {
    var lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = '<img src="' + esc(src) + '">';
    lb.addEventListener("click", function () { lb.remove(); }); document.body.appendChild(lb);
  }
  function nearBottom() {
    var box = $("messages");
    return box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }
  function renderMessages() {
    var box = $("messages");
    var stick = nearBottom();
    box.innerHTML = "";
    var groups = ui ? ui.groupMessages(state.messages) : [{ key: "", label: "", messages: state.messages }];
    groups.forEach(function (group) {
      if (group.key) {
        var separator = document.createElement("div");
        separator.className = "day-sep";
        separator.setAttribute("role", "separator");
        separator.textContent = group.label;
        box.appendChild(separator);
      }
      group.messages.forEach(function (message) { box.appendChild(bubble(message)); });
    });
    if (stick) scrollBottom();
  }
  function scrollBottom() { var box = $("messages"); box.scrollTop = box.scrollHeight; }
  // Pedido de aprovação de comando: o agente fica pausado até a pessoa escolher.
  var APPROVAL_LABELS = { once: "Permitir uma vez", session: "Permitir nesta conversa", always: "Permitir sempre", deny: "Negar" };
  var APPROVAL_DONE = { once: "Permitido uma vez", session: "Permitido nesta conversa", always: "Permitido sempre", deny: "Negado" };
  function approvalCard(d, sid) {
    var prof = state.current && state.current.profile;
    var box = document.createElement("div"); box.className = "msg assistant approval"; box.setAttribute("role", "group");
    var choices = (d.choices && d.choices.length) ? d.choices : ["once", "deny"];
    box.innerHTML = '<div class="ap-title">O agente pede autorização para executar:</div>' +
      '<pre class="ap-cmd">' + esc(d.command || "(comando não informado)") + '</pre>' +
      (d.description ? '<div class="ap-why">Motivo do alerta: ' + esc(d.description) + '</div>' : '') +
      '<div class="ap-actions"></div><div class="ap-status" aria-live="polite"></div>';
    var actions = box.querySelector(".ap-actions"), status = box.querySelector(".ap-status"), settled = false;
    function lock(text, cls) { settled = true; actions.remove(); status.textContent = text; status.className = "ap-status " + (cls || ""); }
    choices.forEach(function (c) {
      if (!APPROVAL_LABELS[c]) return;
      var b = document.createElement("button"); b.type = "button"; b.textContent = APPROVAL_LABELS[c];
      b.className = "ap-btn" + (c === "deny" ? " deny" : (c === "once" ? " primary" : ""));
      b.onclick = function () {
        if (settled) return;
        Array.prototype.forEach.call(actions.querySelectorAll("button"), function (x) { x.disabled = true; });
        status.textContent = "enviando…";
        callApi(api.approval(d.run_id, { choice: c, request_id: d.request_id || null }, prof))
          .then(function () { lock(APPROVAL_DONE[c], c === "deny" ? "denied" : "ok"); setTyping(true, c === "deny" ? "pensando…" : "executando…"); })
          .catch(function (e) {
            if (settled) return;
            status.textContent = "Não foi possível enviar: " + (e.code === "conflict" ? "o pedido já expirou" : e.message);
            status.className = "ap-status denied";
            Array.prototype.forEach.call(actions.querySelectorAll("button"), function (x) { x.disabled = false; });
          });
      };
      actions.appendChild(b);
    });
    $("messages").appendChild(box); scrollBottom();
    return { expire: function () { if (!settled) lock("Pedido encerrado sem resposta.", "denied"); } };
  }

  function setTyping(on, text) { $("typing").classList.toggle("hidden", !on); if (text) $("typing-text").textContent = text; }
  function updateStopButton() {
    var btn = $("btn-stop");
    var supported = !state.capabilities || window.TregApi.feature(state.capabilities, "run_stop") !== false;
    var sameSession = !!(state.current && state.runCtx && state.current.id === state.runCtx.sid);
    btn.classList.toggle("hidden", !supported || !state.streaming || !sameSession || !state.runCtx.runId);
    btn.disabled = !!(state.runCtx && state.runCtx.stopping);
  }
  function stopCurrentRun() {
    var ctx = state.runCtx;
    if (!ctx || !ctx.runId) { toast("A execução ainda não começou"); return; }
    if (ctx.stopping) return;
    ctx.stopping = true; updateStopButton(); setTyping(true, "parando…");
    api.stopRun(ctx.runId, ctx.profile).then(function () {
      toast("Pedido de parada enviado");
    }).catch(function (e) {
      ctx.stopping = false;
      if (e.code === "auth" || e.status === 401 || e.status === 403) { showLogin(); updateStopButton(); return; }
      if (e.code === "not_found" || e.code === "unsupported") {
        state.capabilities = state.capabilities || {};
        state.capabilities.features = state.capabilities.features || {};
        state.capabilities.features.run_stop = false;
        $("btn-stop").classList.add("hidden");
        toast("Parar execução não está disponível neste Hermes");
      } else {
        toast("Não foi possível parar: " + e.message);
      }
      updateStopButton();
    });
  }
  $("btn-stop").addEventListener("click", stopCurrentRun);

  var input = $("input");
  input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("composer").requestSubmit(); } });
  $("composer").addEventListener("submit", function (e) { e.preventDefault(); send(); });

  function send() {
    var text = input.value.trim();
    var atts = state.attachments.slice();
    if ((!text && !atts.length) || state.streaming || !state.current) return;
    // /new e /reset: no PWA cada conversa tem o proprio id, entao o comando do gateway
    // nao troca a conversa aberta. Cria uma nova aqui, como no Telegram.
    var mNew = !atts.length && /^\/(new|reset)(?:\s+(.*))?$/i.exec(text);
    if (mNew) {
      input.value = ""; input.style.height = "auto";
      var newTitle = (mNew[2] || "").trim() || null;
      req(pq("sessions"), { method: "POST", body: { title: newTitle } }).then(function (d) {
        var s = (d && (d.session || d.data)) || d; s = window.TregApi.normalizeSession(s); s.profile = state.profile;
        state.sessions = window.TregApi.mergeSessions(state.sessions, [s]); renderSessions(); openSession(s);
        toast("Nova conversa criada");
      }).catch(function (e) { toast("Não criou: " + e.message); });
      return;
    }
    if (atts.some(function (a) { return a.kind === "image" && !a.url; })) { toast("Aguarde o processamento da imagem"); return; }
    input.value = ""; input.style.height = "auto"; state.attachments = []; renderTray();
    var sid = state.current.id;
    var images = atts.filter(function (a) { return a.kind === "image"; }).map(function (a) { return a.url; });
    var audios = atts.filter(function (a) { return a.kind === "audio"; });
    var files = atts.filter(function (a) { return a.kind === "file"; });

    // bolha local imediata (player com blob local enquanto sobe)
    var localLines = [];
    audios.forEach(function (a) { a.localUrl = URL.createObjectURL(a.file); });
    var userMsg = { role: "user", content: text, images: images, timestamp: Date.now() / 1000 };
    var el = bubble(userMsg);
    if (audios.length || files.length) {
      var extra = "";
      audios.forEach(function (a) { extra += '<div class="voice"><audio controls preload="metadata" src="' + esc(a.localUrl) + '"></audio><div class="transcript co-muted">transcrevendo…</div></div>'; });
      if (files.length) extra += '<div class="files">' + files.map(function (f) { return "📎 " + esc(f.name + ", " + fmtSize(f.size)); }).join("<br>") + "</div>";
      el.insertAdjacentHTML("afterbegin", extra);
    }
    state.messages.push(userMsg); $("messages").appendChild(el); renderChatStatus(); scrollBottom();
    var bot = { role: "assistant", content: "", timestamp: null }; var botEl = null;
    state.streaming = true; $("btn-send").disabled = true; setTyping(true, (audios.length || files.length) ? "enviando anexos…" : "pensando…");

    var prep = Promise.all([
      Promise.all(audios.map(function (a) {
        return Promise.all([uploadAttachment(a), transcribe(a.file, a.mime || a.file.type).catch(function () { return ""; })]).then(function (r) { return { up: r[0], transcript: (r[1] || "").trim(), att: a }; });
      })),
      Promise.all(files.map(uploadAttachment))
    ]).then(function (r) {
      var voices = r[0], ups = r[1];
      var body = text;
      voices.forEach(function (v, k) {
        var dur = (v.att.name.match(/audio-(\d+)s/) || [])[1];
        body += (body ? "\n" : "") + "🎤 Áudio" + (dur ? " (" + dur + "s)" : "") + ": " + v.up.path + "\n" + (v.transcript ? "Transcrição: " + v.transcript : "(sem transcrição disponível; é uma mensagem de voz, transcreva se possível)");
        var t = el.querySelectorAll(".voice .transcript")[k];
        if (t) { t.className = "transcript" + (v.transcript ? "" : " co-muted"); t.innerHTML = v.transcript ? '<span class="tlabel">Transcrição</span>' + esc(v.transcript) : "sem transcrição"; }
      });
      ups.forEach(function (u) { body += (body ? "\n" : "") + "📎 Arquivo: " + u.path + " (" + u.name + ", " + fmtSize(u.size) + ")"; });
      if (ups.length) body += "\n(Os arquivos ficam em ~/uploads; leia com suas ferramentas de arquivo.)";
      userMsg.content = body;
      if (!images.length) return body || "Veja os anexos.";
      var parts = [{ type: "text", text: body || (images.length > 1 ? "Veja as imagens anexadas." : "Veja a imagem anexada.") }];
      images.forEach(function (u) { parts.push({ type: "image_url", image_url: { url: u } }); });
      return parts;
    });
    var ctx = { sid: sid, profile: state.current && state.current.profile, text: text, bot: bot, botEl: botEl, approvals: [], approvalsSeen: {}, runId: null, finished: false };
    prep.then(function (message) {
      setTyping(true, "pensando…");
      // Execução em segundo plano: o agente continua no servidor mesmo se o celular suspender o app.
      return callApi(api.createRun(sid, message, ctx.profile));
    })
      .then(function (r) {
        ctx.runId = r.run_id; state.runCtx = ctx; updateStopButton();
        savePendingRun({ sid: sid, profile: ctx.profile, run_id: r.run_id, text: text, started: Date.now() });
        return streamRun(ctx);
      })
      .catch(function (e) {
        if (!state.attachments.length && atts.length) { state.attachments = atts; renderTray(); }
        if (!input.value && text) { input.value = text; input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; }
        if (e.message !== "login") { $("messages").appendChild(bubble({ role: "assistant", content: "Falha: " + e.message, error: true })); scrollBottom(); }
        finishRun(ctx);
      });
  }

  // ───────────────────────── execução em segundo plano (acompanhar, retomar, concluir)
  var RUN_KEY = "treg-pwa-run";
  function savePendingRun(o) { try { if (o) localStorage.setItem(RUN_KEY, JSON.stringify(o)); else localStorage.removeItem(RUN_KEY); } catch (e) { } }
  function pendingRun() { try { return JSON.parse(localStorage.getItem(RUN_KEY) || "null"); } catch (e) { return null; } }
  var TERMINAL = { "run.completed": 1, "run.failed": 1, "run.cancelled": 1, "run.interrupted": 1 };

  function runEvent(ctx, ev, d) {
    if (ctx.finished) return;
    var bot = ctx.bot;
    if (ev === "message.delta" || ev === "assistant.delta") {
      bot.content += d.delta || "";
      if (!ctx.botEl) { ctx.botEl = bubble(bot); $("messages").appendChild(ctx.botEl); }
      ctx.botEl.innerHTML = md(bot.content); addCopyAction(ctx.botEl, bot.content); scrollBottom(); setTyping(true, "escrevendo…");
    } else if (ev === "approval.request") {
      var approvalKey = d.request_id || d.prompt_id || d.run_id || String(Date.now());
      if (!ctx.approvalsSeen) ctx.approvalsSeen = {};
      if (ctx.approvalsSeen[approvalKey]) return;
      ctx.approvalsSeen[approvalKey] = true;
      ctx.approvals.push(approvalCard(d, ctx.sid)); setTyping(true, "aguardando sua aprovação…");
    } else if (ev === "tool.started" || ev === "tool.progress") {
      var tn = d.tool_name || d.name || ""; setTyping(true, tn === "_thinking" ? "pensando…" : (tn ? "usando " + tn + "…" : "trabalhando…"));
    } else if (ev === "run.completed" || ev === "assistant.completed") {
      ctx.approvals.forEach(function (c) { c.expire(); });
      var out = d.output !== undefined ? d.output : d.content;
      if (out) bot.content = out;
      bot.timestamp = Date.now() / 1000;
      if (!ctx.botEl) { ctx.botEl = bubble(bot); $("messages").appendChild(ctx.botEl); }
      ctx.botEl.innerHTML = md(bot.content) + '<span class="time">' + esc(fmtTime(bot.timestamp)) + "</span>"; addCopyAction(ctx.botEl, bot.content); scrollBottom();
      finishRun(ctx);
    } else if (ev === "run.failed" || ev === "error") {
      ctx.approvals.forEach(function (c) { c.expire(); });
      var msg = d.error || (d.message && (d.message.detail || d.message)) || "erro";
      $("messages").appendChild(bubble({ role: "assistant", content: typeof msg === "string" ? msg : JSON.stringify(msg), error: true })); scrollBottom();
      finishRun(ctx);
    } else if (ev === "run.cancelled" || ev === "run.interrupted") {
      ctx.approvals.forEach(function (c) { c.expire(); });
      $("messages").appendChild(bubble({ role: "system", content: "Execução interrompida." })); scrollBottom();
      finishRun(ctx);
    }
  }

  function streamRun(ctx) {
    return api.runEvents(ctx.runId, ctx.profile)
      .then(function (r) {
        if (!r.body) return r.text().then(function (t) { throw new Error(t.slice(0, 200) || ("HTTP " + r.status)); });
        var reader = r.body.getReader(), dec = new TextDecoder(), buf = "";
        function pump() {
          return reader.read().then(function (x) {
            if (x.done) return;
            buf += dec.decode(x.value, { stream: true });
            var parts = buf.split("\n\n"); buf = parts.pop();
            parts.forEach(function (chunk) {
              var ev = "message", data = "";
              chunk.split("\n").forEach(function (ln) { if (ln.indexOf("event:") === 0) ev = ln.slice(6).trim(); else if (ln.indexOf("data:") === 0) data += ln.slice(5).trim(); });
              if (data) { var d = {}; try { d = JSON.parse(data); } catch (e) { } runEvent(ctx, ev, d); }
            });
            return pump();
          });
        }
        return pump();
      })
      .then(function () { if (!ctx.finished) return resumeRun(ctx); })
      .catch(function (e) {
        if (e.code === "auth" || e.message === "login" || e.status === 401 || e.status === 403) { showLogin(); finishRun(ctx); return; }
        if (!ctx.finished) return resumeRun(ctx);
      });
  }

  function resumeRun(ctx) {
    setTyping(true, "o agente continua trabalhando…");
    return new Promise(function (resolve) {
      var tries = 0;
      function poll() {
        if (ctx.finished) return resolve();
        callApi(api.getRun(ctx.runId, ctx.profile)).then(function (st) {
          var status = st && st.status;
          if (status === "completed") {
            runEvent(ctx, "run.completed", { output: st.output });
          } else if (status === "failed") {
            runEvent(ctx, "run.failed", { error: st.error || "falha" });
          } else if (status === "cancelled" || status === "interrupted") {
            runEvent(ctx, "run.cancelled", {});
          } else if (status === "waiting_for_approval" && st.approval && !ctx.approvals.length) {
            runEvent(ctx, "approval.request", st.approval); setTimeout(poll, 3000); return;
          } else {
            tries += 1; setTimeout(poll, document.hidden ? 8000 : 2500); return;
          }
          resolve();
        }).catch(function (e) {
          if (e.message === "login") { finishRun(ctx); return resolve(); }
          tries += 1;
          if (tries > 240) { runEvent(ctx, "run.failed", { error: "Não foi possível acompanhar a execução (" + e.message + "). Recarregue a conversa." }); return resolve(); }
          setTimeout(poll, 5000);
        });
      }
      poll();
      // ao voltar para o app, confere na hora em vez de esperar o próximo ciclo
      ctx.onVisible = function () { if (!document.hidden && !ctx.finished) poll(); };
      document.addEventListener("visibilitychange", ctx.onVisible);
    }).then(function () { if (ctx.onVisible) document.removeEventListener("visibilitychange", ctx.onVisible); });
  }

  function finishRun(ctx) {
    if (ctx.finished) return;
    ctx.finished = true;
    if (state.runCtx === ctx) state.runCtx = null;
    savePendingRun(null);
    state.streaming = false; $("btn-send").disabled = false; setTyping(false); updateStopButton(); renderChatStatus();
    if (ctx.bot.content && ctx.botEl) state.messages.push(ctx.bot);
    var s = null; for (var i = 0; i < state.sessions.length; i++) if (state.sessions[i].id === ctx.sid) s = state.sessions[i];
    if (s) { s.preview = ctx.bot.content || ctx.text || "📎 anexo"; s.last_active = Date.now() / 1000; s.message_count = (s.message_count || 0) + 2; }
    renderSessions();
    if (state.current && state.current.id === ctx.sid) loadMessages(true);  // sincroniza com o que ficou gravado no servidor
  }

  // Execução que ficou pendente (app fechado ou recarregado no meio): volta a acompanhar.
  function resumePendingRun() {
    var pr = pendingRun();
    if (!pr || !pr.run_id || state.streaming || !state.current || state.current.id !== pr.sid) return;
    if (Date.now() - (pr.started || 0) > 2 * 60 * 60 * 1000) { savePendingRun(null); return; }
    var ctx = { sid: pr.sid, profile: pr.profile, text: pr.text, bot: { role: "assistant", content: "", timestamp: null }, botEl: null, approvals: [], approvalsSeen: {}, runId: pr.run_id, finished: false };
    state.streaming = true; state.runCtx = ctx; $("btn-send").disabled = true; updateStopButton();
    resumeRun(ctx);
  }


  // ───────────────────────── anexos (imagens, arquivos, prints colados, áudio)
  var MAX_IMG_SIDE = 1600, MAX_IMAGES = 6, MAX_FILE = 25 * 1024 * 1024;
  function fmtSize(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(0) + " KB" : (n / 1048576).toFixed(1) + " MB"; }
  function readAsDataURL(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); }); }
  function shrinkImage(file) {
    return readAsDataURL(file).then(function (url) {
      return new Promise(function (res) {
        var im = new Image();
        im.onload = function () {
          var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, MAX_IMG_SIDE / Math.max(w, h));
          if (k === 1 && file.size < 900 * 1024 && file.type !== "image/heic") return res(url);
          var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.85));
        };
        im.onerror = function () { res(url); };
        im.src = url;
      });
    });
  }
  function addFiles(files) {
    var list = Array.prototype.slice.call(files || []);
    list.forEach(function (f) {
      if (!f) return;
      if (f.size > MAX_FILE) { toast(f.name + ": maior que 25 MB"); return; }
      if (f.type.indexOf("image/") === 0) {
        if (state.attachments.filter(function (a) { return a.kind === "image"; }).length >= MAX_IMAGES) { toast("Máximo de " + MAX_IMAGES + " imagens por mensagem"); return; }
        var item = { kind: "image", name: f.name || "imagem.jpg", size: f.size, url: null };
        state.attachments.push(item); renderTray();
        shrinkImage(f).then(function (u) { item.url = u; renderTray(); });
      } else {
        var it = { kind: f.type.indexOf("audio/") === 0 ? "audio" : "file", name: f.name || "arquivo", size: f.size, file: f, mime: f.type };
        state.attachments.push(it); renderTray();
      }
    });
  }
  function renderTray() {
    var tray = $("tray"); tray.innerHTML = "";
    tray.classList.toggle("hidden", state.attachments.length === 0);
    state.attachments.forEach(function (a, i) {
      var d = document.createElement("div"); d.className = "att " + a.kind;
      if (a.kind === "image") d.innerHTML = (a.url ? '<img src="' + esc(a.url) + '">' : '<span class="att-name">processando…</span>');
      else d.innerHTML = '<span>' + (a.kind === "audio" ? "🎤" : "📎") + '</span><span class="att-name">' + esc(a.name) + ' · ' + fmtSize(a.size) + '</span>';
      var x = document.createElement("button"); x.type = "button"; x.className = "att-x"; x.textContent = "×"; x.setAttribute("aria-label", "Remover");
      x.addEventListener("click", function () { state.attachments.splice(i, 1); renderTray(); });
      d.appendChild(x); tray.appendChild(d);
    });
  }
  $("btn-attach").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function (e) { addFiles(e.target.files); e.target.value = ""; });
  document.addEventListener("paste", function (e) {
    if (!state.current) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    var files = [];
    for (var i = 0; i < items.length; i++) if (items[i].kind === "file") { var f = items[i].getAsFile(); if (f) files.push(f); }
    if (files.length) { e.preventDefault(); addFiles(files); toast(files.length === 1 ? "Imagem colada" : files.length + " arquivos colados"); }
  });
  ["dragenter", "dragover"].forEach(function (ev) { document.addEventListener(ev, function (e) { if (!state.current) return; e.preventDefault(); document.body.classList.add("dropping"); }); });
  ["dragleave", "drop"].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); if (ev === "dragleave" && e.relatedTarget) return; document.body.classList.remove("dropping"); if (ev === "drop" && state.current && e.dataTransfer) addFiles(e.dataTransfer.files); }); });

  function uploadAttachment(a) {
    return readAsDataURL(a.file).then(function (url) {
      return req("upload", { method: "POST", body: { name: a.name, data_url: url, kind: a.kind } });
    });
  }
  function transcribe(blob, mime) {
    return readAsDataURL(blob).then(function (url) {
      return api.transcribe({ data_url: url, mime_type: mime });
    });
  }

  // microfone
  function stopTimer() { clearInterval(state.recTimer); state.recTimer = null; }
  function toggleRecord() {
    if (state.recorder && state.recorder.state === "recording") { state.recCancel = false; state.recorder.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Gravação não suportada neste navegador"); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0] || "";
      var rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      state.recorder = rec; state.recChunks = []; state.recStart = Date.now(); state.recCancel = false;
      rec.ondataavailable = function (e) { if (e.data && e.data.size) state.recChunks.push(e.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stopTimer(); $("rec").classList.add("hidden"); $("btn-mic").classList.remove("recording");
        var type = rec.mimeType || mime || "audio/webm";
        var blob = new Blob(state.recChunks, { type: type }); state.recorder = null;
        if (state.recCancel) { state.recCancel = false; toast("Gravação cancelada"); return; }
        if (blob.size < 1500) { toast("Gravação muito curta"); return; }
        var dur = Math.round((Date.now() - state.recStart) / 1000);
        attachAudio(blob, type, dur);
        if (!state.streaming) send(); else toast("Áudio anexado; envie quando a resposta terminar");
      };
      rec.start(250);
      $("btn-mic").classList.add("recording"); $("rec").classList.remove("hidden"); $("rec-time").textContent = "0:00";
      state.recTimer = setInterval(function () { var t = Math.round((Date.now() - state.recStart) / 1000); $("rec-time").textContent = Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); if (t >= 300 && rec.state === "recording") { toast("Limite de 5 minutos atingido"); rec.stop(); } }, 500);
    }).catch(function (err) { var n = err && err.name; toast(n === "NotFoundError" ? "Nenhum microfone encontrado" : n === "NotAllowedError" ? "Permissão de microfone negada" : "Microfone indisponível: " + (err && err.message || n)); });
  }
  function attachAudio(blob, type, dur) {
    var ext = type.indexOf("mp4") >= 0 ? "m4a" : type.indexOf("ogg") >= 0 ? "ogg" : "webm";
    var f = new File([blob], "audio-" + dur + "s." + ext, { type: type.split(";")[0] });
    state.attachments.push({ kind: "audio", name: f.name, size: f.size, file: f, mime: f.type }); renderTray();
  }
  $("btn-mic").addEventListener("click", toggleRecord);
  $("btn-rec-cancel").addEventListener("click", function () {
    if (state.recorder && state.recorder.state === "recording") { state.recCancel = true; state.recorder.stop(); }
  });

  // ───────────────────────── menu da conversa
  function updateSession(id, patch) {
    [state.sessions, state.searchResults || []].forEach(function (list) {
      list.forEach(function (item) { if (item && item.id === id) Object.assign(item, patch); });
    });
    if (state.current && state.current.id === id) Object.assign(state.current, patch);
  }
  function openSheet(target) {
    state.sheetTarget = target;
    $("sheet").querySelector('[data-act=reload]').classList.toggle("hidden", !(state.current && state.current.id === target.id));
    var canPin = !state.capabilities || window.TregApi.feature(state.capabilities, "session_update") !== false;
    var pin = $("sheet").querySelector('[data-act=pin]');
    pin.classList.toggle("hidden", !canPin);
    pin.textContent = target.pinned ? "Desafixar conversa" : "Fixar conversa";
    $("sheet").querySelector(".sheet-title").textContent = sessionTitle(target);
    $("sheet").classList.remove("hidden");
  }
  // Configurações: modo de autorização de comandos do agente selecionado.
  var OFF_LABEL = "<b>Não perguntar</b><span>Executa tudo sem pedir. Use só em servidor de teste ou dedicado ao agente.</span>";
  function markMode(mode) {
    Array.prototype.forEach.call($("settings").querySelectorAll("[data-mode]"), function (b) {
      b.classList.toggle("current", b.getAttribute("data-mode") === mode); b.disabled = false;
      if (b.getAttribute("data-mode") === "off") { b.innerHTML = OFF_LABEL; b.removeAttribute("data-confirm"); }
    });
  }
  function openSettings() {
    markTheme(state.themePref);
    var version = $("app-version");
    if (version) version.textContent = ui ? ui.versionLabel() : "TREG · Fase 5B · 1.8.0b1";
    $("settings-sub").textContent = "Agente: " + (state.profile || "default") + ". Carregando…";
    markMode(""); $("settings").classList.remove("hidden");
    callApi(api.getApprovals(state.profile))
      .then(function (d) { $("settings-sub").textContent = "Agente: " + (state.profile || "default") + ". Vale para as próximas mensagens."; markMode(d.mode); })
      .catch(function (e) { if (e.message !== "login") $("settings-sub").textContent = "Não foi possível ler a configuração (" + e.message + ")."; });
  }
  $("btn-settings").addEventListener("click", openSettings);
  $("settings").addEventListener("click", function (e) {
    var themeButton = e.target.closest ? e.target.closest("[data-theme-choice]") : null;
    if (themeButton) { applyTheme(themeButton.getAttribute("data-theme-choice"), true); return; }
    var el = e.target.closest ? e.target.closest("button") : null;
    if (e.target === $("settings") || (el && el.getAttribute("data-act") === "close")) { $("settings").classList.add("hidden"); return; }
    if (!el || !el.getAttribute("data-mode")) return;
    var mode = el.getAttribute("data-mode");
    if (el.classList.contains("current")) return;
    if (mode === "off" && !el.getAttribute("data-confirm")) {  // segundo toque confirma
      el.setAttribute("data-confirm", "1");
      el.innerHTML = "<b>Toque de novo para confirmar</b><span>O agente vai executar qualquer comando sem pedir autorização.</span>";
      return;
    }
    Array.prototype.forEach.call($("settings").querySelectorAll("[data-mode]"), function (b) { b.disabled = true; });
    callApi(api.setApprovals(mode, state.profile))
      .then(function (d) { markMode(d.mode); toast(d.mode === "off" ? "Autorização desligada" : (d.mode === "smart" ? "Modo inteligente ativado" : "Vai perguntar sempre")); })
      .catch(function (e) { markMode(""); if (e.message !== "login") toast("Não foi possível salvar: " + e.message, 4000); });
  });

  $("btn-menu").addEventListener("click", function () { if (state.current) openSheet(state.current); });
  $("sheet").addEventListener("click", function (e) {
    var act = e.target.getAttribute && e.target.getAttribute("data-act");
    if (e.target === $("sheet") || act === "close") { $("sheet").classList.add("hidden"); return; }
    if (!act || !state.sheetTarget) return;
    $("sheet").classList.add("hidden");
    var s = state.sheetTarget; var isOpen = state.current && state.current.id === s.id;
    if (act === "pin") {
      var pinned = !s.pinned;
      req(pq("sessions/" + encodeURIComponent(s.id), s.profile), { method: "PATCH", body: { pinned: pinned } }).then(function (d) {
        var updated = (d && (d.session || d.data)) || {};
        updateSession(s.id, { pinned: typeof updated.pinned === "boolean" ? updated.pinned : pinned });
        renderSessions();
        toast(pinned ? "Conversa fixada" : "Conversa desafixada");
      }).catch(function (e) { toast("Não foi possível fixar: " + e.message); });
    } else if (act === "rename") {
      ask("Renomear conversa", sessionTitle(s), "Novo nome").then(function (t) {
        if (t === null) return;
        req(pq("sessions/" + encodeURIComponent(s.id), s.profile), { method: "PATCH", body: { title: t.trim() } }).then(function () { s.title = t.trim(); if (isOpen) $("chat-title").textContent = sessionTitle(s); renderSessions(); toast("Renomeada"); }).catch(function (e) { toast("Não renomeou: " + e.message); });
      });
    } else if (act === "delete") {
      confirmDlg("Apagar conversa", "Isso remove o histórico desta conversa no servidor. Não dá para desfazer.", "Apagar").then(function (ok) {
        if (!ok) return;
        req(pq("sessions/" + encodeURIComponent(s.id), s.profile), { method: "DELETE" }).then(function () { state.sessions = state.sessions.filter(function (x) { return x.id !== s.id; }); if (isOpen) closeSession(); else renderSessions(); toast("Apagada"); }).catch(function (e) { toast("Não apagou: " + e.message); });
      });
    } else if (act === "reload") { loadMessages(); toast("Recarregado"); }
  });


  // ───────────────────────── agentes (perfis)
  function loadProfiles() {
    return req("profiles").then(function (d) {
      state.profiles = (d && d.profiles) || []; state.multiplex = !!(d && d.multiplex);
      var sel = $("agent"); sel.innerHTML = "";
      state.profiles.forEach(function (p) {
        var o = document.createElement("option"); o.value = p.name;
        o.textContent = p.name + (p.description ? " — " + p.description.slice(0, 40) : "");
        sel.appendChild(o);
      });
      if (!state.profiles.some(function (p) { return p.name === state.profile; })) state.profile = "default";
      sel.value = state.profile; updateAgentModel();
      $("agentbar") && null;
      document.querySelector(".agentbar").classList.toggle("hidden", state.profiles.length < 2);
    }).catch(function () { });
  }
  function updateAgentModel() {
    var p = state.profiles.filter(function (x) { return x.name === state.profile; })[0];
    $("agent-model").textContent = p ? shortModel(p.model || "") : "";
  }
  $("agent").addEventListener("change", function (e) {
    var name = e.target.value;
    if (name !== "default" && !state.multiplex) { toast("Ligue gateway.multiplex_profiles para usar outros agentes"); e.target.value = state.profile; return; }
    state.profile = name; state.searchAvailable = true; state.searchResults = null; state.searchError = null; state.searchLoading = false; state.searchSeq += 1;
    state.searchQuery = ""; $("search").value = "";
    try { localStorage.setItem("treg-pwa-profile", name); } catch (x) { }
    updateAgentModel(); state.sessions = []; renderSessions(); loadSessions(false, true); loadCapabilities();
  });

  function loadCapabilities() {
    if (!api) return;
    var prof = state.profile;
    api.getCapabilities(prof).then(function (caps) {
      if (prof !== state.profile) return;
      state.capabilities = caps; updateStopButton();
    }).catch(function (e) {
      if (prof !== state.profile) return;
      if (e.code === "auth") showLogin();
      state.capabilities = null; updateStopButton();
    });
  }

  function applyViewport() {
    var h = window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight;
    if (h > 0) document.documentElement.style.setProperty("--app-h", h + "px");
  }
  if (window.visualViewport) window.visualViewport.addEventListener("resize", applyViewport);
  window.addEventListener("orientationchange", function () { setTimeout(applyViewport, 80); });
  $("input").addEventListener("focus", function () { setTimeout(function () { applyViewport(); scrollBottom(); }, 120); });

  function updateNetwork() {
    var banner = $("net-banner");
    var offline = !navigator.onLine;
    banner.classList.toggle("hidden", !offline);
    banner.textContent = offline ? "Sem conexão. Tentando reconectar…" : "";
  }
  window.addEventListener("online", function () {
    updateNetwork(); toast("Conexão restabelecida");
    if (state.current) loadMessages(true); else loadSessions(true, true);
  });
  window.addEventListener("offline", updateNetwork);

  // ───────────────────────── boot
  function boot() {
    initTheme(); applyViewport(); updateNetwork();
    try { state.profile = localStorage.getItem("treg-pwa-profile") || "default"; } catch (x) { }
    req("me").then(function (d) { state.model = (d && d.model) || {}; }).catch(function () { });
    loadCapabilities();
    loadProfiles().then(function () { loadSessions(false, true); });
    clearInterval(state.pollList); state.pollList = setInterval(function () { if (!state.current || $("chat").classList.contains("hidden")) loadSessions(true, true); }, 30000);
  }
  if ("serviceWorker" in navigator) {
    // Quando uma versão nova do app assume, recarrega uma vez para a tela não ficar com código antigo.
    var hadController = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController || reloaded || state.streaming) return;
      reloaded = true; window.location.reload();
    });
    navigator.serviceWorker.register("sw.js", { scope: "./", updateViaCache: "none" })
      .then(function (reg) { if (reg && reg.update) reg.update().catch(function () { }); })
      .catch(function () { });
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { if (state.current) { if (!state.streaming) loadMessages(true); resumePendingRun(); } else loadSessions(true); } });
  boot();
})();
