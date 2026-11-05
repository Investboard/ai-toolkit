# Portfolio overlap: a synthetic example

Try the Portfolio Intelligence skill with two small CSV files. This is a fictional
teaching example: every fund, company, identifier and weight is synthetic. It
contains no customer data, real securities, prices or observed returns.

## Try it

1. Install Portfolio Intelligence using the [toolkit installation options](../../README.md#install-in-chatgpt-or-codex).
2. Save [sample-portfolio.csv](sample-portfolio.csv) and
   [sample-fund-holdings.csv](sample-fund-holdings.csv). On GitHub, open each file
   and use its raw-file download control. Attach both files to a new conversation.
3. Send this prompt:

> Use Portfolio Intelligence with these two synthetic CSV files. Calculate each
> company's share of the total portfolio, identify holdings shared by the two
> funds and explain concentration. Keep cash separate. State the date, currency,
> coverage and missing evidence. Use only these files; do not look up real
> securities, connect an account or save records. Do not infer correlations
> without return series.

No Investboard account or subscription is needed for this example. Your assistant
provider has its own requirements and fees. An existing account connection is
not needed for this file-only task.

## What the files mean

Both files describe the same synthetic snapshot dated **2026-01-31**. The
portfolio's base currency is **EUR**; weights are percentages, not money amounts.

- `sample-portfolio.csv`: `portfolio_weight_pct` is a holding's percentage of
  the **whole portfolio**. The two fund positions and cash sum to 100%.
- `sample-fund-holdings.csv`: `fund_weight_pct` is a company's percentage of
  the **named fund**, not of the whole portfolio. Each fund has 100% constituent
  coverage in this example. Join `fund_id` to the portfolio's `holding_id`.
- `DEMO_*` identifiers are fictional labels, not tickers or ISINs.
- `data_kind=synthetic` labels every row. These CSVs are assistant attachments,
  not Investboard import templates.

## Check your result

Multiply each fund's portfolio weight by each company's weight inside that fund,
then add exposures to the same company.

| Exposure | Via Global Fund | Via Technology Fund | Share of whole portfolio |
| --- | ---: | ---: | ---: |
| Synthetic Company A | 60% × 40% = 24% | 30% × 50% = 15% | **39%** |
| Synthetic Company B | 60% × 30% = 18% | 30% × 30% = 9% | **27%** |
| Synthetic Company C | 60% × 20% = 12% | 0% | **12%** |
| Synthetic Company D | 60% × 10% = 6% | 0% | **6%** |
| Synthetic Company E | 0% | 30% × 20% = 6% | **6%** |
| Cash | — | — | **10%** |
| Total | | | **100%** |

Companies A and B appear in both funds and together represent **66% of the whole
portfolio**. Holding two funds therefore does not mean their company exposures
are distinct.

If you ask for fund-pair weighted overlap, define it as the sum of the smaller
company weight in each fund: min(40%, 50%) + min(30%, 30%) = **70%**. That compares
the funds' compositions; it is different from the 66% portfolio exposure above.

The files contain no return series, so they cannot establish historical
correlation, performance or future diversification. They also contain no sector,
country or revenue data. A useful answer should preserve those limits and avoid
turning this overlap calculation into a trade recommendation.
