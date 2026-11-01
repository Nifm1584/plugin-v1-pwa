"""Backend do treg-pwa (versão independente do hermes-pwa), montado em /api/plugins/treg-pwa/.

Duas responsabilidades:
  1. Servir o app (index.html, app.js, app.css, manifest, service worker, ícones, QR).
  2. Fazer proxy autenticado para o API server do gateway (porta 8642) — listar sessões,
     ler mensagens, criar/renomear/apagar sessões e conversar com streaming (SSE) — usando a
     API_SERVER_KEY do ambiente. O navegador nunca vê a chave; ele só precisa do cookie do
     dashboard, que a própria gate do Hermes já exige para tudo em /api/plugins/*.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, Response, StreamingResponse
from pydantic import BaseModel

_log = logging.getLogger(__name__)
router = APIRouter()

_HERE = Path(__file__).resolve().parent
_PWA = _HERE / "pwa"
_STATIC = {
    "app.js": ("application/javascript; charset=utf-8", _PWA / "app.js"),
    "ui-utils.js": ("application/javascript; charset=utf-8", _PWA / "ui-utils.js"),
    "hermes-api.js": ("application/javascript; charset=utf-8", _PWA / "hermes-api.js"),
    "app.css": ("text/css; charset=utf-8", _PWA / "app.css"),
    "sw.js": ("application/javascript; charset=utf-8", _PWA / "sw.js"),
    "icon.svg": ("image/svg+xml", _PWA / "icon.svg"),
    "icon-192.png": ("image/png", _PWA / "icon-192.png"),
    "icon-512.png": ("image/png", _PWA / "icon-512.png"),
}


# ── gateway API server ───────────────────────────────────────────────────────────

def _api_base() -> str:
    # Nome próprio com fallback para o legado: permite configurar a cópia sem afetar o original.
    host = (os.environ.get("TREG_PWA_API_HOST") or os.environ.get("HERMES_PWA_API_HOST") or "127.0.0.1").strip()
    port = (os.environ.get("API_SERVER_PORT") or "8642").strip()
    return f"http://{host}:{port}"


def _env_value(path: Path, key: str) -> str:
    try:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export "):].lstrip()
            name, sep, value = line.partition("=")
            if sep and name.strip() == key:
                return value.strip().strip("'\"")
    except Exception:
        pass
    return ""


def _managed_env_value(key: str) -> str:
    try:
        from hermes_cli.managed_scope import load_managed_env
        value = (load_managed_env().get(key) or "").strip()
        if value:
            return value
    except Exception:
        pass
    override = (os.environ.get("HERMES_MANAGED_DIR") or "").strip()
    if override:
        return _env_value(Path(override) / ".env", key)
    return _env_value(Path("/etc/hermes") / ".env", key)


def _profile_home(profile: str) -> Path:
    try:
        from hermes_cli.profiles import get_profile_dir
        return Path(get_profile_dir(profile))
    except Exception:
        try:
            from hermes_constants import get_hermes_home
            return Path(get_hermes_home()) / "profiles" / profile
        except Exception:
            raise HTTPException(status_code=503, detail={
                "code": "profile_resolution_failed",
                "message": f"Não foi possível localizar a configuração do perfil '{profile}'.",
            })


def _profile_api_key(profile: str) -> str:
    if not _PROFILE_RE.match(profile):
        raise HTTPException(status_code=400, detail="perfil inválido")
    home = _profile_home(profile)
    if not home.is_dir():
        raise HTTPException(status_code=404, detail={
            "code": "profile_not_found",
            "profile": profile,
            "message": f"O perfil '{profile}' não está disponível no Hermes.",
        })
    key = ""
    try:
        from agent.secret_scope import build_profile_secret_scope
        key = (build_profile_secret_scope(home).get("API_SERVER_KEY") or "").strip()
    except Exception:
        key = ""
    managed_key = _managed_env_value("API_SERVER_KEY")
    if managed_key:
        key = managed_key
    if not key:
        key = _env_value(home / ".env", "API_SERVER_KEY")
    if not key:
        raise HTTPException(status_code=503, detail={
            "code": "profile_api_key_missing",
            "profile": profile,
            "message": (
                f"O perfil '{profile}' não tem API_SERVER_KEY no escopo. Configure a mesma chave "
                "do perfil padrão no .env desse perfil ou no escopo administrado (/etc/hermes/.env) "
                "e reinicie o gateway do Hermes."
            ),
        })
    return key


def _api_key(profile: Optional[str] = None) -> str:
    prof = (profile or "").strip().lower()
    if not prof or prof == "default":
        key = (os.environ.get("API_SERVER_KEY") or "").strip()
        if not key:
            try:  # .env do HERMES_HOME (instalações sem Docker)
                from hermes_cli.config import get_env_path
                key = _env_value(Path(get_env_path()), "API_SERVER_KEY")
            except Exception:
                pass
        if not key:
            raise HTTPException(status_code=503, detail={
                "code": "api_key_missing",
                "message": (
                    "API_SERVER_KEY não configurada. O PWA usa o API server do gateway; defina "
                    "API_SERVER_ENABLED=true, API_SERVER_HOST=0.0.0.0 e API_SERVER_KEY no .env/ambiente e reinicie."
                ),
            })
        return key
    return _profile_api_key(prof)


def _gateway_error(profile: Optional[str], status: int, detail: Any) -> HTTPException:
    prof = (profile or "").strip().lower()
    named = bool(prof and prof != "default")
    if status == 401:
        if named:
            return HTTPException(status_code=503, detail={
                "code": "profile_api_auth_failed",
                "profile": prof,
                "message": (
                    f"O gateway recusou a chave de API do perfil '{prof}'. Confira se a mesma "
                    "API_SERVER_KEY do perfil padrão está no .env do perfil ou no escopo "
                    "administrado (/etc/hermes/.env) e reinicie o gateway do Hermes."
                ),
            })
        return HTTPException(status_code=503, detail={
            "code": "api_key_invalid",
            "message": "O gateway recusou a API_SERVER_KEY do PWA. Confira a configuração do servidor e reinicie o gateway.",
        })
    if status == 403:
        if named:
            return HTTPException(status_code=403, detail={
                "code": "profile_forbidden",
                "profile": prof,
                "message": f"O perfil '{prof}' não autorizou esta operação.",
            })
        return HTTPException(status_code=403, detail={
            "code": "forbidden",
            "message": "Acesso proibido pelo gateway do Hermes.",
        })
    if status == 404 and named:
        return HTTPException(status_code=404, detail={
            "code": "profile_not_found",
            "profile": prof,
            "message": f"O perfil '{prof}' não está disponível no gateway.",
        })
    if status >= 500:
        return HTTPException(status_code=502, detail={
            "code": "gateway_unavailable",
            "message": f"O gateway do Hermes respondeu com erro interno (HTTP {status}). Tente novamente.",
        })
    return HTTPException(status_code=status, detail=detail)


def _gateway_sse_error(profile: Optional[str], status: int, detail: Any) -> Dict[str, Any]:
    exc = _gateway_error(profile, status, detail)
    payload = dict(exc.detail) if isinstance(exc.detail, dict) else {"message": str(exc.detail or "erro")}
    payload.setdefault("status", exc.status_code)
    return payload


def _client(profile: Optional[str] = None):
    import httpx
    return httpx.AsyncClient(base_url=_api_base(), headers={"Authorization": f"Bearer {_api_key(profile)}"},
                             timeout=httpx.Timeout(30.0, read=300.0))


async def _proxy_json(method: str, path: str, *, params: Optional[Dict[str, Any]] = None,
                      body: Optional[Dict[str, Any]] = None, profile: Optional[str] = None) -> Any:
    try:
        async with _client(profile) as c:
            r = await c.request(method, path, params=params, json=body)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail={
            "code": "gateway_unavailable",
            "message": f"Gateway API indisponível ({_api_base()}): {exc}",
        })
    if r.status_code >= 400:
        try:
            detail = r.json()
        except Exception:
            detail = r.text[:300]
        raise _gateway_error(profile, r.status_code, detail)
    if not r.content:
        return {"ok": True}
    try:
        return r.json()
    except Exception:
        return {"ok": True, "raw": r.text[:300]}


# ── app estático ─────────────────────────────────────────────────────────────────

_NO_STORE = {"Cache-Control": "no-store"}


@router.get("", include_in_schema=False)
@router.get("/", include_in_schema=False)
def index(request: Request):
    # Sem barra final o escopo relativo do manifest/SW quebra: normaliza.
    if not request.url.path.endswith("/"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=request.url.path + "/", status_code=307)
    return HTMLResponse((_PWA / "index.html").read_text(encoding="utf-8"), headers=_NO_STORE)


@router.get("/manifest.webmanifest", include_in_schema=False)
def manifest(request: Request):
    base = request.url.path.rsplit("/manifest.webmanifest", 1)[0] + "/"
    data = {
        "name": "TREG", "short_name": "TREG", "description": "TREG: chat com o Hermes Agent (versão independente do hermes-pwa)",
        "id": base, "start_url": base, "scope": base, "display": "standalone",
        "orientation": "portrait", "background_color": "#0b1416", "theme_color": "#0f2f31",
        "lang": "pt-BR",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    return Response(json.dumps(data), media_type="application/manifest+json", headers=_NO_STORE)


@router.get("/qr.svg", include_in_schema=False)
def qr(request: Request, target: str = ""):
    """QR code (SVG) para o link do app; usado na aba PWA do painel."""
    url = target or (str(request.base_url).rstrip("/") + "/treg")
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="target inválido")
    try:
        import qrcode
        import qrcode.image.svg as qsvg
        img = qrcode.make(url, image_factory=qsvg.SvgPathImage, box_size=10, border=2)
        import io
        buf = io.BytesIO()
        img.save(buf)
        return Response(buf.getvalue(), media_type="image/svg+xml", headers=_NO_STORE)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Não foi possível gerar o QR: {exc}")


# ── perfis (agentes) ─────────────────────────────────────────────────────────────
import re as _re
_PROFILE_RE = _re.compile(r"^[a-z0-9][a-z0-9_-]{0,40}$")


def _pfx(profile: Optional[str]) -> str:
    """Prefixo da API do gateway para um perfil secundário (gateway.multiplex_profiles)."""
    prof = (profile or "").strip().lower()
    if not prof or prof == "default":
        return ""
    if not _PROFILE_RE.match(prof):
        raise HTTPException(status_code=400, detail="perfil inválido")
    return f"/p/{prof}"


@router.get("/api/profiles")
def profiles() -> Dict[str, Any]:
    """Lista os agentes (perfis) disponíveis, com modelo e descrição."""
    out = []
    try:
        from hermes_cli.profiles import list_profiles
        for prof in list_profiles():
            desc = ""
            try:
                import yaml
                meta = Path(prof.path) / "profile.yaml"
                if meta.exists():
                    desc = str((yaml.safe_load(meta.read_text(encoding="utf-8")) or {}).get("description") or "")
            except Exception:
                pass
            out.append({"name": prof.name, "is_default": bool(prof.is_default), "model": prof.model or "",
                        "provider": prof.provider or "", "description": desc})
    except Exception as exc:
        _log.warning("treg-pwa: list_profiles falhou: %s", exc)
        out = [{"name": "default", "is_default": True, "model": "", "provider": "", "description": ""}]
    multiplex = False
    try:
        from hermes_cli.config import load_config_readonly
        multiplex = bool(((load_config_readonly() or {}).get("gateway") or {}).get("multiplex_profiles"))
    except Exception:
        pass
    return {"profiles": out, "multiplex": multiplex}


# ── API usada pelo app ───────────────────────────────────────────────────────────

class NewSession(BaseModel):
    title: Optional[str] = None


class PatchSession(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None
    archived: Optional[bool] = None


class ChatBody(BaseModel):
    message: Any  # str ou lista de partes OpenAI (text / image_url com data:image/...)


class UploadBody(BaseModel):
    name: str
    data_url: str
    kind: Optional[str] = None  # "audio" | "file"


@router.get("/api/me")
def me(request: Request) -> Dict[str, Any]:
    model: Dict[str, Any] = {}
    try:
        from hermes_cli.config import load_config_readonly
        m = (load_config_readonly() or {}).get("model") or {}
        model = {"provider": m.get("provider") or "", "default": m.get("default") or m.get("model") or ""}
    except Exception:
        pass
    user = getattr(getattr(request, "state", None), "user_id", None) or "admin"
    return {"user": str(user), "model": model, "api_base": _api_base()}


@router.get("/api/capabilities")
async def capabilities(profile: Optional[str] = None) -> Dict[str, Any]:
    """Capacidades do gateway + extensões do plugin.

    A rota é deliberadamente tolerante: versões antigas do Hermes podem não
    expor ``/v1/capabilities``. Nesse caso devolvemos ``gateway: null`` para que
    o cliente trate os recursos como desconhecidos, em vez de desligá-los.
    """
    gateway: Any = None
    error: Optional[Dict[str, Any]] = None
    try:
        gateway = await _proxy_json("GET", _pfx(profile) + "/v1/capabilities", profile=profile)
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        error = {"status": exc.status_code, "code": detail.get("code"),
                 "message": detail.get("message") or (exc.detail if isinstance(exc.detail, str) else None),
                 "detail": exc.detail}
    except Exception as exc:
        error = {"status": 0, "detail": str(exc)}
    return {
        "gateway": gateway,
        "gateway_error": error,
        "plugin": {
            "session_search": True,
            "session_pin": True,
            "run_stop": True,
            "audio_transcribe": True,
        },
    }


@router.get("/api/sessions")
async def list_sessions(limit: int = 60, offset: int = 0, source: Optional[str] = None, profile: Optional[str] = None) -> Any:
    params: Dict[str, Any] = {"limit": max(1, min(limit, 200)), "offset": max(0, offset)}
    if source:
        params["source"] = source
    return await _proxy_json("GET", _pfx(profile) + "/api/sessions", params=params, profile=profile)


@router.post("/api/sessions")
async def create_session(body: NewSession, profile: Optional[str] = None) -> Any:
    payload: Dict[str, Any] = {"source": "api_server"}
    if body.title:
        payload["title"] = body.title.strip()[:120]
    return await _proxy_json("POST", _pfx(profile) + "/api/sessions", body=payload, profile=profile)


@router.patch("/api/sessions/{session_id}")
async def patch_session(session_id: str, body: PatchSession, profile: Optional[str] = None) -> Any:
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="nada para alterar")
    return await _proxy_json("PATCH", f"{_pfx(profile)}/api/sessions/{session_id}", body=payload, profile=profile)


@router.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, profile: Optional[str] = None) -> Any:
    return await _proxy_json("DELETE", f"{_pfx(profile)}/api/sessions/{session_id}", profile=profile)


@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str, profile: Optional[str] = None) -> Any:
    return await _proxy_json("GET", f"{_pfx(profile)}/api/sessions/{session_id}", profile=profile)


@router.get("/api/sessions/{session_id}/messages")
async def messages(session_id: str, limit: Optional[int] = None, offset: int = 0, profile: Optional[str] = None) -> Any:
    params: Dict[str, Any] = {"offset": max(0, offset)}
    if limit is not None:
        params["limit"] = max(1, min(limit, 500))
    return await _proxy_json("GET", f"{_pfx(profile)}/api/sessions/{session_id}/messages", params=params, profile=profile)


_MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _uploads_dir() -> Path:
    from hermes_constants import get_hermes_home
    d = get_hermes_home() / "home" / "uploads"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.post("/api/upload")
def upload(body: UploadBody) -> Dict[str, Any]:
    """Salva um arquivo enviado pelo app em ~/uploads do agente e devolve o caminho, para que a
    mensagem possa referenciá-lo e o agente o leia com as ferramentas de arquivo."""
    import base64
    import re
    import time
    import uuid

    data_url = (body.data_url or "").strip()
    if not data_url.startswith("data:") or "," not in data_url:
        raise HTTPException(status_code=400, detail="data_url inválida")
    header, encoded = data_url.split(",", 1)
    mime = header[5:].split(";", 1)[0] or "application/octet-stream"
    try:
        raw = base64.b64decode(encoded, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="base64 inválido")
    if not raw:
        raise HTTPException(status_code=400, detail="arquivo vazio")
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="arquivo maior que 25 MB")
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", (body.name or "arquivo").strip())[:80].strip("._") or "arquivo"
    dest = _uploads_dir() / f"{time.strftime('%Y%m%d-%H%M%S')}_{uuid.uuid4().hex[:6]}_{safe}"
    dest.write_bytes(raw)
    return {"ok": True, "path": str(dest), "name": safe, "size": len(raw), "mime": mime, "kind": body.kind or "file"}


@router.get("/api/uploads/{name}")
def serve_upload(name: str):
    """Serve um arquivo de ~/uploads (áudios de voz, para o player do app). Sem subpastas."""
    import re
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,160}", name) or name.startswith("."):
        raise HTTPException(status_code=404, detail="Not found")
    path = _uploads_dir() / name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    import mimetypes
    media = mimetypes.guess_type(name)[0] or "application/octet-stream"
    if name.endswith(".webm"):
        media = "audio/webm"
    return FileResponse(str(path), media_type=media, headers={"Cache-Control": "private, max-age=86400"})


# ── execuções em segundo plano (/v1/runs) ─────────────────────────────────────────
# O chat/stream interrompe o agente quando o cliente some (celular suspende a página). Com /v1/runs o
# agente continua no servidor; o app acompanha pelos eventos e, se perder a conexão, pelo status.

class RunBody(BaseModel):
    message: Any  # str ou lista de partes OpenAI (text / image_url)


@router.post("/api/sessions/{session_id}/runs")
async def create_run(session_id: str, body: RunBody, profile: Optional[str] = None) -> Any:
    msg = body.message
    if isinstance(msg, str):
        msg = msg.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="mensagem vazia")
    if isinstance(msg, list):
        for part in msg:
            if not isinstance(part, dict) or part.get("type") not in ("text", "image_url"):
                raise HTTPException(status_code=400, detail="partes aceitas: text e image_url")
        payload: Dict[str, Any] = {"input": [{"role": "user", "content": msg}], "session_id": session_id}
    else:
        payload = {"input": msg, "session_id": session_id}
    return await _proxy_json("POST", f"{_pfx(profile)}/v1/runs", body=payload, profile=profile)


@router.get("/api/runs/{run_id}")
async def run_status(run_id: str, profile: Optional[str] = None) -> Any:
    if not _RUN_ID_RE.match(run_id):
        raise HTTPException(status_code=400, detail="execução inválida")
    return await _proxy_json("GET", f"{_pfx(profile)}/v1/runs/{run_id}", profile=profile)


@router.post("/api/runs/{run_id}/stop")
async def stop_run(run_id: str, profile: Optional[str] = None) -> Any:
    if not _RUN_ID_RE.match(run_id):
        raise HTTPException(status_code=400, detail="execução inválida")
    return await _proxy_json("POST", f"{_pfx(profile)}/v1/runs/{run_id}/stop", body={}, profile=profile)


@router.get("/api/runs/{run_id}/events")
async def run_events(run_id: str, profile: Optional[str] = None):
    """Repassa o SSE da execução (message.delta, tool.started, approval.request, run.completed...)."""
    import httpx
    if not _RUN_ID_RE.match(run_id):
        raise HTTPException(status_code=400, detail="execução inválida")
    key = _api_key(profile)
    pfx = _pfx(profile)

    async def gen():
        try:
            async with httpx.AsyncClient(base_url=_api_base(), timeout=httpx.Timeout(30.0, read=None)) as c:
                async with c.stream("GET", f"{pfx}/v1/runs/{run_id}/events",
                                    headers={"Authorization": f"Bearer {key}", "Accept": "text/event-stream"}) as r:
                    if r.status_code >= 400:
                        text = (await r.aread())[:300].decode(errors="replace")
                        payload = _gateway_sse_error(profile, r.status_code, text)
                        yield f"event: error\ndata: {json.dumps(payload)}\n\n".encode()
                        return
                    async for chunk in r.aiter_bytes():
                        yield chunk
        except Exception as exc:
            yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n".encode()

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/api/sessions/{session_id}/chat/stream")
async def chat_stream(session_id: str, body: ChatBody, profile: Optional[str] = None):
    pfx = _pfx(profile)
    """Repassa o SSE do gateway tal qual (eventos run.started, assistant.delta, tool.progress,
    assistant.completed, run.completed, error, done)."""
    import httpx

    msg = body.message
    if isinstance(msg, str):
        msg = msg.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="mensagem vazia")
    if isinstance(msg, list):
        for part in msg:
            if not isinstance(part, dict) or part.get("type") not in ("text", "image_url"):
                raise HTTPException(status_code=400, detail="partes aceitas: text e image_url")
    key = _api_key(profile)

    async def gen():
        try:
            async with httpx.AsyncClient(base_url=_api_base(), timeout=httpx.Timeout(30.0, read=600.0)) as c:
                async with c.stream("POST", f"{pfx}/api/sessions/{session_id}/chat/stream",
                                    headers={"Authorization": f"Bearer {key}", "Accept": "text/event-stream"},
                                    json={"message": msg}) as r:
                    if r.status_code >= 400:
                        detail = (await r.aread()).decode("utf-8", "replace")[:400]
                        payload = _gateway_sse_error(profile, r.status_code, detail)
                        yield f"event: error\ndata: {json.dumps(payload)}\n\n".encode()
                        return
                    async for chunk in r.aiter_bytes():
                        yield chunk
        except Exception as exc:
            yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n".encode()

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ── aprovação de comandos ─────────────────────────────────────────────────────────
# O gateway pausa comandos perigosos e emite "approval.request" no stream do chat. O app mostra
# o pedido com botões e responde por aqui (POST /v1/runs/{run_id}/approval no gateway).

_RUN_ID_RE = _re.compile(r"^[A-Za-z0-9_-]{1,80}$")
_APPROVAL_CHOICES = {"once", "session", "always", "deny"}


class ApprovalBody(BaseModel):
    choice: str
    request_id: Optional[str] = None


@router.post("/api/runs/{run_id}/approval")
async def run_approval(run_id: str, body: ApprovalBody, profile: Optional[str] = None) -> Any:
    if not _RUN_ID_RE.match(run_id):
        raise HTTPException(status_code=400, detail="execução inválida")
    choice = (body.choice or "").strip().lower()
    if choice not in _APPROVAL_CHOICES:
        raise HTTPException(status_code=400, detail="escolha inválida")
    payload: Dict[str, Any] = {"choice": choice}
    request_id = (body.request_id or "").strip()
    if request_id:
        if not _RUN_ID_RE.match(request_id):
            raise HTTPException(status_code=400, detail="pedido inválido")
        payload["request_id"] = request_id
    return await _proxy_json("POST", f"{_pfx(profile)}/v1/runs/{run_id}/approval", body=payload, profile=profile)


# ── modo de aprovação (approvals.mode) ────────────────────────────────────────────
# manual = sempre pergunta; smart = um modelo auxiliar decide quando perguntar; off = nunca pergunta.
# Vale por agente (perfil): cada perfil tem o seu config.yaml.

_APPROVAL_MODES = ("manual", "smart", "off")


class ApprovalModeBody(BaseModel):
    mode: str


def _profile_config_scope(profile: Optional[str]):
    """Escopo de config do perfil pedido; sem perfil (ou default) usa o config do próprio painel."""
    from contextlib import nullcontext
    prof = (profile or "").strip().lower()
    if not prof or prof == "default":
        return nullcontext()
    if not _PROFILE_RE.match(prof):
        raise HTTPException(status_code=400, detail="perfil inválido")
    try:
        from hermes_cli.web_server_profiles import _config_profile_scope
    except Exception:
        raise HTTPException(status_code=501, detail="Esta versão do Hermes não permite ajustar outro agente por aqui.")
    return _config_profile_scope(prof)


def _approval_mode_read() -> str:
    from hermes_cli.config import load_config
    mode = str((load_config().get("approvals") or {}).get("mode") or "manual").strip().lower()
    return mode if mode in _APPROVAL_MODES else "manual"


@router.get("/api/approvals")
def approvals_get(profile: Optional[str] = None) -> Dict[str, Any]:
    try:
        with _profile_config_scope(profile):
            return {"mode": _approval_mode_read(), "modes": list(_APPROVAL_MODES)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Não foi possível ler a configuração: {exc}")


@router.post("/api/approvals")
def approvals_set(body: ApprovalModeBody, profile: Optional[str] = None) -> Dict[str, Any]:
    mode = (body.mode or "").strip().lower()
    if mode not in _APPROVAL_MODES:
        raise HTTPException(status_code=400, detail="modo inválido")
    try:
        with _profile_config_scope(profile):
            from hermes_cli.config import load_config, save_config
            cfg = load_config()
            approvals = dict(cfg.get("approvals") or {})
            approvals["mode"] = mode
            cfg["approvals"] = approvals
            save_config(cfg)
            return {"mode": _approval_mode_read(), "modes": list(_APPROVAL_MODES)}
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("treg-pwa: falha ao salvar approvals.mode")
        raise HTTPException(status_code=500, detail=f"Não foi possível salvar: {exc}")


# ── transcrição de áudio (STT) ────────────────────────────────────────────────────
# Configuração feita pela aba do plugin, sem terminal. Grava o mesmo que:
#   hermes config set GROQ_API_KEY ... ; hermes config set stt.provider groq ; ...
# O Hermes resolve chave e config a cada transcrição: vale na hora, sem reiniciar.

_STT_KEY_ENV = "GROQ_API_KEY"
_STT_MODEL = "whisper-large-v3"
_STT_LANGS = {"pt", "en", "es"}


class SttBody(BaseModel):
    key: Optional[str] = None       # vazio = mantém a chave já salva
    language: str = "pt"


def _stt_key() -> str:
    try:
        from hermes_cli.config import get_env_value
        return (get_env_value(_STT_KEY_ENV) or "").strip()
    except Exception:
        return (os.environ.get(_STT_KEY_ENV) or "").strip()


def _stt_status() -> Dict[str, Any]:
    cfg: Dict[str, Any] = {}
    try:
        from hermes_cli.config import load_config
        cfg = load_config().get("stt") or {}
    except Exception:
        pass
    key = _stt_key()
    provider = str(cfg.get("provider") or "")
    return {
        "has_key": bool(key),
        "key_preview": (key[:4] + "…" + key[-4:]) if len(key) >= 12 else "",
        "provider": provider,
        "language": str(cfg.get("language") or ""),
        "model": str((cfg.get("groq") or {}).get("model") or ""),
        "active": bool(key) and provider == "groq",
    }


async def _stt_check_key(key: str) -> Optional[str]:
    """Confere a chave no Groq. Devolve None se estiver válida, ou a mensagem de erro."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.groq.com/openai/v1/models",
                                 headers={"Authorization": f"Bearer {key}"})
    except Exception as exc:
        return f"Não foi possível falar com o Groq: {exc}"
    if r.status_code == 200:
        return None
    if r.status_code in (401, 403):
        return "O Groq recusou a chave. Confira se copiou a chave inteira."
    return f"O Groq respondeu com erro {r.status_code}."


