# Investboard

**Second brain for investing**

Investboard brings your portfolio, personal strategy and investment decisions
together. Understand what you own, set out how you want to invest, and keep the
reasons behind your choices. Bring that context into your AI assistant so each
review can build on what you have already recorded.

Four workflows: Investment Strategy Check, Investment Decision-Making,
Investment Thesis and Portfolio Intelligence.

## Before you connect

All four skills can work with files you supply without an Investboard subscription.
**The full connected experience requires Investboard Premium:** portfolio
analytics and reading saved check history, investment theses and journal entries.
Free accounts include one connection for policy and status, checks and recording
decisions you state. Your AI assistant provider's subscription is separate.
Connecting an assistant does not start a subscription or change your plan.

[Create an Investboard account](https://investboard.com/sign-up) and complete
setup, then return to your assistant to connect.
[Compare Free and Premium](https://investboard.com/pricing).

## Install in ChatGPT or Codex

[Open the published Investboard plugin](https://chatgpt.com/plugins/plugin_asdk_app_6acd243688888191a3eda79bea1ca0d0).
In ChatGPT, install it and choose Try in chat. In Codex, search for Investboard
in the plugin directory and choose its public directory entry. Local marketplace
and personal test entries are separate copies.
The plugin includes all four skills and the account connection. Start a new
conversation with your files, or authorize account tools when you need them.
Workspace policies may require administrator approval. Reuse an existing
Investboard connection.

## Install in Claude Code

Add the [public GitHub marketplace](https://github.com/Investboard/ai-toolkit),
then install the plugin:

```sh
claude plugin marketplace add Investboard/ai-toolkit
claude plugin install investboard@investboard
```

Start a new session. Complete OAuth when you want account access.

## Start with a skill

In Claude, enable code execution and file creation, then open Customize → Skills,
choose Add skill → Upload skill and upload an individual skill ZIP. Enable
the skill and start a new conversation. Supply your own investing.md, notes or
portfolio report, or connect your Investboard account separately.
Each skill folder includes a bilingual account-and-plan README.

For other skill-compatible assistants, install the skill folder using the
assistant's documented skill installation flow. A skill does not sign you in,
grant account access or supply current portfolio data.

## Local ZIP alternative

The plugin ZIP has its manifest, MCP configuration and four skills at the root.
The marketplace ZIP contains an `investboard-marketplace` directory with one
plugin at `plugins/investboard`. Extract the marketplace ZIP before registering it.

In Claude Code, replace the path below with the extracted directory:

```text
/plugin marketplace add /absolute/path/to/investboard-marketplace
/plugin install investboard@investboard
```

In Codex, register the extracted marketplace:

```text
codex plugin marketplace add /absolute/path/to/investboard-marketplace
```

Open the desktop plugin directory, select the Investboard source and install
Investboard. Start a new conversation after installation. These local
marketplace routes are alternatives to the published plugin and public GitHub
marketplace.

The portable plugin also supplies the Agent Plugins format for clients such as
Cursor. Follow the client's local import instructions. Format compatibility does
not certify a particular client version. See the installation guide for current
instructions and the release acceptance record for tested versions.

## Connect your account

Add the remote MCP endpoint `https://app.investboard.com/mcp` with OAuth.
Sign in to your own Investboard account and review the requested permissions.
Enable portfolio sharing only if you want the portfolio tools to read your data.
If you already installed the plugin's MCP connection, use it rather than adding
a second copy of the same server. Existing connections may need a consent upgrade
for `portfolio:read`.

The full connected workflow requires Investboard Premium. Active Free accounts
support one connection and policy, status, check and decision-recording tools.
Premium adds unlimited connections, supported check history, thesis and journal
reads, and portfolio analytics. The assistant provider has separate account,
capability and workspace requirements.

Start by asking: "Read my Investboard policy and explain its date and rules.
Do not run a check or record a decision yet." Inspect the actual tool response.
Then ask for the task you want, such as explaining overlaps or structuring your
own investment thesis. Keep dates, currencies and data coverage with the answer.

Checks save hypothetical proposals. Decisions save only the outcome you state.
The tools do not place orders, transfer money, change your mandate, or edit your
theses and journal reviews. Complete those edits in Investboard. Revoke a
connection or turn off its portfolio sharing in your assistant settings in
Investboard. Revocation does not recall information already shared.

## Updates and license

Download versioned packages and checksums from the installation page or
[public releases](https://github.com/Investboard/ai-toolkit/releases). Preserve a
copy of the previous package if you need to return to it. File-only workflows
have no live account connection and cannot refresh their supplied evidence.
Download versions are separate from the published OpenAI plugin version. A newer
repository commit does not mean its ZIP release is already published.

The package is proprietary, as declared in its manifest. Use is subject to the
linked Investboard terms. No application source or private review credentials
belong in this package.

[Installation guide](https://investboard.com/product/ai-toolkit#install) ·
[Help](https://investboard.com/help) ·
[Privacy](https://investboard.com/privacy) ·
[Terms and license](https://investboard.com/terms)
