# Investboard

**Second brain for investing**

Bring your investment strategy, portfolio and recorded reasoning into your AI assistant. Use four skills with your own reports, or connect Investboard to work with your policy, permitted records and portfolio analytics.

## Before you connect

All four skills can work with files you supply without an Investboard subscription.
**The full connected experience requires Investboard Premium:** portfolio analytics
and reading saved check history, investment theses and journal entries. Free accounts
include one connection for policy and status, checks and recording decisions you state.
Your AI assistant provider's subscription is separate from Investboard Premium.
Connecting an assistant does not start a subscription or change your plan.

[Create an Investboard account](https://investboard.com/sign-up) and complete setup,
then return to your assistant to connect. [Compare Free and Premium](https://investboard.com/pricing).

[Choose your assistant and install Investboard](https://investboard.com/product/ai-toolkit#install)

## Four skills for better investment decisions

| Skill | What it helps you do | Example request |
| --- | --- | --- |
| [Investment Strategy Check](plugins/investboard/skills/investment-strategy-check/SKILL.md) | Connect your goals, allocation rules and constraints to a proposed change. | “Does moving ten percentage points from cash into equities fit my strategy?” |
| [Investment Decision-Making](plugins/investboard/skills/investment-decision-making/SKILL.md) | Work through choices, weigh evidence and alternatives, and revisit your reasoning. | “Help me work through this investment decision and the reasons to wait.” |
| [Investment Thesis](plugins/investboard/skills/investment-thesis/SKILL.md) | Clarify an investment idea, identify assumptions and decide what would change your mind. | “Help me turn these notes into an investment thesis I can review later.” |
| [Portfolio Intelligence](plugins/investboard/skills/portfolio-intelligence/SKILL.md) | Understand fund look-through, overlap, concentration, diversification and historical correlations. | “What do I actually own through these funds, and where do they overlap?” |

Skills work with evidence you supply. They do not sign you in or create access to live account data.

## Install in ChatGPT or Codex

[Open the published Investboard plugin](https://chatgpt.com/plugins/plugin_asdk_app_6acd243688888191a3eda79bea1ca0d0). In ChatGPT, install it and choose **Try in chat**. In Codex, search for Investboard and choose its public directory entry. Local marketplace and personal test entries are separate copies. Start a new conversation with your files, or authorize your Investboard account when you need connected tools. Reuse an existing connection; workspace policies may require administrator approval.

## Install in Claude Code

Add the Investboard marketplace, then install its plugin:

```text
/plugin marketplace add Investboard/ai-toolkit
/plugin install investboard@investboard
```

Start a new conversation. The plugin includes all four skills and the Investboard MCP connection. Complete OAuth when you want account access; review the requested permissions before connecting.

## Install individual skills

Use a skills-compatible assistant and choose the skills you want:

```sh
npx skills add Investboard/ai-toolkit
```

For Claude chat, download an [individual skill ZIP](https://github.com/Investboard/ai-toolkit/releases/latest), enable code execution and file creation, then open Customize → Skills → Add skill → Upload skill. Enable the skill and start a new conversation.

The repository also includes a portable Agent Plugins manifest and a Codex marketplace catalog. Follow the [installation guide](https://investboard.com/product/ai-toolkit#install) for your client. A client must support the relevant skill or plugin format; account and workspace requirements vary by provider.

## Connect your Investboard account

Use the direct remote MCP endpoint with OAuth:

```text
https://app.investboard.com/mcp
```

Sign in to your own Investboard account. If you already have this connection, use it instead of adding a duplicate. Portfolio access requires `portfolio:read` consent and enabled portfolio sharing in Investboard.

Start with: “Read my Investboard policy and explain its date and rules. Do not run a check or record a decision yet.”

### Ten connected tools

| Tools | Capability |
| --- | --- |
| `get_policy`, `get_status` | Read your investment mandate and its current standing. |
| `check_action`, `record_decision` | Save a hypothetical check and record an outcome you explicitly state. |
| `get_reflection_history`, `get_own_record`, `get_journal` | Retrieve permitted checks, theses and journal entries. |
| `get_portfolio_holdings`, `get_portfolio_analysis`, `get_portfolio_correlations` | Read holdings, fund exposures and historical portfolio analytics. |

The full connected workflow requires **Investboard Premium**. Active Free accounts support one connection and policy, status, check and decision-recording tools. Premium adds unlimited connections, supported check history, thesis and journal reads, and portfolio analytics. Your assistant provider has separate requirements.

Checks and stated decisions are saved in your account. The tools do not submit orders, transfer money, change your mandate, or edit theses and journal reviews. Portfolio reads can include holding values when authorized; they do not return brokerage credentials or account numbers. Keep evidence dates, currencies and coverage with any interpretation. Historical correlations do not guarantee future diversification.

Manage permissions, portfolio sharing and revocation in Investboard’s assistant settings. Revocation stops future access; it does not recall information already shared.

## Downloads and updates

[Download the latest release](https://github.com/Investboard/ai-toolkit/releases/latest) for the complete plugin, marketplace bundle or individual skills. Release assets include SHA-256 checksums. The website also hosts versioned downloads. A newer repository commit does not mean its ZIP release is already published. Download versions are separate from the published OpenAI plugin version.

Update the installed skills or plugin through your client’s update flow. Update individual ZIP installations by uploading the newer version. Package versions are separate from the MCP server’s Registry version.

## License and help

This distribution is proprietary, as declared in the plugin manifests. Use is subject to the [Investboard terms](https://investboard.com/terms). Public availability does not grant an open-source license.

[Installation guide](https://investboard.com/product/ai-toolkit#install) · [Help](https://investboard.com/help) · [Privacy](https://investboard.com/privacy) · [Terms](https://investboard.com/terms)
