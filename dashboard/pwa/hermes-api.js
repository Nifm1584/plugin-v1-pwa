(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TregApi = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function ApiError(message, status, code, detail) {
    this.name = "ApiError";
    this.message = message || "Falha na API";
    this.status = status || 0;
    this.code = code || "api_error";
    this.detail = detail;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ApiError);
  }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.constructor = ApiError;

  function buildQuery(params) {
    var out = [];
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === "") return;
      out.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
    });
    return out.length ? "?" + out.join("&") : "";
  }

  function normalizeSession(raw) {
    var item = raw || {};
    var id = item.id || item.session_id || "";
    return Object.assign({}, item, {
      id: id,
      session_id: id,
      preview: item.preview || item.snippet || "",
      last_active: item.last_active || item.session_started || item.started_at || 0
    });
  }

  function normalizeSearchResult(raw) {
    var item = normalizeSession(raw);
    item.search = true;
    item.snippet = raw && (raw.snippet || raw.preview) || item.preview || "";
    item.preview = item.snippet;
    return item;
  }

  function mergeSessions(existing, incoming) {
    var out = [];
    var index = Object.create(null);
    function add(item) {
      var normalized = normalizeSession(item);
      if (!normalized.id) return;
      if (index[normalized.id] === undefined) {
        index[normalized.id] = out.length;
        out.push(normalized);
      } else {
        var previous = out[index[normalized.id]];
        var merged = Object.assign({}, previous, normalized);
        if (!String(normalized.title || "").trim() && String(previous.title || "").trim()) {
          merged.title = previous.title;
        }
        out[index[normalized.id]] = merged;
      }
    }
    (existing || []).forEach(add);
    (incoming || []).forEach(add);
    return out;
  }

  function mergeSearchSessions(localItems, remoteItems, profile) {
    var out = [];
    var index = Object.create(null);
    var localTitles = Object.create(null);
    (localItems || []).forEach(function (item) {
      var id = item && (item.id || item.session_id);
      if (id && String(item.title || "").trim()) localTitles[id] = item.title;
    });
    function add(item) {
      var normalized = normalizeSession(item);
      if (!normalized.id) return;
      normalized.search = true;
      if (profile) normalized.profile = profile;
      if (index[normalized.id] === undefined) {
        index[normalized.id] = out.length;
        out.push(normalized);
        return;
      }
      var previous = out[index[normalized.id]];
      var merged = Object.assign({}, previous, normalized);
      if (localTitles[normalized.id]) merged.title = localTitles[normalized.id];
      else if (!String(merged.title || "").trim() && String(previous.title || "").trim()) {
        merged.title = previous.title;
      }
      if (!String(merged.snippet || "").trim()) merged.snippet = previous.snippet || "";
      if (!String(merged.preview || "").trim()) merged.preview = previous.preview || "";
      out[index[normalized.id]] = merged;
    }
    (localItems || []).forEach(add);
    (remoteItems || []).forEach(add);
    return out;
  }

  function normalizeCapabilities(payload) {
    var data = payload || {};
    var hasWrapper = Object.prototype.hasOwnProperty.call(data, "gateway");
    var gateway = hasWrapper ? data.gateway : data;
    var features = gateway && gateway.features || {};
    return {
      gateway: gateway || null,
      plugin: data.plugin || {},
      features: features,
      unavailable: !gateway
    };
  }

  function feature(caps, name) {
    if (!caps || !caps.features || typeof caps.features[name] === "undefined") return null;
    return !!caps.features[name];
  }

  function create(options) {
    var opts = options || {};
    var fetchImpl = opts.fetch || (typeof fetch !== "undefined" ? fetch : null);
    var base = opts.base || "api/";
    var origin = opts.origin || "";
    var pageUrl = opts.pageUrl || (origin ? origin + "/" : (typeof location !== "undefined" ? location.href : "http://localhost/"));
    var defaultTimeout = opts.timeout || 0;
    var baseUrl = /^https?:\/\//.test(base) ? base : new URL(base, pageUrl).toString();
    if (baseUrl.charAt(baseUrl.length - 1) !== "/") baseUrl += "/";

    function absolute(path) {
      if (/^https?:\/\//.test(path)) return path;
      return origin + (path.charAt(0) === "/" ? path : "/" + path);
    }

    function doFetch(path, requestOptions) {
      if (!fetchImpl) return Promise.reject(new ApiError("fetch indisponível", 0, "no_fetch"));
      var ro = requestOptions || {};
      var init = {
        method: ro.method || "GET",
        credentials: "same-origin",
        headers: Object.assign({}, ro.headers || {})
      };
      if (ro.body !== undefined) {
        init.headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(ro.body);
      }
      var timeout = ro.timeout === undefined ? defaultTimeout : ro.timeout;
      var controller = null;
      var timer = null;
      if (timeout && typeof AbortController !== "undefined") {
        controller = new AbortController();
        init.signal = controller.signal;
        timer = setTimeout(function () { controller.abort(); }, timeout);
      }
      return fetchImpl(path, init).then(function (response) {
        if (timer) clearTimeout(timer);
        return response.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
          if (!response.ok) {
            var detail = data && (data.detail || data.error || data.message);
            var message = typeof detail === "string" ? detail : (detail && detail.message) || ("HTTP " + response.status);
            var code = response.status === 401 || response.status === 403 ? "auth"
              : response.status === 404 ? "not_found"
              : response.status === 405 ? "unsupported"
              : response.status === 409 ? "conflict"
              : response.status >= 500 ? "gateway_unavailable" : "api_error";
            throw new ApiError(message, response.status, code, detail);
          }
          return data;
        });
      }).catch(function (error) {
        if (timer) clearTimeout(timer);
        if (error && error.name === "AbortError") throw new ApiError("Tempo esgotado", 0, "timeout");
        if (error instanceof ApiError) throw error;
        throw new ApiError((error && error.message) || "Falha de rede", 0, "network", error);
      });
    }

    function request(path, requestOptions) {
      return doFetch(new URL(path, baseUrl).toString(), requestOptions);
    }

    function requestAbsolute(path, requestOptions) {
      return doFetch(absolute(path), requestOptions);
    }

    return {
      request: request,
      requestAbsolute: requestAbsolute,
      getMe: function () { return request("me"); },
      getProfiles: function () { return request("profiles"); },
      getCapabilities: function (profile) {
        return request("capabilities" + buildQuery({ profile: profile })).then(normalizeCapabilities);
      },
      getSessions: function (params) {
        var p = params || {};
        return request("sessions" + buildQuery({
          limit: p.limit, offset: p.offset, source: p.source, profile: p.profile
        })).then(function (data) {
          var list = Array.isArray(data) ? data : (data && (data.data || data.sessions)) || [];
          var hasMore = data && typeof data.has_more === "boolean" ? data.has_more : list.length >= (p.limit || 50);
          return {
            items: list.map(normalizeSession),
            hasMore: !!hasMore,
            raw: data
          };
        });
      },
      getSession: function (id, profile) {
        return request("sessions/" + encodeURIComponent(id) + buildQuery({ profile: profile }))
          .then(function (data) { return normalizeSession((data && data.session) || data); });
      },
      getMessages: function (id, profile) {
        return request("sessions/" + encodeURIComponent(id) + "/messages" + buildQuery({ profile: profile }))
          .then(function (data) { return Array.isArray(data) ? data : (data && (data.data || data.messages)) || []; });
      },
      createSession: function (title, profile) {
        return request("sessions" + buildQuery({ profile: profile }), { method: "POST", body: { title: title || null } });
      },
      patchSession: function (id, body, profile) {
        return request("sessions/" + encodeURIComponent(id) + buildQuery({ profile: profile }), { method: "PATCH", body: body });
      },
      deleteSession: function (id, profile) {
        return request("sessions/" + encodeURIComponent(id) + buildQuery({ profile: profile }), { method: "DELETE" });
      },
      searchHistory: function (query, params) {
        var p = params || {};
        return requestAbsolute("/api/sessions/search" + buildQuery({
          q: query, limit: p.limit || 50, profile: p.profile
        })).then(function (data) {
          var list = data && (data.results || data.data) || [];
          return { items: list.map(normalizeSearchResult), raw: data };
        });
      },
      getMediaDataUrl: function (path) {
        return requestAbsolute("/api/media" + buildQuery({ path: path })).then(function (data) {
          return (data && data.data_url) || "";
        });
      },
      getFileDataUrl: function (path) {
        return requestAbsolute("/api/files/read" + buildQuery({ path: path })).then(function (data) {
          return (data && data.data_url) || "";
        });
      },
      createRun: function (sessionId, message, profile) {
        return request("sessions/" + encodeURIComponent(sessionId) + "/runs" + buildQuery({ profile: profile }), {
          method: "POST",
          body: { message: message },
          timeout: 60000
        });
      },
      getRun: function (id, profile) {
        return request("runs/" + encodeURIComponent(id) + buildQuery({ profile: profile }));
      },
      runEvents: function (id, profile) {
        if (!fetchImpl) return Promise.reject(new ApiError("fetch indisponível", 0, "no_fetch"));
        return fetchImpl(new URL("runs/" + encodeURIComponent(id) + "/events" + buildQuery({ profile: profile }), baseUrl).toString(), {
          method: "GET",
          credentials: "same-origin",
          headers: { "Accept": "text/event-stream" }
        }).then(function (response) {
          if (response.status === 401 || response.status === 403) {
            throw new ApiError("login", response.status, "auth");
          }
          if (!response.ok) {
            return response.text().then(function (text) {
              throw new ApiError(text.slice(0, 200) || ("HTTP " + response.status), response.status, "api_error");
            });
          }
          return response;
        }).catch(function (error) {
          if (error instanceof ApiError) throw error;
          throw new ApiError((error && error.message) || "Falha de rede", 0, "network", error);
        });
      },
      stopRun: function (id, profile) {
        return request("runs/" + encodeURIComponent(id) + "/stop" + buildQuery({ profile: profile }), { method: "POST" });
      },
      approval: function (id, body, profile) {
        return request("runs/" + encodeURIComponent(id) + "/approval" + buildQuery({ profile: profile }), { method: "POST", body: body });
      },
      getApprovals: function (profile) { return request("approvals" + buildQuery({ profile: profile })); },
      setApprovals: function (mode, profile) {
        return request("approvals" + buildQuery({ profile: profile }), { method: "POST", body: { mode: mode } });
      },
      upload: function (body) { return request("upload", { method: "POST", body: body, timeout: 120000 }); },
      transcribe: function (body, timeout) {
        return requestAbsolute("/api/audio/transcribe", { method: "POST", body: body, timeout: timeout || 180000 })
          .then(function (data) { return (data && data.transcript) || ""; });
      },
      login: function (body) {
        return requestAbsolute("/auth/password-login", { method: "POST", body: body });
      }
    };
  }

  return {
    ApiError: ApiError,
    buildQuery: buildQuery,
    create: create,
    feature: feature,
    mergeSessions: mergeSessions,
    mergeSearchSessions: mergeSearchSessions,
    normalizeCapabilities: normalizeCapabilities,
    normalizeSearchResult: normalizeSearchResult,
    normalizeSession: normalizeSession
  };
});
