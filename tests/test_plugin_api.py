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

    async def fake_proxy(method, path, *, params=None, body=None):
        seen.update({"method": method, "path": path, "body": body})
        return {"status": "stopping"}

    with patch.object(plugin_api, "_proxy_json", fake_proxy):
        result = asyncio.run(plugin_api.stop_run("run_1", "work"))

    assert result == {"status": "stopping"}
    assert seen == {"method": "POST", "path": "/p/work/v1/runs/run_1/stop", "body": {}}


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
