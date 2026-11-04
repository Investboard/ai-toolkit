# Investboard for Gemini CLI

Connect the existing Investboard MCP service and install the four canonical
skills. The extension contains no executable server, hooks or account credentials.

## Install from the stable source

Install from the repository's stable source:

```sh
gemini extensions install https://github.com/Investboard/ai-toolkit --ref main
gemini skills install https://github.com/Investboard/ai-toolkit --path plugins/investboard/skills
```

The first command installs the MCP extension from stable `main`. The second
installs the four skills from their existing canonical directory on the default
branch. The complete plugin and individual skill ZIPs are separate downloads
for other installation routes. Use a current Gemini CLI version.

If a skill is already installed from this source, keep that installation and
use its normal update flow instead of adding another copy.

If Investboard is already configured in Gemini, reuse that server and its
permissions. An existing `settings.json` server named `investboard` takes
precedence over the extension's same-name server. Do not remove credentials or
reconnect an existing account to install the skills.

Restart Gemini CLI and use `/extensions list` and `/skills list` to check that
Investboard and its four skills are available. Installing skills does not create
account access or change an Investboard subscription.

## Connect when needed

Supplied-file workflows work without signing in to Investboard. For live account
tools, use `/mcp auth investboard` when Gemini requests authorization. The remote
endpoint is `https://app.investboard.com/mcp`; OAuth endpoints are discovered
automatically. Review the account and permissions before allowing access. The
extension does not request portfolio-import access.

The full connected workflow requires Investboard Premium. Your Gemini provider
account and quota are separate. Follow a first read with: “Read my Investboard
policy and explain its date and rules. Do not run a check or record a decision.”

## Portable local archive

For an installation that bundles the MCP extension and all four skills together,
prepare a self-contained archive with regular files:

```sh
python3 scripts/prepare-client-installers.py --output-dir /tmp/investboard-client-installers
```

Extract `investboard-gemini-2.1.2.zip` and install the extracted directory with
`gemini extensions install /absolute/path/to/extracted-directory`.
The archive has its manifest at the root and all four skills under `skills/`.
This Gemini archive is separate from the complete plugin and individual skill
downloads.

## Updates

Use Gemini's extension update command when an update is available. The source
and extension are Proprietary; public GitHub availability does not grant an
open-source license.

[Gemini extension guide](https://geminicli.com/docs/extensions/)
· [Investboard installation guide](https://investboard.com/product/ai-toolkit#install)
