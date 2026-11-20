# Building Toolkit release downloads

From a checkout of the commit intended for release, run the archive tests and build into a new directory outside the checkout.

```sh
python3 -B -m unittest discover -s scripts -p 'test_release_packaging.py'
python3 scripts/prepare-client-installers.py --release --output-dir /tmp/investboard-release-2.1.4
(cd /tmp/investboard-release-2.1.4 && shasum -a 256 -c SHA256SUMS.txt)
```

The release builder reads the committed source at HEAD. The version must agree in the plugin, Claude and Gemini manifests. It creates four individually uploadable skill ZIPs, the complete plugin, both marketplace catalogs in the marketplace ZIP, and the three platform-named Gemini ZIPs. Each path includes the canonical skill instructions, references, LICENSE, NOTICE and licensing scope. The release manifest records the source commit, sizes and SHA-256 digests. The command only creates local files.

For a GitHub release, tag the reviewed commit with the manifest version prefixed with `v`, then attach the generated ZIPs, both checksum files and both JSON manifests to that release. Use the plugin version when comparing installed copies. Existing downloads remain tied to the earlier tag.

For a local Gemini installer or VS Code install URI use the same script without `--release`. See the [Gemini](../clients/gemini/README.md) and [VS Code](../clients/vscode/README.md) instructions.
