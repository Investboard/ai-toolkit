"""Exercise the release layouts used by skill uploads, marketplaces and Gemini."""

import hashlib
import importlib.util
import io
import json
from pathlib import Path
import unittest
import zipfile


spec = importlib.util.spec_from_file_location("installers", Path(__file__).with_name("prepare-client-installers.py"))
installers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installers)


class ReleasePackagingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files, _ = installers.source_files(False)
        cls.version = json.loads(cls.files["gemini-extension.json"])["version"]
        cls.assets = installers.build(cls.files, "a" * 40)

    def check_archive(self, filename, expected):
        with zipfile.ZipFile(io.BytesIO(self.assets[filename])) as z:
            self.assertEqual(set(z.namelist()), set(expected))
            self.assertIsNone(z.testzip())
            for path, data in expected.items():
                self.assertEqual(z.read(path), data, path)

    def test_every_install_path_contains_the_canonical_skills_and_licenses(self):
        plugin = {path.removeprefix("plugins/investboard/"): data for path, data in self.files.items()
                  if path.startswith("plugins/investboard/")}
        self.check_archive(f"investboard-plugin-{self.version}.zip", plugin)
        for skill in installers.EXPECTED_SKILLS:
            entries = {path.removeprefix("skills/"): data for path, data in plugin.items()
                       if path.startswith(f"skills/{skill}/")}
            for file in ["LICENSE", "NOTICE", "LICENSE.md", "SKILL.md"]:
                self.assertIn(f"{skill}/{file}", entries)
            self.check_archive(f"investboard-{skill}-{self.version}.zip", entries)
        marketplace = {f"investboard-marketplace/{path}": self.files[path] for path in
                       [".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json"]}
        for name in ("README.md", "LICENSE.md"):
            marketplace[f"investboard-marketplace/{name}"] = plugin[name]
        marketplace.update({f"investboard-marketplace/plugins/investboard/{path}": data for path, data in plugin.items()})
        self.check_archive(f"investboard-marketplace-{self.version}.zip", marketplace)
        gemini = {k: self.files[k] for k in ("gemini-extension.json", "GEMINI.md")}
        gemini["LICENSE.md"] = plugin["LICENSE.md"]
        gemini.update({k: v for k, v in plugin.items() if k.startswith("skills/")})
        for platform in ("darwin", "linux", "win32"):
            self.check_archive(f"{platform}.investboard-gemini-{self.version}.zip", gemini)

    def test_release_is_reproducible_and_checksums_cover_all_archives(self):
        self.assertEqual(installers.build(self.files, "a" * 40), self.assets)
        manifest = json.loads(self.assets["release.json"])
        self.assertEqual(manifest["version"], self.version)
        self.assertEqual(manifest["source_commit"], "a" * 40)
        self.assertEqual({entry["name"] for entry in manifest["artifacts"]}, set(self.assets) - {"release.json"})
        for entry in manifest["artifacts"]:
            data = self.assets[entry["name"]]
            self.assertEqual(entry["bytes"], len(data))
            self.assertEqual(entry["sha256"], hashlib.sha256(data).hexdigest())
        for sums, expected in [
            ("SHA256SUMS.txt", set(self.assets) - {"SHA256SUMS.txt", "release.json"}),
            ("GEMINI-SHA256SUMS.txt", set(json.loads(self.assets["gemini-release.json"])["assets"])),
        ]:
            pairs = [line.split("  ") for line in self.assets[sums].decode().splitlines()]
            self.assertEqual({name for _, name in pairs}, expected)
            for digest, name in pairs:
                self.assertEqual(digest, hashlib.sha256(self.assets[name]).hexdigest())

    def test_missing_methodology_referenced_by_the_skill_prevents_release(self):
        broken = dict(self.files)
        del broken["plugins/investboard/skills/portfolio-intelligence/references/analysis-methods.md"]
        with self.assertRaisesRegex(ValueError, "portfolio-intelligence/references/analysis-methods.md"):
            installers.build(broken, "a" * 40)

    def test_missing_notice_or_inconsistent_manifest_fails_before_packaging(self):
        broken = dict(self.files)
        del broken["plugins/investboard/skills/portfolio-intelligence/NOTICE"]
        with self.assertRaisesRegex(ValueError, "portfolio-intelligence/NOTICE"):
            installers.build(broken, "a" * 40)
        broken = dict(self.files)
        broken["gemini-extension.json"] = json.dumps({**json.loads(broken["gemini-extension.json"]), "version":"0.0.1"}).encode()
        with self.assertRaisesRegex(ValueError, "versions disagree"):
            installers.build(broken, "a" * 40)
