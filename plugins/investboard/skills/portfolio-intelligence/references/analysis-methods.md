# Analysis methods

Use only the sections needed for the investor's question. Prefer a supplied
analytics report's documented calculation when interpreting its results; label
any separately calculated metric with its own method and scope.

## Scope and denominator

Distinguish the selected portfolio, listed investments, equity book and total
wealth. Use the stated denominator consistently. A securities export does not
establish that property, pensions, cash or private assets are absent.

For a value-based analysis, use comparable valuations in one base currency,
with the valuation and foreign-exchange dates stated. A supplied weight-based
analysis can use those weights if their scope and denominator are known.
Account or holding weights from different denominators cannot simply be added.

Keep unresolved and unvalued positions visible. Report a known subset as a
subset; do not silently renormalize it to 100%. A coverage percentage must say
what is covered: fund constituents, issuer identity, classification or returns.
Leveraged funds, derivatives, short positions and liabilities need explicit
exposure definitions; ordinary long-only weight calculations cannot represent
them as if they were fully valued positive holdings.

## Look-through

For a long-only fund with disclosed constituent weights, the portfolio weight
of an underlying position is the fund's portfolio weight multiplied by the
position's weight inside the fund. Use fractions consistently in calculations.
Add the investor's direct exposure to that security and the contributions from
other funds. For example, a hypothetical 20% portfolio holding in a fund whose
constituent is 5% contributes 1% portfolio exposure to that constituent.

Count multiple lots of the same fund once when comparing funds, while adding
their actual portfolio weights. Resolve security identity using reliable
identifiers, not a ticker spelling alone. Aggregate issuer exposure separately
using verified issuer identities; different securities or share classes can
belong to one issuer without being the same security.

For nested funds, multiply weights along the evidenced path. Stop at missing
constituent data or a repeated fund identity and retain that weight as unresolved.
Count the fund wrapper or its decomposed underlying exposure in a total, never
both. Preserve cash and undisclosed remainders. Top holdings alone are partial
coverage; do not distribute the rest among the visible holdings.

State constituent dates and whether weights describe holdings, an index or a
proxy. An index composition is not automatically the fund's actual portfolio,
especially for synthetic replication. Keep issuer geography, revenue exposure,
listing currency and economic currency exposure distinct.

## Overlap

For two distinct long-only funds with constituent weights on compatible bases,
weighted holdings overlap is `sum(min(weight_A, weight_B))` over shared security
identities. Sum duplicate constituent lines before taking each minimum. This
measures shared fund weight, not the investor's total duplicated exposure.

When using partial constituent lists, describe the observed overlap as a lower
bound and state each fund's coverage. An empty observed intersection does not
prove that incomplete funds have no overlap. Compare identical funds held at
different brokers as repeated ownership, not as two distinct fund alternatives.

To describe this portfolio, weight the underlying exposures by the investor's
actual allocations and combine them with direct holdings. Do not add pairwise
overlap percentages into a portfolio-wide percentage; shared exposures can be
counted repeatedly across several pairs.

## Diversification and concentration

Report the largest economic exposures and relevant asset-class, issuer,
sector, geographic or currency groupings. Multiple funds can own many of the
same investments. Overlap can be intentional; assess its significance against
the investor's stated goals rather than declaring it inherently wrong.

Keep unknown classifications in the denominator and label them. Issuer
concentration within an equity book and concentration across the whole
portfolio answer different questions. Do not infer economic diversification
from fund count, sector labels or historical correlation alone.

For a complete, nonnegative, fully resolved distribution whose weights sum to
one, concentration can be described by `HHI = sum(weight_i^2)` and effective
number of exposures by `1 / HHI`. Specify whether the identities are securities
or issuers and which book is measured. With incomplete identity or weight
coverage, show supplied metrics with their documented bounds or mark the
calculation unavailable; a single normalized point estimate would hide gaps.

## Historical correlations

Use date-aligned return observations, not correlations between price levels.
State the source, instruments, start and end dates, frequency, common sample
size, currency basis, and whether the series represents total or price returns.
Align currencies before deriving returns for a base-currency analysis. Do not
mix return conventions or substitute a benchmark without labeling the proxy.

For Pearson correlation, divide the covariance of the paired returns by the
product of their standard deviations. If either standard deviation is zero,
or the usable history is inadequate, the correlation is unavailable. Do not
fill missing returns with zero or pad prices to manufacture a common history.

Pairwise samples with different periods can support qualified pair comparisons,
but are not automatically a coherent covariance matrix for portfolio risk.
Use a consistent sample and compatible inputs before calculating portfolio
volatility or risk contributions. Position weights weight those portfolio
calculations; they are not time-observation weights in a correlation estimate.

Low holdings overlap does not imply low return correlation. If only composition
data is available, explain potential shared risk drivers qualitatively and
mark measured correlation unavailable. With sufficient history, comparisons
across windows can show how correlations varied; describe an actual stress
period separately from a hypothetical scenario.

## Sources

- [SEC: Asset allocation and diversification](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)
  explains diversification across and within asset classes and why several
  funds can still share substantial holdings.
- [NIST: Correlation and covariance](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/weigcorr.htm)
  defines correlation from paired observations, covariance and standard
  deviations. Equal observation weights give the ordinary Pearson form.
