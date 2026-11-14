# Rebalance with new money before selling

## Try it

Install Portfolio Intelligence, Investment Strategy Check and Investment
Decision-Making through the [AI Toolkit](https://investboard.com/product/ai-toolkit#install).
Start a new chat. No Investboard account is needed for this file-only exercise.
Your assistant provider's own requirements, quota and fees apply.

Attach sample-portfolio.csv, sample-market-data.csv, sample-plan.json and
provenance.json first. Add the other files only when requested below. These
are chat attachments, not import templates. Existing connections need no changes.

The worked answers are authored reference calculations, not a model transcript.
[Read the case, source observations and comparison](README.md).


## 1. Read portfolio and plan together

~~~text
Use only sample-portfolio.csv, sample-market-data.csv, sample-plan.json and
provenance.json. Value each fund from its dated total-return ratio, rounding
to cents. Aggregate both funds as equities; keep cash separate. Compare the
90/10 class targets, ±2-point bands and €800 reserve. There are no fund-level
targets. Distinguish observations from sample user inputs. No browsing, account
tools, imports or saves.
~~~

## 2. Compare new money with alternatives

~~~text
Attach sample-proposal.csv. Use the offline verify.py reference to compare
the unchanged baseline and all four routes. Show new money, class-level buys
or sales, retained cash, resulting weights and drift. Count the contribution
once before identifying underweights. Explain why the €100 no-sale route keeps
cash instead of buying equities. If you cannot run the script, label arithmetic
unverified rather than claiming a tool result. No account tools or saved record.
~~~

## 3. Check what each route achieves

~~~text
Attach sample-strategy.md. Check bands, reserve and the stated preference.
Separate exact-target restoration from within-band status. Explain the
€145.14 minimum new cash before costs and why the €100 no-sale route is partial.
Preserve unknown taxes, quotes and dealing constraints. Do not choose which
equity fund to trade. No account tools or saved check.
~~~

## 4. Keep the reason for the choice

~~~text
Only now attach sample-decision-review.md. Draft the explicitly supplied
choice and its reason, including the valid unchanged alternative and remaining
checks. Use only evidence available on November 10, 2026. Do not infer execution,
later performance, another choice or a reminder. Do not save or overwrite records.
~~~

## Try your own review

[Choose your AI agent](https://investboard.com/product/ai-toolkit#install), then
use your own holdings, mandate and available-cash inputs. Share only information
you choose; never share brokerage passwords. For an account-based comparison
with `preview_rebalance`, see the [connected workflow](connected-walkthrough.md).

## License

Authored example code, instructions and illustrative investor inputs are
[Apache-2.0](../LICENSE.md). Provider observations are excluded; see
[third-party data](../THIRD_PARTY_DATA.md). The app, hosted MCP backend and
Premium data feeds remain proprietary.
