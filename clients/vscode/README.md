# Investboard in VS Code / GitHub Copilot

Use VS Code's MCP support to connect the existing Investboard service. This is
a client configuration, not a Visual Studio Marketplace extension or a GitHub
Copilot cloud connector listing.

## Add the connection

First check **MCP: List Servers**. Reuse an existing Investboard server rather
than creating a second connection.

For a new connection, run **MCP: Add Server**, choose **HTTP**, enter
`https://app.investboard.com/mcp` and name the server `investboard`. Choose the
user or workspace scope that fits your project. The equivalent terminal command
is:

```sh
code --add-mcp '{"name":"investboard","type":"http","url":"https://app.investboard.com/mcp"}'
```

[mcp.json](mcp.json) contains the same configuration. Merge its server entry into
your existing configuration; keep other servers and settings.

VS Code also supports an installation URI. Generate the URI and a portable
Gemini archive outside this repository:

```sh
python3 scripts/prepare-client-installers.py --output-dir /tmp/investboard-client-installers
```

`vscode-install-uri.txt` contains the `vscode:mcp/install` link for this server.
Opening it presents VS Code's installation flow; it does not authorize account
access. Use it only if you do not already have this server configured.

## Authorize and verify

Start the server and complete the OAuth flow when VS Code requests it. Check the
Investboard account and requested permissions on the consent page. Do not paste
tokens, passwords or client secrets into `mcp.json` or chat. Workspace or
organization policies may restrict MCP use.

Start with: “Read my Investboard policy and explain its date and rules. Do not
run a check or record a decision.” Confirm that the response belongs to your
account before asking for more.

The four skills also work with files you supply. Connected portfolio analytics
and saved thesis, journal and check-history reads require Investboard Premium;
the assistant provider has separate requirements. Checks save hypothetical
proposals and recording a decision saves the outcome you state. Neither places
orders or transfers money.

[VS Code MCP documentation](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
· [Investboard installation guide](https://investboard.com/product/ai-toolkit#install)
