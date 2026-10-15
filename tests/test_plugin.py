import json, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]

def test_manifests():
    m = yaml.safe_load((ROOT / "plugin.yaml").read_text())
    assert m["name"] == "treg-pwa" and m["version"] and m["description"]
    d = json.loads((ROOT / "dashboard" / "manifest.json").read_text())
    assert d["name"] == "treg-pwa" and d["api"] == "plugin_api.py" and d["tab"]["path"] == "/treg"
    for f in ("index.html", "app.js", "app.css", "sw.js", "icon-192.png", "icon-512.png", "icon.svg"):
        assert (ROOT / "dashboard" / "pwa" / f).exists(), f

def test_register_command():
    import importlib.util
    spec = importlib.util.spec_from_file_location("treg_pwa", ROOT / "__init__.py", submodule_search_locations=[str(ROOT)])
    mod = importlib.util.module_from_spec(spec); sys.modules["treg_pwa"] = mod; spec.loader.exec_module(mod)
    seen = []
    class Ctx:
        def register_command(self, name, handler, **kw): seen.append(name); assert "treg" in handler().lower()
    mod.register(Ctx())
    assert seen == ["treg"]
