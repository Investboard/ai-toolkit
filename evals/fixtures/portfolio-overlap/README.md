# Synthetic portfolio overlap fixtures

These stable inputs belong to the offline evaluation corpus. They were
restored from the original synthetic example in commit c77702f and are kept
here so edits to the public rebalance walkthrough do not change the benchmark.

- sample-portfolio.csv: 60% fictional global fund, 30% fictional technology
  fund and 10% cash, valued on 2026-01-31 in EUR.
- sample-fund-holdings.csv: complete fictional company weights for those funds.

Whole-portfolio company exposures are A=39%, B=27%, C=12%, D=6% and E=6%,
plus 10% cash. The partial-coverage and injected-input cases use compatible
synthetic companion files in the parent fixtures directory.

All fund/company names and weights are synthetic. There are no provider
observations, customer holdings, credentials or return series here. The
separate real-market rebalance demo under examples/ is not an evaluation input.
