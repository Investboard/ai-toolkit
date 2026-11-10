# Two funds. 39% in one company.

In this fictional portfolio, two funds put 39% in the same company. Changing
their weights raises that share to 40.5%, above the investor's own 40% limit.
Follow four copyable prompts to uncover the overlap, check the proposal and
reflect on an explicitly stated decision. Each worked number can be checked.
This is a teaching example, not a transcript of an AI run or a recommendation
to invest. The deliberately high company limit is fictional.

The question: **Would a different fund mix stay within the investor's own
company limit?**

## Before you start

Install [Portfolio Intelligence, Investment Strategy Check and Investment
Decision-Making](../../README.md#four-skills-for-better-investment-decisions)
using your assistant's [installation route](../../README.md#install-in-chatgpt-or-codex).
Use a new conversation. Your provider's account requirements, quota and fees
still apply. No Investboard account or subscription is needed for the demo.

Save the files below using GitHub's raw-file download control. Attach them at
the step where they are needed. These are assistant attachments, not import
templates. All identifiers, dates, weights, rules and decisions are fictional.

| File | Use it for |
| --- | --- |
| [sample-portfolio.csv](sample-portfolio.csv) | Current 60% Global Fund, 30% Technology Fund, 10% cash |
| [sample-fund-holdings.csv](sample-fund-holdings.csv) | Companies inside each fund |
| [sample-strategy.md](sample-strategy.md) | The fictional investor's rules and proposed internal shift |
| [sample-proposal.csv](sample-proposal.csv) | Proposed 45% / 45% / 10% mix |
| [sample-decision-review.md](sample-decision-review.md) | An explicit deferred choice and later observations |

Keep this file-only throughout. In each prompt, ask the assistant to use the
attachments without account tools, browsing, imports or saved records. An
installed MCP connection can stay as it is; you do not need to reconnect or
change permissions. If your assistant cannot read CSV attachments, use a client
that supports files or paste their full contents into the conversation.

## 1. Start with what you own

Attach the portfolio and fund-holdings CSVs. Send:

```text
Use Portfolio Intelligence. Explain this fictional portfolio using only the
two attached CSVs. Show each company's exposure through each fund and as a
percentage of the whole portfolio. Keep cash separate. State the snapshot
date, currency and constituent coverage. Do not browse, call account tools,
import data or save records. Do not infer returns or historical correlations.
```

**Check the answer:** January 31, 2026; EUR base currency; weights rather than
money values. Both funds have 100% constituent coverage within this synthetic
dataset. Company A is 39%, B 27%, C 12%, D 6%, E 6%, and cash 10%.

Company A's exposure is `60% × 40% + 30% × 50% = 39%` of the whole portfolio.
See the [complete contribution table](README.md#check-your-result).

## 2. Look beneath the fund names

Keep the same two attachments. Send:

```text
Use Portfolio Intelligence with the same files only. Which companies appear
in both funds? Distinguish their combined share of my whole portfolio from
the two funds' weighted overlap coefficient. Show each calculation and its
denominator. If you discuss an equal-weight blend, calculate that separately.
Do not call account tools, browse, save anything or infer correlations.
```

**Check the answer:** A and B appear in both funds. Together they make up
**66% of the whole portfolio**. The funds’ matched-weight overlap is **70%**:
`min(40,50) + min(30,30)`. These answer different questions: your exposure to
shared companies, and how much constituent weight can be matched between funds.

Continue to the strategy comparison below. The extra denominator checks here
are useful if you want to inspect the arithmetic more closely.

<details>
<summary>Optional: why 66%, 70% and 75% are different</summary>

Three different questions produce three different numbers:

| Question | Result | Calculation and basis |
| --- | ---: | --- |
| How much of the current portfolio is in A and B? | 66% | `39 + 27`, whole portfolio including cash |
| What weight can be matched company by company between the funds? | 70% | `min(40,50) + min(30,30)`, each fund normalized separately |
| What share of an equal-weight blend would be in common names? | 75% | `((40 + 30) + (50 + 30)) / 2`, hypothetical 50/50 fund blend, excluding cash |

If the assistant introduces a non-cash denominator, A+B is `66 / 90 = 73.33%`
of the current non-cash portion. It is not 66% of that portion. Fund overlap
does not establish historical return correlation or future diversification.

</details>

## 3. Compare a proposal with the investor's strategy

Now attach the strategy and proposal, keeping both original CSVs available.
Send:

```text
Use Investment Strategy Check. Compare sample-proposal.csv with the current
portfolio and the rules in sample-strategy.md, using the supplied constituent
weights. This moves 15 percentage points from Global Fund to Technology Fund,
with no new money and no cash change. Show current and proposed exposures and
each rule's result. Separate a fund composition metric from my portfolio mix.
Use these files only: no account tools, browsing, saved check or trade. Explain
the trade-offs and missing evidence; do not choose an investment for me.
```

**Check the answer:**

| Whole-portfolio exposure | Current | Proposed | Change in percentage points |
| --- | ---: | ---: | ---: |
| Company A | 39% | 40.5% | +1.5 |
| Company B | 27% | 27% | 0 |
| Company C | 12% | 9% | -3 |
| Company D | 6% | 4.5% | -1.5 |
| Company E | 6% | 9% | +3 |
| Cash | 10% | 10% | 0 |
| Total | 100% | 100% | 0 |

The proposal gives A `45% × 40% + 45% × 50% = 40.5%` of the whole portfolio.

| Fictional investor's rule | Current | Proposed |
| --- | --- | --- |
| Equities between 60% and 90%, inclusive | 90%: within range | 90%: within range |
| Cash at least 10% | 10%: at floor | 10%: at floor |
| Each underlying company at most 40% | Largest is A, 39%: within limit | A, 40.5%: exceeds ceiling by 0.5 percentage points |

The fund-pair overlap coefficient stays **70%**, because the underlying fund
compositions have not changed. A+B's combined portfolio exposure rises from
**66% to 67.5%**. A larger Technology Fund position does not reduce this
portfolio's largest company exposure. This is a comparison against supplied
rules, not a saved compliance verdict or a complete assessment of suitability.

There are no prices, fees, taxes, liquidity facts, return series or forecasts.
The files cannot establish whether either mix would perform better. The 40%
ceiling belongs only to this fictional exercise and is not a suggested limit.

## 4. Keep the reason, then reflect on it

Attach the decision-review file **only now**. Its stated choice and later
observation are scenario inputs, not permission to write account records.
Send:

```text
Use Investment Decision-Making with sample-decision-review.md and the earlier
files only. First draft a short record of the investor's explicitly deferred
February 1 choice, its reason and what they said they need before reconsidering.
Then reflect as of February 14 using only the supplied observation. Distinguish
the original January 31 snapshot, the stated choice, missing new evidence and
the investor's next review date. Do not infer a new choice, current holdings,
execution or performance. No account tools, saved record, overwrite or reminder.
Label both outputs as fictional scenario drafts, not an account history or an
observed result.
```

**A useful text record would contain:**

> **February 1, 2026: deferred.** The 45/45/10 proposal puts Company A at 40.5%
> of the whole portfolio, exceeding my 40% limit by 0.5 percentage points.
> Before reconsidering, I want updated holdings and an allocation below or at
> that ceiling. This is my stated choice, not a trade or a saved account record.

**A useful reflection would contain:**

> **February 14, 2026: evidence still missing.** No updated holdings or revised
> proposal were supplied. The January 31 calculation remains a dated comparison;
> it does not establish today's holdings. There is no basis to judge subsequent
> returns or declare the decision successful. No new choice was stated. The
> investor's next review date is February 28; no reminder has been scheduled.

The rule breach explains the supplied choice. The earlier “revisit” trigger
alone did not authorize or imply deferral. In a real workflow, an assistant
should ask for the investor's choice rather than invent one. Saved check
outcomes are write-once; these text drafts neither create nor replace one.

## What you have at the end

A look-through table, a clearly defined overlap metric, a proposal compared
with personal rules, and a dated decision reflection. The investor supplies
the rules and makes the choice; the assistant helps keep the evidence straight.

Try changing a weight and rerunning the arithmetic before asking the assistant
to explain it. Preserve totals and state any changed assumptions. For your own
portfolio, replace these files with evidence you choose to share and keep its
dates and coverage visible. Never paste brokerage passwords into a chat.

To reproduce the sample calculations locally with Python 3 and no dependencies:

```sh
python3 examples/portfolio-overlap/verify.py
```

This verifies the files and worked numbers. It does not invoke a model, test
installed plugin behavior or establish a live account connection.

## Try it with the sample portfolio

[Choose your AI agent and install the skills](../../README.md#install-in-chatgpt-or-codex),
then [send the first prompt with the two sample CSVs](#1-start-with-what-you-own)
in a new chat. No Investboard account or broker connection is needed. Your
AI provider's account requirements, quota and fees still apply.

[Return to the simple overlap example](README.md)
