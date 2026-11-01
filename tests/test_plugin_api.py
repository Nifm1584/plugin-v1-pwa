import asyncio
import importlib.util
import sys
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("treg_plugin_api", ROOT / "dashboard" / "plugin_api.py")
plugin_api = importlib.util.module_from_spec(SPEC)
sys.modules["treg_plugin_api"] = plugin_api
SPEC.loader.exec_module(plugin_api)


def test_hermes_api_is_served_as_static():
    assert "hermes-api.js" in plugin_api._STATIC
    assert plugin_api._STATIC["hermes-api.js"][1].name == "hermes-api.js"


def test_stop_run_proxies_to_gateway():
    seen = {}

    async def fake_proxy(method, path, *, params=None, body=None, profile=None):
        seen.update({"method": method, "path": path, "body": body, "profile": profile})
        return {"status": "stopping"}

    with patch.object(plugin_api, "_proxy_json", fake_proxy):
        result = asyncio.run(plugin_api.stop_run("run_1", "work"))

    assert result == {"status": "stopping"}
    assert seen == {"method": "POST", "path": "/p/work/v1/runs/run_1/stop", "body": {}, "profile": "work"}


def test_create_session_proxies_to_gateway():
    calls = []

    async def fake_proxy(method, path, *, params=None, body=None, profile=None):
        calls.append({"method": method, "path": path, "params": params, "body": body, "profile": profile})
        return {"session": {"id": "s-new"}}

    with patch.object(plugin_api, "_proxy_json", fake_proxy):
        first = asyncio.run(plugin_api.create_session(plugin_api.NewSession(title="  Nova conversa  "), "work"))
        second = asyncio.run(plugin_api.create_session(plugin_api.NewSession()))

    assert first == {"session": {"id": "s-new"}}
    assert second == {"session": {"id": "s-new"}}
    assert calls[0] == {
        "method": "POST",
        "path": "/p/work/api/sessions",
        "params": None,
        "body": {"source": "api_server", "title": "Nova conversa"},
        "profile": "work",
    }
    assert calls[1] == {
        "method": "POST",
        "path": "/api/sessions",
        "params": None,
        "body": {"source": "api_server"},
        "profile": None,
    }


def test_stop_run_rejects_invalid_id():
    try:
        asyncio.run(plugin_api.stop_run("../bad"))
    except HTTPException as exc:
        assert exc.status_code == 400
    else:
        raise AssertionError("ID inválido deveria ser rejeitado")


def test_capabilities_tolerates_old_gateway():
    async def fake_proxy(*args, **kwargs):
        raise HTTPException(status_code=404, detail="not found")

    with patch.object(plugin_api, "_proxy_json", fake_proxy):
        result = asyncio.run(plugin_api.capabilities("work"))

    assert result["gateway"] is None
    assert result["gateway_error"]["status"] == 404
    assert result["plugin"]["session_search"] is True
    assert result["plugin"]["run_stop"] is True


def test_profile_api_key_reads_profile_env(tmp_path):
    (tmp_path / ".env").write_text("API_SERVER_KEY=profile-key-1234\n", encoding="utf-8")
    with patch.object(plugin_api, "_profile_home", lambda profile: tmp_path):
        assert plugin_api._api_key("work") == "profile-key-1234"


def test_profile_api_key_missing_is_config_error(tmp_path):
    with patch.object(plugin_api, "_profile_home", lambda profile: tmp_path):
        try:
            plugin_api._api_key("work")
        except HTTPException as exc:
            assert exc.status_code == 503
            assert exc.detail["code"] == "profile_api_key_missing"
        else:
            raise AssertionError("perfil sem API_SERVER_KEY deveria falhar")


def test_gateway_auth_errors_are_not_session_errors():
    profile_401 = plugin_api._gateway_error("work", 401, "unauthorized")
    assert profile_401.status_code == 503
    assert profile_401.detail["code"] == "profile_api_auth_failed"

    default_401 = plugin_api._gateway_error(None, 401, "unauthorized")
    assert default_401.status_code == 503
    assert default_401.detail["code"] == "api_key_invalid"

    profile_403 = plugin_api._gateway_error("work", 403, "forbidden")
    assert profile_403.status_code == 403
    assert profile_403.detail["code"] == "profile_forbidden"

    gateway_500 = plugin_api._gateway_error("work", 500, "boom")
    assert gateway_500.status_code == 502
    assert gateway_500.detail["code"] == "gateway_unavailable"


def test_capabilities_exposes_gateway_error_code():
    async def fake_proxy(*args, **kwargs):
        raise HTTPException(status_code=503, detail={"code": "profile_api_key_missing", "message": "sem chave"})

    with patch.object(plugin_api, "_proxy_json", fake_proxy):
        result = asyncio.run(plugin_api.capabilities("work"))

    assert result["gateway"] is None
    assert result["gateway_error"]["code"] == "profile_api_key_missing"
    assert result["gateway_error"]["message"] == "sem chave"


def test_proxy_maps_gateway_401_to_profile_config_error():
    seen = {}

    class FakeResponse:
        status_code = 401
        content = b'{"error":{"message":"Invalid gateway API key"}}'
        text = '{"error":{"message":"Invalid gateway API key"}}'

        def json(self):
            return {"error": {"message": "Invalid gateway API key", "code": "gateway_auth_failed"}}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            seen["headers"] = kwargs.get("headers")

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def request(self, *args, **kwargs):
            return FakeResponse()

    with patch("httpx.AsyncClient", FakeClient), patch.object(plugin_api, "_api_key", lambda profile=None: "test-key"):
        try:
            asyncio.run(plugin_api._proxy_json("GET", "/p/work/api/sessions", profile="work"))
        except HTTPException as exc:
            assert exc.status_code == 503
            assert exc.detail["code"] == "profile_api_auth_failed"
            assert exc.detail["profile"] == "work"
        else:
            raise AssertionError("401 do gateway deveria virar erro de configuração do perfil")

    assert seen["headers"]["Authorization"] == "Bearer test-key"
