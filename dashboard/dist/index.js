(function () {
  "use strict";
  var SDK = window.__HERMES_PLUGIN_SDK__;
  if (!SDK || !window.__HERMES_PLUGINS__) return;
  var React = SDK.React, h = React.createElement, C = SDK.components;
  var APP = "/api/plugins/treg-pwa/";
  var LOADED_AT = window.location.pathname;  // rota em que o painel foi carregado
  var useState = SDK.hooks.useState, useEffect = SDK.hooks.useEffect;

  // QR code gerado no navegador (qrcode-generator, MIT), sem depender de biblioteca Python no servidor.
  var QR_LIB = "/dashboard-plugins/treg-pwa/dist/qrcode.js";
  var qrLoading = null;
  function loadQrLib() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!qrLoading) {
      qrLoading = new Promise(function (resolve, reject) {
        var sc = document.createElement("script");
        sc.src = QR_LIB;
        sc.onload = function () { window.qrcode ? resolve(window.qrcode) : reject(new Error("qrcode")); };
        sc.onerror = function () { qrLoading = null; reject(new Error("qrcode")); };
        document.head.appendChild(sc);
      });
    }
    return qrLoading;
  }
  function QrCode(props) {
    var _v = useState(""), svg = _v[0], setSvg = _v[1];
    useEffect(function () {
      var alive = true;
      loadQrLib().then(function (lib) {
        var code = lib(0, "M");
        code.addData(props.text);
        code.make();
        if (alive) setSvg(code.createSvgTag({ cellSize: 6, margin: 2, scalable: true }));
      }).catch(function () { if (alive) setSvg(""); });
      return function () { alive = false; };
    }, [props.text]);
    if (!svg) return h("div", { className: "tg-qr tg-qr-empty" }, "QR code");
    return h("div", { className: "tg-qr", role: "img", "aria-label": "QR code do app", dangerouslySetInnerHTML: { __html: svg } });
  }

  function api(path, opts) { return SDK.fetchJSON(APP + path, opts); }
  function errText(e) { return (e && (e.detail || e.message)) ? String(e.detail || e.message) : "Erro inesperado."; }

  // Transcrição das mensagens de voz: chave do Groq configurada pela tela, sem terminal.
  function SttCard() {
    var _s = useState(null), st = _s[0], setSt = _s[1];
    var _k = useState(""), key = _k[0], setKey = _k[1];
    var _l = useState("pt"), lang = _l[0], setLang = _l[1];
    var _b = useState(false), busy = _b[0], setBusy = _b[1];
    var _m = useState(null), msg = _m[0], setMsg = _m[1];

    useEffect(function () {
      api("api/stt").then(function (d) { setSt(d); if (d && d.has_key && d.language) setLang(d.language); })
        .catch(function (e) { setMsg({ ok: false, text: errText(e) }); });
    }, []);

    function save() {
      setBusy(true); setMsg(null);
      api("api/stt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: key.trim(), language: lang }) })
        .then(function (d) { setSt(d); setKey(""); setMsg({ ok: true, text: "Chave conferida no Groq e transcrição ativada. Já vale para os próximos áudios." }); })
        .catch(function (e) { setMsg({ ok: false, text: errText(e) }); })
        .then(function () { setBusy(false); });
    }
    function remove() {
      setBusy(true); setMsg(null);
      api("api/stt", { method: "DELETE" })
        .then(function (d) { setSt(d); setMsg({ ok: true, text: "Chave removida. Os áudios continuam sendo enviados, sem transcrição." }); })
        .catch(function (e) { setMsg({ ok: false, text: errText(e) }); })
        .then(function () { setBusy(false); });
    }

    var active = st && st.active;
    return h(C.Card, null,
      h(C.CardHeader, null, h(C.CardTitle, null, "Transcrição de áudio")),
      h(C.CardContent, null,
        h("p", { className: "tg-status " + (active ? "tg-ok" : "tg-off") },
          st === null ? "Carregando…" : (active ? "Ativa (Groq, chave " + st.key_preview + ")" : "Desativada: as mensagens de voz são enviadas sem transcrição.")),
        h("p", { className: "tg-muted" }, "Usa o Groq, que tem plano gratuito. Crie uma chave em ",
          h("a", { href: "https://console.groq.com/keys", target: "_blank", rel: "noreferrer", className: "tg-link" }, "console.groq.com/keys"),
          " e cole abaixo."),
        h("div", { className: "tg-form" },
          h(C.Input, { type: "password", autoComplete: "off", placeholder: active ? "nova chave (deixe vazio para manter a atual)" : "gsk_…", value: key, disabled: busy,
            onChange: function (e) { setKey(e.target.value); }, style: { minWidth: "320px", flex: "1" } }),
          h("select", { className: "tg-select", value: lang, disabled: busy, onChange: function (e) { setLang(e.target.value); } },
            h("option", { value: "pt" }, "Português"),
            h("option", { value: "en" }, "Inglês"),
            h("option", { value: "es" }, "Espanhol"))
        ),
        h("div", { className: "tg-actions" },
          h(C.Button, { onClick: save, disabled: busy || (!key.trim() && !(st && st.has_key)) }, busy ? "Conferindo…" : "Salvar e conferir"),
          (st && st.has_key) ? h(C.Button, { variant: "outline", onClick: remove, disabled: busy }, "Remover chave") : null
        ),
        msg ? h("p", { className: "tg-msg " + (msg.ok ? "tg-ok" : "tg-err") }, msg.text) : null
      )
    );
  }

  function PwaPage() {
    var url = window.location.origin + "/treg";
    var appUrl = window.location.origin + APP;
    // Quem chega DIRETO por /treg (digitou, QR, link do /treg no chat) vai para o app em qualquer
    // aparelho. A página de instalação só aparece ao clicar no menu "TREG" dentro do painel
    // (navegação interna do SPA: a página foi carregada em outra rota) ou com ?stay=1.
    var params = new URLSearchParams(window.location.search);
    var direct = LOADED_AT.indexOf("/treg") === 0;
    if (params.get("app") === "1" || (direct && params.get("stay") !== "1")) {
      window.location.replace(APP);
      return h("div", { className: "tg-page" }, h("p", { className: "tg-muted" }, "Abrindo o app…"));
    }
    function copy(t) { if (navigator.clipboard) navigator.clipboard.writeText(t); }

    var install = h(C.Card, null,
      h(C.CardHeader, null, h(C.CardTitle, null, "Instalar no celular")),
      h(C.CardContent, null,
        h("div", { className: "tg-row" },
          h(QrCode, { text: url }),
          h("div", null,
            h("ol", { className: "tg-steps" },
              h("li", null, "Aponte a câmera do celular para o QR ou abra ", h("span", { className: "tg-link" }, url)),
              h("li", null, "Faça login com o usuário e senha do painel."),
              h("li", null, "Toque em \"Abrir app\"."),
              h("li", null, "Android (Chrome): menu ⋮ → \"Instalar app\" ou \"Adicionar à tela inicial\"."),
              h("li", null, "iPhone (Safari): botão Compartilhar → \"Adicionar à Tela de Início\".")
            ),
            h("div", { className: "tg-actions" },
              h(C.Button, { onClick: function () { window.location.href = APP; } }, "Abrir app (nesta aba)"),
                h(C.Button, { variant: "outline", onClick: function () { window.open(appUrl, "_blank"); } }, "Abrir em nova aba"),
              h(C.Button, { variant: "outline", onClick: function () { copy(url); } }, "Copiar link")
            )
          )
        )
      )
    );

    var how = h(C.Card, null,
      h(C.CardHeader, null, h(C.CardTitle, null, "Como funciona")),
      h(C.CardContent, null,
        h("p", null, "O app é servido pelo próprio dashboard em ", h("span", { className: "tg-link" }, appUrl),
          " e usa o mesmo login. As conversas vêm do API server do gateway (porta 8642): você vê e continua sessões do WhatsApp, Telegram, terminal e do painel no mesmo lugar."),
        h("p", { className: "tg-muted" }, "No chat de qualquer canal, o comando /treg devolve este link. A sessão de login vale 12 h e se renova por 30 dias enquanto o app for usado.")
      )
    );

    return h("div", { className: "tg-page" },
      h("div", null,
        h("h1", { className: "tg-title" }, "App móvel TREG (PWA)"),
        h("p", { className: "tg-sub" }, "TREG 1.8.0b1 · Fase 5B — teste visual"),
        h("p", { className: "tg-sub" }, "Esta página é só a instalação. O app em si abre em tela cheia, sem o painel em volta, em " + appUrl + ". No celular, /treg já abre o app direto.")
      ),
      install,
      h(SttCard, null),
      how
    );
  }
  window.__HERMES_PLUGINS__.register("treg-pwa", PwaPage);
})();
