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
Use one input basis for the entire calculation. A percentage cannot fill a
missing monetary valuation. When only percentages are supplied, describe the
amounts as notional and report their supplied total before interpreting shares.

Keeping cash outside fund look-through is a decomposition choice, not a new
denominator. For a hypothetical portfolio with 40% cash, a company exposure of
18% of the whole portfolio equals `18 / 60 = 30%` of the non-cash portion.
Use the words "of the whole portfolio" or "of the non-cash portion" only with
the matching calculation. Label percentage-point contributions separately
from percentages within a sleeve. Reconcile all rows on one stated basis.

Keep unresolved and unvalued positions visible. Report a known subset as a
subset; do not silently renormalize it to 100%. A coverage percentage must say
what is covered: fund constituents, issuer identity, classification or returns.
Leveraged funds, derivatives, short positions and liabilities need explicit
exposure definitions; ordinary long-only weight calculations cannot represent
them as if they were fully valued positive holdings.

A connected snapshot covers all imported accounts in scope. Give the valued and
total position counts when they differ. A missing valuation leaves portfolio
wealth unknown. The connected analysis reports `valuedHoldings.largest` and
`valuedHoldings.topTenWeight` for its eligible look-through holdings as shares
of the valued portfolio. Combine a company's parts across asset classes before ranking. Eligible
positions span asset classes and include directly held cash. Exclude
`residual:` rows from the ranking while retaining their value in the
denominator. This applies even when the residual represents an entire opaque
fund. The first page of holdings can mix eligible positions and remainders.

## Look-through

For a long-only fund with disclosed constituent weights, the portfolio weight
of an underlying position is the fund's portfolio weight multiplied by the
position's weight inside the fund. Use fractions consistently in calculations.
Add the investor's direct exposure to that security and the contributions from
other funds. Keep each distinct fund's unresolved amount separate, including
funds that share a ticker and have distinct ISINs. For example, a hypothetical 20% portfolio holding in a fund whose
constituent is 5% contributes 1% portfolio exposure to that constituent.

Count multiple lots of the same fund once when comparing funds, while adding
their actual portfolio weights. Resolve security identity using reliable
identifiers, not a ticker spelling alone. Aggregate issuer exposure separately
using verified issuer identities; different securities or share classes can
belong to one issuer without being the same security.

Investboard's connected view follows one disclosed constituent layer. For a
separate analysis of supplied nested disclosures, multiply weights along the evidenced path. Stop at missing
constituent data or a repeated fund identity and retain that weight as unresolved.
Count the fund wrapper or its decomposed underlying exposure in a total, never
both. Preserve cash and undisclosed remainders. Top holdings alone are partial
coverage; do not distribute the rest among the visible holdings.

State constituent dates and whether weights describe holdings, an index or a
proxy. An index composition is not automatically the fund's actual portfolio,
especially for synthetic replication. Keep issuer geography, revenue exposure,
listing currency and economic currency exposure distinct.

When collecting connected holdings, preserve each returned row ID, including
any asset-class suffix. Use the same view and page size throughout. A complete
traversal has distinct IDs accounting for the reported total and ends with
`nextOffset: null`. An unavailable page, repeated offset or missing rows leaves
a partial list. The per-page `omitted` count can be positive on the final page.
A complete list can still contain opaque exposure or have unvalued positions.
Sum raw `weight` fractions and `value` amounts at the returned precision before
formatting. A row smaller than one display unit still contributes. Direct and
fund provenance describe parts of a row already included in its weight.

## Overlap

For two distinct long-only funds with constituent weights on compatible bases,
weighted holdings overlap is `sum(min(weight_A, weight_B))` over shared security
identities. Sum duplicate lines for each security in each fund before taking the minimum.
The public Investboard engine proportionally scales a long-only fund's list if
its weights total more than 100%. Apply those same effective weights to its
positions, classification coverage and fund overlap. Leave a list below 100%
at its reported weights. If a supplied file has an unexplained total above
100%, establish whether it represents leverage or a data error before applying
this long-only convention. This
measures shared fund weight, not the investor's total duplicated exposure.

For example, suppose two long-only funds are worth EUR 100 each. A reports
75% Alpha and 75% Beta. B reports 80% Alpha and leaves its remainder
undisclosed. Under the public engine's scaling convention A contributes
EUR 50 to each company. Across both funds there is EUR 130 Alpha, EUR 50
Beta and EUR 20 unresolved. The two funds overlap by 50%. If Alpha and Beta
are distinct issuers and all exposure is equity, the 90% attribution gives an
HHI lower bound of 0.485 and an effective issuer upper bound of 2.06186.

For a connected report, compare the reported overlap with the sum of matched
effective weights when those weights are available. If they disagree, report
both readings with their bases and flag the discrepancy. A shared-ticker
remainder row can represent more than one fund. Use its per-fund provenance
to attribute amounts, and mark anything the response does not distinguish as
unresolved.

The overlap coefficient is not the share of an equal-weight blend invested in
common names. For example, if fictional fund A has X=30%, Y=20%, Z=50% and fund B
has X=10%, Y=40%, W=50%, overlap is `min(30, 10) + min(20, 40) = 30%`. The
equal-weight blend instead has 50% in the shared names X and Y. Do not use those
two meanings interchangeably or infer either from fund names alone.

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

In connected analysis, `concentration.issuers` uses valued equities, including
unattributed equity in the denominator. At 50% attributed issuer coverage,
report a measured 50% issuer exposure when present and leave both HHI and
effective issuer count unavailable. Starting at 80% coverage, follow
`metricBounds`: with one identified issuer at 80% and the rest unresolved,
HHI is at least 0.64 and effective count is at most 1.5625. Exact values require
full attribution. Use the unrounded coverage for the threshold. When presenting
fewer digits, round a lower bound downward and an upper bound upward. In a
supplied-file analysis, use the supplied issuer identity across listings while
keeping the distinct securities and their direct and fund exposures visible.
The descriptive analysis does not establish an investor cap
or a mandate breach.

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

If `get_portfolio_correlations` returns `partial` with
`insufficient_valued_coverage`, report any measured pair with its dates,
coefficient and common weeks. Preserve price-return exceptions in
`priceBasisIsins` and their omitted count. Portfolio-weighted mean correlation,
weighted coverage and largest-group share remain unknown when their fields
are null. An interval reported for a measured pair should contain its coefficient.
Flag an inconsistent interval and quote the observed coefficient separately.
A near-zero pair coefficient describes that pair's linear association.

## Dividend timing

For `get_performance_explanation`, read the actual measurement dates and the
wealth bridge's currency and income basis. Adjacent close-to-close windows
include a dividend on the closing date and exclude it on the opening date.
For a single EUR 10 dividend at the shared boundary, recorded income is EUR 10
in the first window, zero in the second and EUR 10 across both. Keep any
missing currency conversion or unvalued interval visible when explaining
income, price and FX. Assign any recorded dividend tax on that same close to
the window ending there. Preserve unknown tax amounts and the bridge residual.

## Sources

- [SEC: Asset allocation and diversification](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)
  explains diversification across and within asset classes and why several
  funds can still share substantial holdings.
- [NIST: Correlation and covariance](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/weigcorr.htm)
  defines correlation from paired observations, covariance and standard
  deviations. Equal observation weights give the ordinary Pearson form.
