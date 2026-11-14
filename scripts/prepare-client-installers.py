"""Prepare native client installers without replacing published release assets."""

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import quote
import zipfile


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "plugins/investboard/skills"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    output = args.output_dir.resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError("Keep generated installers outside the source repository")
    manifest = json.loads((ROOT / "gemini-extension.json").read_text())
    version = manifest["version"]
    plugin = json.loads((ROOT / "plugins/investboard/plugin.json").read_text())
    assert manifest["name"] == plugin["name"] == "investboard"
    assert version == plugin["version"]
    server = json.loads((ROOT / "clients/vscode/mcp.json").read_text())
    config = server["servers"]["investboard"]
    endpoint = manifest["mcpServers"]["investboard"]["httpUrl"]
    assert config == {"type": "http", "url": endpoint}
    assert endpoint == "https://app.investboard.com/mcp"
    install = {"name": "investboard", **config}
    uri = "vscode:mcp/install?" + quote(json.dumps(install, separators=(",", ":")), safe="")
    output.mkdir(parents=True, exist_ok=True)
    (output / "vscode-install-uri.txt").write_text(uri + "\n")
    files = {name: (ROOT / name).read_bytes() for name in (
        "gemini-extension.json", "GEMINI.md"
    )}
    files["LICENSE.md"] = (ROOT / "plugins/investboard/LICENSE.md").read_bytes()
    # Materialize the canonical skills so the archive needs no symbolic links.
    for source in sorted(SKILLS.rglob("*")):
        if source.is_file():
            files["skills/" + source.relative_to(SKILLS).as_posix()] = source.read_bytes()
    assert sum(name.endswith("/SKILL.md") for name in files) == 4
    for skill in SKILLS.iterdir():
        if not skill.is_dir():
            continue
        for member in ("LICENSE", "NOTICE", "LICENSE.md"):
            assert f"skills/{skill.name}/{member}" in files
    assert sum(name.startswith("skills/") for name in files) == 28
    target = output / f"investboard-gemini-{version}.zip"
    if target.exists():
        raise FileExistsError("Use a new output directory; do not replace an archive")
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026, 11, 4, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, content)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert all(archive.read(name) == content for name, content in files.items())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    (output / (target.name + ".sha256")).write_text(f"{digest}  {target.name}\n")
    print(json.dumps({"version": version, "archive": target.name,
                      "sha256": digest, "files": len(files), "skills": 4,
                      "vscode_install_uri": uri}, indent=2))


if __name__ == "__main__":
    main()
