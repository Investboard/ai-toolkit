# Rebalance with new money before selling

**Question:** “Can my next contribution restore my asset-class targets without
selling, and how do the alternatives compare?”

[Try the four-step file demo](walkthrough.md#try-it), or read the [connected
workflow preview](connected-walkthrough.md). The latter is prepared ahead of
the native rebalance MCP integration; it is not available through the current
connector. The file-only exercise works independently.

## Real observations, illustrative investor inputs

The example starts with €7,000 MSCI World, €2,000 DAX and €1,000 cash on
November 10, 2025. Both funds are **equities**. The investor's chosen class
targets are **90% equities and 10% cash**, with ±2 percentage-point bands and
an €800 reserve. There are no individual fund targets. These starting amounts,
rules and contribution budgets are illustrative, not customer data or advice.

The observations in [sample-market-data.csv](sample-market-data.csv) are real
stored FMP EUR total-return-series values, retrieved November 10, 2026:

| Listing | 2025-11-10 | 2026-11-09 |
| --- | ---: | ---: |
| IWDA.AS, MSCI World | 110.940000 | 128.520000 |
| EXS1.DE, DAX | 197.000000 | 216.400000 |

Each fund's modeled value is its starting notional multiplied by its series
ratio, rounded to cents. These adjusted values are not executable quotes or
share quantities. Cash earns zero interest and there are no interim flows.
[provenance.json](provenance.json) records source identities, dates and hashes.

## Read the starting point

MSCI World becomes €8,109.25 and DAX €2,196.95. Together they are **€10,306.20
equities**; cash remains €1,000. The total is **€11,306.20**, with weights
**91.16% equities / 8.84% cash**. Both are within their bands and the reserve
holds. The plan does not require a trade.

## Compare four ways to proceed

All changes are gross asset-class notionals before fees, spreads and taxes.
The example does not choose which equity holding to buy or sell.

| Route | New money | Equities change | Cash change | Result |
| --- | ---: | ---: | ---: | --- |
| Unchanged baseline | €0.00 | €0.00 | €0.00 | 91.16/8.84%; within bands |
| **€400, no sales** | €400.00 | Buy €229.38 | +€170.62 | 90/10 to cent rounding |
| €100, no sales | €100.00 | €0.00 | +€100.00 | 90.36/9.64%; partial |
| Sell equities, no new money | €0.00 | Sell €130.62 | +€130.62 | 90/10 to cent rounding |
| €100 hybrid | €100.00 | Sell €40.62 | +€140.62 | 90/10 to cent rounding |

The €400 route is preferred under this investor's stated available cash and
preference to avoid sales. After the contribution enters the denominator,
equities become underweight. Of €400, €229.38 restores equities and €170.62 stays
in cash. The contribution is counted once and is not investment return.

With only €100, equities remain overweight, so the no-sale route keeps that
contribution in cash rather than inventing an equity purchase. Maximum drift
falls from about 1.16 to 0.36 percentage points, but exact targets are not
restored. The conservative minimum new cash for exact, unrounded no-sale
targets is **€145.14 before costs**. Existing portfolio cash is below target;
spending it on more equities would move the class allocation farther away.

All sample routes preserve the reserve gross. Fees, taxes, current quotes,
minimum dealing amounts, share lots and fractional-share support are missing;
**after-cost and execution feasibility remain unverified**. No future returns
or contribution timing are promised. The funds may share companies; their
company-level overlap is not measured here.

## Reproduce it locally

Python 3 and its standard library are sufficient. No model, network or account
call occurs:

~~~sh
python3 examples/portfolio-overlap/verify.py
python3 -m unittest discover -s examples/portfolio-overlap -p 'test_*.py'
~~~

The verifier checks source identity, cash conservation, scenario constraints
and partial progress. It is an independent reference, not a native-MCP or model
behavior pass. [Continue with the prompts](walkthrough.md#try-it).
