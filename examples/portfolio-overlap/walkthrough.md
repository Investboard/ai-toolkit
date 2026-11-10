# A rebalance review, starting with new cash

Your portfolio has drifted. Before deciding whether to sell, compare what
available cash can achieve and how the other routes fit your own plan.

This walkthrough turns one question into a comparison you can check:
**“Can I move back toward my targets by buying underweights?”** The output is a
before/after table for four routes and a draft decision note with the investor's
reason. It does not execute trades or predict which route will perform best.

## The case

The sample investor starts with €7,000 in MSCI World, €2,000 in DAX and €1,000
cash on November 10, 2025. Their chosen targets are 70/20/10, each with a ±2
percentage-point band, and portfolio cash must stay at or above €800. At the annual
review, €400 of new investable cash is available outside the portfolio. They
prefer buying underweights when feasible.

Those are **illustrative user inputs, not a recommended allocation**. Fund
identities and four dated total-return-series observations are real data from
Investboard's existing FMP cache, through November 9, 2026. The observed series
values model sleeve growth; they are not executable quotes or a customer's
positions. Both listings use EUR. Cash interest is assumed zero and no interim
flows are modeled. See the [exact sources and calculations](README.md).

## Try it

Install Portfolio Intelligence, Investment Strategy Check and Investment
Decision-Making using the [AI-agent installation options](../../README.md#install-in-chatgpt-or-codex)
or [individual skills](../../README.md#install-individual-skills). Start a new
chat. No Investboard account or broker connection is needed. Your AI provider's
account requirements, quota and fees apply. These are chat attachments, not
import templates. Existing account connections need no changes.

Attach files only at the indicated stage:

| File | Stage and purpose |
| --- | --- |
| [sample-portfolio.csv](sample-portfolio.csv) | 1: starting notionals and targets |
| [sample-market-data.csv](sample-market-data.csv) | 1: four sourced, dated total-return-series observations |
| [sample-plan.json](sample-plan.json) | 1: bands, cash reserve, external budgets and preference |
| [provenance.json](provenance.json) | 1: source identities, dataset stamps and limitations |
| [sample-proposal.csv](sample-proposal.csv) | 2: four candidate routes, with signed EUR changes |
| [sample-strategy.md](sample-strategy.md) | 3: the same investor preferences in prose |
| [sample-decision-review.md](sample-decision-review.md) | 4: an explicitly supplied illustrative choice |

The worked answers below are authored reference calculations, not a transcript
or evidence that a model has passed these prompts.

## 1. Understand the drift

Use Portfolio Intelligence with the first four files:

```text
Explain this sample portfolio at its annual review using only the supplied
files. Value each fund sleeve from its starting notional and the observed
same-listing total-return-series ratio, rounding modeled values to EUR cents.
Show current values, weights and drift from the investor's targets. Keep cash
separate. Distinguish observed data from illustrative user inputs. Identify
whether the unchanged baseline still satisfies the bands and cash reserve.
These series values are not executable quotes. Do not infer company-level
diversification, browse, call account tools, import or save anything.
```

**Check:** the modeled total is €11,306.20: MSCI World €8,109.25, DAX €2,196.95
and cash €1,000.00. Current weights are approximately 71.72/19.43/8.84%.
All three remain inside their bands and cash is above €800. The annual review
is a reason to examine options, not an instruction to trade or wait.

## 2. Compare four routes

Now attach sample-proposal.csv. The contribution amount for each route is in
sample-plan.json; do not sum it once per proposal row.

```text
Use Portfolio Intelligence to compare the four proposal routes with the
unchanged baseline. Start with buying underweights using the EUR 400 new
contribution. Also show existing-cash purchases, sell-and-buy and the EUR 100
hybrid. For each route show new external cash, purchases, sales, retained cash,
final portfolio value, final weights and remaining drift. Include incoming
cash in the denominator BEFORE identifying underweights; do not count it twice.
Explain why cash-only purchases do not fully restore targets. Preserve the
cash reserve. Do not treat contributions as returns, assume zero fees or taxes,
forecast future prices or derive executable share quantities. Files only;
no browsing, account tools, trades or saved records.
```

**Check:** the preferred new-cash candidate buys €85.09 MSCI World and €144.29
DAX, retaining €170.62 in cash. No position is sold. The new total is €11,706.20
and the result is 70/20/10 to cent rounding. Both funds are underweight after
the contribution enters the denominator, even though MSCI World was previously
overweight. The contribution is not an investment gain.

Existing cash buys €64.29 DAX, leaving €935.71 cash and a partial result of
approximately 71.72/20.00/8.28%. Sell-and-buy sells €194.91 MSCI World; the
€100 hybrid sells €124.91. Both fund the corresponding DAX purchase and cash
top-up, reaching targets gross. See the [full comparison table](README.md#compare-four-ways-to-proceed).

The cash-only route fixes the DAX gap while moving cash farther below target.
Its maximum drift is still about 1.72 percentage points, so it does not improve
that overall measure. Buying an underweight sleeve is not enough on its own to
claim that the entire portfolio is better balanced.

## 3. Check feasibility against the plan

Attach sample-strategy.md and ask Investment Strategy Check:

```text
Check every route against the supplied target bands, EUR 800 cash floor,
external-cash availability and buy-only preference. Show exact-target status
separately from within-band status. Explain that the unchanged baseline is
already within the bands. Treat the new-cash route as preferred only under the
stated available cash and investor preference, not as a universal best option.
Show the before-cost minimum new cash for exact buy-only targets. If only
EUR 100 were available, show the partial buy-only result and remaining drift;
do not label it fully rebalanced. Fees, spreads, tax inputs, dealing rules and
execution quotes are missing: do not certify after-cost feasibility or invent
an investment recommendation. No account tools or saved check.
```

**Check:** all four reference routes satisfy the reserve and bands gross.
Only the existing-cash route misses exact targets. The conservative lower bound
for exact unrounded buy-only targets is €278.45 before costs; costs could change
the required amount. With €100, buying only leaves approximately 71.10/20.00/8.90%
and is partial, although still within the bands. No future contribution date
or market outcome is promised.

## 4. Capture the investor's choice and reasoning

Only now attach sample-decision-review.md. It explicitly supplies a choice for
the exercise, so the AI does not have to invent one:

```text
Use Investment Decision-Making to draft the investor's explicitly supplied
choice and a reflection on the available evidence as of November 10, 2026.
Explain why the investor selected the EUR 400 buy-only candidate, acknowledge
that doing nothing remains within the bands, and state the missing execution
and cost information. Label it an illustrative text draft. A selected candidate
is not an executed trade; no subsequent outcomes were supplied. Do not infer
a different choice, later returns, a review date or a reminder. No account
tools, save, overwrite or execution.
```

**A useful note:** “I chose to review the €400 new-cash candidate because the
money is available, I prefer to avoid sales, and it restores my targets gross.
I understand that my current portfolio is still within its bands. I have not
placed an order. I still need current quotes, broker dealing rules and costs
before considering implementation. No later investment outcome is known.”

The investor makes the choice. The AI helps connect it to the actual evidence
and stated plan. When real later observations become available, a later review
can use this reason without rewriting it as a performance success.

## Try the rebalance review

[Choose your AI agent and install the skills](../../README.md#install-in-chatgpt-or-codex),
then send the first prompt with the four initial files. For your own review,
use your actual holdings, strategy and available-cash information. Share only
what you choose to disclose; never paste brokerage passwords.

[Verify the worked numbers locally](README.md#reproduce-it-locally).
