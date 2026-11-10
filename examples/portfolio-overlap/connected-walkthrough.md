# Rebalance with new money before you sell

**Connected workflow preview.** This is the intended account-based experience,
prepared ahead of the rebalance MCP integration. The existing connector cannot
generate these rebalance comparisons yet. [Run the supplied-file version
today](walkthrough.md#try-it), without an Investboard account.

Your portfolio has moved away from its targets. Selling is one way back, but
your next contribution may do the job. Ask your assistant to compare the
alternatives against your own plan, then keep the reason for your choice.

The worked case uses real dated market-series observations and an illustrative
investor plan. It is not a customer account or a transcript of a connected run.
The [reference calculation](README.md#reproduce-it-locally) reproduces every
amount below without a model call.

## 1. Read the portfolio and the plan together

In a supported assistant, install Investboard through the [installation
guide](https://investboard.com/product/ai-toolkit#install). Reuse your existing
connection and its permissions. File attachments alone do not create account
access. Use Portfolio Intelligence to establish the evidence before discussing
a change:

> Read my authorized Investboard holdings and mandate. Show allocation, target
> bands, cash reserve and evidence dates for the same portfolio scope. Explain
> whether anything is outside my rules. Do not create a saved check or change
> any records. If required evidence or permissions are missing, say what is
> unavailable.

**The worked case:** €7,000 in MSCI World, €2,000 in DAX and €1,000 cash on
November 10, 2025 becomes a modeled €11,306.20 on November 9, 2026. The resulting
weights are 71.72%, 19.43% and 8.84%. The investor chose 70/20/10 targets, ±2
percentage-point bands and an €800 cash floor. These are example preferences,
not recommended weights. All three sleeves remain within their bands.

The review calls for a comparison. It does not require trading or waiting.
Your own connected result will use your own holdings, mandate and available
evidence; it should not reproduce the sample amounts unless the inputs match.

## 2. Compare new money with the alternatives

The sample investor has €400 outside the portfolio and prefers to buy
underweights before considering sales. The intended integration sends scenario
calculations to Investboard's deterministic rebalance service; the assistant
explains its result. It must not invent a successful tool response or substitute
its own arithmetic while claiming the backend calculated it.

> I have €400 of new investable money and prefer buying underweights before
> selling. Use Investboard's rebalance comparison on the same evidence snapshot.
> Compare keeping things unchanged, contributing €400 without selling, using
> existing cash, selling and buying with no contribution, and a €100 hybrid.
> Keep my reserve intact. Show buys, sales, retained cash, resulting weights,
> remaining drift and cost/tax coverage. Do not save a check or plan. If the
> comparison tool is unavailable, stop and say so.

| Route | New money | MSCI World change | DAX change | Cash change |
| --- | ---: | ---: | ---: | ---: |
| Unchanged | €0.00 | €0.00 | €0.00 | €0.00 |
| New money, no sales | €400.00 | Buy €85.09 | Buy €144.29 | +€170.62 |
| Existing cash | €0.00 | €0.00 | Buy €64.29 | −€64.29 |
| Sell and buy | €0.00 | Sell €194.91 | Buy €64.29 | +€130.62 |
| Smaller-cash hybrid | €100.00 | Sell €124.91 | Buy €84.29 | +€140.62 |

These are **gross sample allocations before costs and tax**, not executable
orders. New money changes the denominator first: after adding €400, both fund
sleeves are below target. Of that contribution, €229.38 buys funds and €170.62
stays in cash. Nothing is counted twice. A contribution is not investment return.

## 3. Check what each route actually achieves

Use Investment Strategy Check to distinguish staying within the bands from
restoring exact targets:

> Compare the scenarios with my stated bands, cash floor and preference.
> Separate exact-target restoration from staying within tolerance. Explain
> which route best fits those stated priorities and what remains unknown. Show
> the minimum new cash needed for a no-sale solution before costs. Also compare
> a €100 buy-only contribution. Do not invent tax estimates, execution prices,
> a trade recommendation or a saved check.

In the sample, the €400 route restores 70/20/10 to cent rounding without a
sale. Sell-and-buy and the hybrid also restore targets gross. Buying DAX with
existing cash leaves 71.72/20.00/8.28%; it fills one gap while moving cash
farther from its own target. It does not reduce maximum drift, which remains
about 1.72 percentage points. It is not an overall improvement by that measure.

The conservative minimum for exact, unrounded buy-only targets is €278.45 of
new cash before costs. With €100, a buy-only contribution reaches approximately
71.10/20.00/8.90%: useful to compare, but not fully at target. All of these gross
routes preserve the sample reserve. The unchanged baseline remains valid.

Costs, spreads, tax inputs, executable quotes and share-dealing rules are not
supplied. The example cannot certify after-cost feasibility or determine
executable quantities from adjusted return-series values.

## 4. Keep the reason for your choice

The sample investor explicitly selects the €400 no-sale candidate for further
review. Investment Decision-Making turns that choice into a note:

> I choose the €400 contribution-only candidate for further review because the
> money is available and I prefer avoiding sales. Draft my reasoning, the
> alternatives I considered and what still needs checking. Acknowledge that
> keeping the portfolio unchanged also fits my bands. Do not describe this as
> executed, infer later performance, save a record or set a reminder.

**Sample note:** “I selected the €400 contribution-only candidate because it
restores my chosen targets gross without selling. Keeping my current allocation
also satisfies my bands. Before implementation I need current dealing quotes,
costs and broker rules. I have not placed an order, and no later outcome is known.”

A conversation draft does not save a thesis or journal review. Current MCP
tools can save an explicitly requested mandate check and an investor-stated
outcome; neither establishes execution. Authorize any such save separately.

## Follow the example now

[Try the sample files and four prompts](walkthrough.md#try-it), inspect the
[source observations](sample-market-data.csv), or [choose your assistant](https://investboard.com/product/ai-toolkit#install).
The file-only route requires no account connection. Your assistant provider's
own requirements, quota and fees apply. Share only the information you choose;
never share brokerage passwords.
