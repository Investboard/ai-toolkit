# Review a rebalance, starting with available cash

**Question:** “My portfolio has drifted. Can new money bring it back to my
chosen targets, and how do the alternatives compare?”

[Open the four-step demo](walkthrough.md#try-it). It uses dated market series
already stored by Investboard and an explicitly illustrative investor plan.
The investor prefers buying underweights when feasible; the exercise compares
that route with existing-cash purchases, sell-and-buy and a smaller-cash hybrid.

## What is real, and what is a scenario?

The four observations in [sample-market-data.csv](sample-market-data.csv) are
from Investboard's FMP benchmark cache, retrieved November 10, 2026:

| EUR listing | 2025-11-10 series value | 2026-11-09 series value | Stored basis |
| --- | ---: | ---: | --- |
| IWDA.AS — iShares Core MSCI World UCITS ETF USD (Acc) | 110.940000 | 128.520000 | Total return |
| EXS1.DE — iShares Core DAX UCITS ETF (DE) | 197.000000 | 216.400000 | Total return |

These are observed, adjusted **series values**, not today's executable quotes.
Each sleeve is valued as `starting notional × end series value / start series value`.
The starting EUR 10,000 book, 70/20/10 targets, ±2 percentage-point bands, EUR 800
cash floor and contribution budgets are illustrative user inputs. They are
not customer data or a suggested allocation. Cash earns zero interest and there
are no interim flows in the scenario. [provenance.json](provenance.json) records
source URLs, dataset stamps, retrieval times, currency evidence and limitations.

## Check the starting point

| Sleeve | Starting notional | Current modeled value | Target | Current weight |
| --- | ---: | ---: | ---: | ---: |
| MSCI World | €7,000.00 | €8,109.25 | 70% | 71.72% |
| DAX | €2,000.00 | €2,196.95 | 20% | 19.43% |
| Portfolio cash | €1,000.00 | €1,000.00 | 10% | 8.84% |
| Total | €10,000.00 | **€11,306.20** | 100% | 100% before rounding |

Round modeled sleeve values to euro cents before planning. Displayed weights
are rounded, so their displayed sum can differ from 100%. The baseline already
meets the ±2-point bands and EUR 800 reserve. **The plan does not require a trade.**

## Compare four ways to proceed

All figures below are gross EUR allocations, before costs and taxes. They are
comparison inputs, not executable orders. A positive cash change is money kept
in portfolio cash; it is not another purchase.

| Route | New money entering portfolio | MSCI World change | DAX change | Portfolio cash change | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| **New-cash buy-only — preferred under this investor's stated preference** | €400.00 | Buy €85.09 | Buy €144.29 | +€170.62 | 70/20/10 to cent rounding; no sale |
| Existing-cash purchases | €0.00 | €0.00 | Buy €64.29 | −€64.29 | 71.72/20.00/8.28%; partial target restoration |
| Sell-and-buy | €0.00 | Sell €194.91 | Buy €64.29 | +€130.62 | 70/20/10 to cent rounding; costs/tax unknown |
| Smaller-cash hybrid | €100.00 | Sell €124.91 | Buy €84.29 | +€140.62 | 70/20/10 to cent rounding; a smaller sale |

All four gross comparisons preserve the reserve and stay within the sample
bands. Existing-cash purchases leave €935.71 cash and remaining drift; they do
not fully restore targets. The baseline remains a fifth valid comparator.
The cash-only purchase fills the DAX gap by moving cash farther below its own
target. Maximum drift remains about 1.72 percentage points, essentially the
same as the baseline; this route does not improve that overall measure.
The preferred route is conditional on this investor's available cash and goals,
not a universal claim that one method is always best.

**Why buy MSCI World when it was overweight?** First include the €400 contribution
in the denominator. Relative to €11,706.20, both fund sleeves are then under their
targets. The €400 is used once: €229.38 of fund purchases and €170.62 retained as
cash. Adding cash is not an investment return.

The conservative lower bound for exact, unrounded buy-only targets is **€278.45**
of new cash before costs. With only €100, a buy-only route remains partial; the
reference verifier checks that it is not reported as fully at target. Future
contributions could change feasibility, but this demo makes no timing or return
forecast and does not guarantee that a future contribution restores targets.

## Reproduce it locally

Python 3 and the standard library are sufficient. No model call, network request
or account connection occurs:

```sh
python3 examples/portfolio-overlap/verify.py
python3 -m unittest discover -s examples/portfolio-overlap -p 'test_*.py'
```

The script derives the current values and four routes from the inputs. It
verifies cash-flow conservation, not provider accuracy or installed AI behavior.
A reader can inspect [sample-proposal.csv](sample-proposal.csv) against that
output. **After-cost feasibility, tax impact and executable share quantities
remain unverified** because their inputs were not supplied. The fund sleeves
also overlap at the company level; this demo does not measure that overlap.

[Try the prompts and draft a decision note](walkthrough.md#try-it).
