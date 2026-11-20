"""Build the local Gemini/VS Code installers or all GitHub release assets."""

import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
from urllib.parse import quote
import zipfile


ROOT = Path(__file__).resolve().parents[1]
PLUGIN = "plugins/investboard/"
EXPECTED_SKILLS = {
    "investment-decision-making": "Investment Decision-Making",
    "investment-strategy-check": "Investment Strategy Check",
    "investment-thesis": "Investment Thesis",
    "portfolio-intelligence": "Portfolio Intelligence",
}
ENDPOINT = "https://app.investboard.com/mcp"
PLATFORMS = ("darwin", "linux", "win32")
SOURCES = [
    "plugins/investboard", ".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json",
    "gemini-extension.json", "GEMINI.md", "clients/vscode/mcp.json",
]


def source_files(release):
    if release:
        # Read immutable Git objects. Local changes and untracked files cannot enter a release.
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        data = subprocess.check_output(["git", "archive", "--format=zip", commit, "--", *SOURCES], cwd=ROOT)
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            return {n: archive.read(n) for n in archive.namelist() if not n.endswith("/")}, commit
    paths = [ROOT / name for name in SOURCES]
    return {
        path.relative_to(ROOT).as_posix(): path.read_bytes()
        for entry in paths
        for path in (entry.rglob("*") if entry.is_dir() else [entry])
        if path.is_file()
    }, None


def subtree(files, prefix):
    return {name[len(prefix):]: data for name, data in files.items() if name.startswith(prefix)}


def zip_bytes(files):
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as archive:
        for name, content in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026, 11, 4, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, content)
    return out.getvalue()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def checksums(artifacts):
    return "".join(f"{sha(data)}  {name}\n" for name, data in sorted(artifacts.items())).encode()


def manifest(data):
    return (json.dumps(data, indent=2) + "\n").encode()


