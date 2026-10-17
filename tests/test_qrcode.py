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

def test_qrcode_generation_short_url():
    """Testa geração de QR Code com URL curta (tipoNumber pequeno)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("qrcode", ROOT / "dashboard" / "dist" / "qrcode.js")
    mod = importlib.util.module_from_spec(spec); sys.modules["qrcode"] = mod; spec.loader.exec_module(mod)
    qrcode = mod.qrcode

    url = "https://treg-pwa.example.com/"
    qr = qrcode(1, "L")
    qr.addData(url)
    qr.make()
    svg = qr.createSvgTag(4, 0)
    assert svg is not None
    assert '<svg' in svg
    assert '<path' in svg
    assert 'fill="black"' in svg


def test_qrcode_generation_medium_url():
    """Testa geração de QR Code com URL média (tipoNumber médio)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("qrcode", ROOT / "dashboard" / "dist" / "qrcode.js")
    mod = importlib.util.module_from_spec(spec); sys.modules["qrcode"] = mod; spec.loader.exec_module(mod)
    qrcode = mod.qrcode

    url = "https://treg-pwa.example.com/treg?session=abc123&agent=default&lang=pt-BR"
    qr = qrcode(5, "M")
    qr.addData(url)
    qr.make()
    svg = qr.createSvgTag(4, 0)
    assert svg is not None
    assert '<svg' in svg
    assert '<path' in svg
    assert 'fill="black"' in svg


def test_qrcode_generation_long_url():
    """Testa geração de QR Code com URL longa (tipoNumber >= 7, exige setupPositionAdjustPattern)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("qrcode", ROOT / "dashboard" / "dist" / "qrcode.js")
    mod = importlib.util.module_from_spec(spec); sys.modules["qrcode"] = mod; spec.loader.exec_module(mod)
    qrcode = mod.qrcode

    # URL longa similar a uma sessão do PWA com parâmetros de autenticação
    url = "https://treg-pwa.example.com/api/plugins/treg-pwa/?session=xyz789&agent=default&lang=pt-BR&timestamp=1234567890&signature=abcdef1234567890abcdef1234567890abcdef12"
    qr = qrcode(10, "H")
    qr.addData(url)
    qr.make()
    svg = qr.createSvgTag(4, 0)
    assert svg is not None
    assert '<svg' in svg
    assert '<path' in svg
    assert 'fill="black"' in svg
    # Verifica que o SVG contém múltiplos caminhos (módulos do QR code preenchidos)
    assert svg.count('<path') > 10

def test_qrcode_roundtrip_short():
    """Testa que QR Code curto pode ser gerado e renderizado sem erro."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("qrcode", ROOT / "dashboard" / "dist" / "qrcode.js")
    mod = importlib.util.module_from_spec(spec); sys.modules["qrcode"] = mod; spec.loader.exec_module(mod)
    qrcode = mod.qrcode

    url = "https://treg.example.com/"
    qr = qrcode(1, "L")
    qr.addData(url)
    qr.make()
    svg = qr.createDataURL(4, 0)
    assert svg.startswith("data:image/gif;base64,")
    assert len(svg) > 100

def test_qrcode_roundtrip_long():
    """Testa que QR Code longo pode ser gerado e renderizado sem erro."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("qrcode", ROOT / "dashboard" / "dist" / "qrcode.js")
    mod = importlib.util.module_from_spec(spec); sys.modules["qrcode"] = mod; spec.loader.exec_module(mod)
    qrcode = mod.qrcode

    url = "https://treg.example.com/api/plugins/treg-pwa/?session=abc1234567890abcdef&agent=default&lang=pt-BR&token=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    qr = qrcode(10, "H")
    qr.addData(url)
    qr.make()
    svg = qr.createDataURL(4, 0)
    assert svg.startswith("data:image/gif;base64,")
    assert len(svg) > 100