@router.get("/api/stt")
def stt_get() -> Dict[str, Any]:
    return _stt_status()


@router.post("/api/stt")
async def stt_save(body: SttBody) -> Dict[str, Any]:
    key = (body.key or "").strip()
    language = (body.language or "pt").strip().lower()
    if language not in _STT_LANGS:
        raise HTTPException(status_code=400, detail="Idioma não suportado.")
    if key and not _re.fullmatch(r"gsk_[A-Za-z0-9]{20,}", key):
        raise HTTPException(status_code=400, detail="Chave inválida. A chave do Groq começa com gsk_.")
    effective = key or _stt_key()
    if not effective:
        raise HTTPException(status_code=400, detail="Informe a chave do Groq.")
    error = await _stt_check_key(effective)
    if error:
        raise HTTPException(status_code=400, detail=error)
    try:
        from hermes_cli.config import load_config, save_config, save_env_value
        if key:
            save_env_value(_STT_KEY_ENV, key)
        cfg = load_config()
        stt = dict(cfg.get("stt") or {})
        stt["provider"] = "groq"
        stt["language"] = language
        groq = dict(stt.get("groq") or {})
        groq["model"] = _STT_MODEL
        groq["language"] = language
        stt["groq"] = groq
        cfg["stt"] = stt
        save_config(cfg)
    except Exception as exc:
        _log.exception("treg-pwa: falha ao salvar a configuração de transcrição")
        raise HTTPException(status_code=500, detail=f"Não foi possível salvar: {exc}")
    return _stt_status()


@router.delete("/api/stt")
def stt_delete() -> Dict[str, Any]:
    try:
        from hermes_cli.config import remove_env_value
        remove_env_value(_STT_KEY_ENV)
        os.environ.pop(_STT_KEY_ENV, None)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Não foi possível remover: {exc}")
    return _stt_status()


# Catch-all estático: DEVE ficar por último para não engolir /qr.svg e /api/*.
@router.get("/{name}", include_in_schema=False)
def static(name: str):
    entry = _STATIC.get(name)
    if entry is None:
        raise HTTPException(status_code=404, detail="Not found")
    media, path = entry
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    headers = dict(_NO_STORE)
    if name == "sw.js":
        headers["Service-Worker-Allowed"] = "./"
    return FileResponse(str(path), media_type=media, headers=headers)