def build(files, commit):
    plugin = subtree(files, PLUGIN)
    skills = subtree(plugin, "skills/")
    declared = {n.split("/")[0] for n in skills}
    if declared != set(EXPECTED_SKILLS):
        raise ValueError("Unexpected skill directory set")
    for skill in declared:
        for name in ["SKILL.md", "README.md", "LICENSE", "NOTICE", "LICENSE.md", "agents/openai.yaml"]:
            if not skills.get(f"{skill}/{name}"):
                raise ValueError(f"Missing {skill}/{name}")
        instructions = skills[f"{skill}/SKILL.md"].decode()
        for reference in re.findall(r"\]\((references/[^)# ]+)", instructions):
            if not skills.get(f"{skill}/{reference}"):
                raise ValueError(f"Missing {skill}/{reference}")

    gemini = json.loads(files["gemini-extension.json"])
    version = gemini["version"]
    configs = [gemini, json.loads(plugin["plugin.json"]), json.loads(plugin[".claude-plugin/plugin.json"])]
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version) or any(
        c["name"] != "investboard" or c["version"] != version for c in configs
    ):
        raise ValueError("Release manifest names/versions disagree")
    vscode = json.loads(files["clients/vscode/mcp.json"])["servers"]["investboard"]
    if vscode != {"type": "http", "url": ENDPOINT} or gemini["mcpServers"]["investboard"]["httpUrl"] != ENDPOINT:
        raise ValueError("Installer endpoints disagree")
    for name in (".mcp.json", "mcp.json"):
        if json.loads(plugin[name])["mcpServers"]["investboard"]["url"] != ENDPOINT:
            raise ValueError(f"Unexpected endpoint in {name}")

    contents = {n: files[n] for n in ("gemini-extension.json", "GEMINI.md")}
    contents["LICENSE.md"] = plugin["LICENSE.md"]
    contents.update({f"skills/{n}": data for n, data in skills.items()})
    gemini_zip = zip_bytes(contents)
    gemini_name = f"investboard-gemini-{version}.zip"
    if commit is None:
        install = {"name": "investboard", **vscode}
        uri = "vscode:mcp/install?" + quote(json.dumps(install, separators=(",", ":")), safe="")
        return {
            gemini_name: gemini_zip, gemini_name + ".sha256": checksums({gemini_name: gemini_zip}),
            "vscode-install-uri.txt": (uri + "\n").encode(),
        }

    artifacts = {}
    for skill in sorted(declared):
        entries = {n: data for n, data in skills.items() if n.startswith(f"{skill}/")}
        artifacts[f"investboard-{skill}-{version}.zip"] = zip_bytes(entries)
    artifacts[f"investboard-plugin-{version}.zip"] = zip_bytes(plugin)
    marketplace = {
        f"investboard-marketplace/{n}": data for n, data in files.items()
        if n.startswith((PLUGIN, ".agents/", ".claude-plugin/"))
    }
    # Ship the install guide and licence for the distributed plugin. The repository
    # README links to source-only examples and evaluations outside this archive.
    for name in ("README.md", "LICENSE.md"):
        marketplace[f"investboard-marketplace/{name}"] = plugin[name]
    artifacts[f"investboard-marketplace-{version}.zip"] = zip_bytes(marketplace)
    platforms = {f"{p}.{gemini_name}": gemini_zip for p in PLATFORMS}
    artifacts.update(platforms)
    artifacts["GEMINI-SHA256SUMS.txt"] = checksums(platforms)
    artifacts["gemini-release.json"] = manifest({
        "schema_version": 1, "name": "investboard", "version": version,
        "source_repository": "https://github.com/Investboard/ai-toolkit",
        "source_ref": commit, "source_commit": commit, "canonical_skill_commit": commit,
        "packager": "scripts/prepare-client-installers.py",
        "assets": sorted(platforms), "platforms": list(PLATFORMS),
        "files": len(contents), "skills": len(declared), "sha256": sha(gemini_zip),
    })
    artifacts["SHA256SUMS.txt"] = checksums(artifacts)
    artifacts["release.json"] = manifest({
        "name": "Investboard", "version": version, "source_commit": commit, "endpoint": ENDPOINT,
        "license": "Skills: Apache-2.0. Plugin wrapper and branding: proprietary. See LICENSE.md.",
        "skills": [{"id": k, "name": v} for k, v in EXPECTED_SKILLS.items()],
        "artifacts": [{"name": n, "bytes": len(data), "sha256": sha(data)} for n, data in sorted(artifacts.items())],
    })
    return artifacts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--release", action="store_true", help="Build the complete GitHub release set from the current commit")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError("Keep generated installers outside the source repository")
    if args.release and output.exists() and any(output.iterdir()):
        raise FileExistsError("Choose an empty or new output directory")
    files, commit = source_files(args.release)
    artifacts = build(files, commit)
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output.parent) as temp:
        prepared = Path(temp) / "assets"
        prepared.mkdir()
        for name, data in artifacts.items():
            (prepared / name).write_bytes(data)
        if args.release or not output.exists():
            prepared.replace(output)
        else:
            # Preserve unrelated installer versions in an existing local output directory.
            archive = next(name for name in artifacts if name.endswith(".zip"))
            if (output / archive).exists():
                raise FileExistsError(f"Installer already exists: {archive}")
            for entry in prepared.iterdir():
                entry.replace(output / entry.name)
    if args.release:
        print(json.dumps({"output": str(output), "source_commit": commit, "assets": sorted(artifacts)}, indent=2))
    else:
        archive = next(name for name in artifacts if name.endswith(".zip"))
        with zipfile.ZipFile(io.BytesIO(artifacts[archive])) as z:
            count = len(z.namelist())
        print(json.dumps({"version": json.loads(files["gemini-extension.json"])["version"],
                          "archive": archive, "sha256": sha(artifacts[archive]), "files": count,
                          "skills": len(EXPECTED_SKILLS),
                          "vscode_install_uri": artifacts["vscode-install-uri.txt"].decode().strip()}, indent=2))


if __name__ == "__main__":
    main()
