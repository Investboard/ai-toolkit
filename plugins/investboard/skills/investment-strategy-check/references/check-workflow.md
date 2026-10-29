# Check inputs and results

Use the connected server's advertised schemas. The MCP 2.0.0 check interface
accepts `action_type`, optional `legs` (1 to 20 when supplied), optional
`funding` and `rationale`, and an optional setup reference supplied by an
actual connection guide. Do not
invent a setup reference. Supported action types are `buy`, `sell`,
`rebalance`, `hold`, `contribute` and `withdraw`.

Each leg has `side` (`buy` or `sell`), `subject` (`{ isin }` or
`{ asset_class }`) and `amount` (`{ eur }` or `{ pct_of_portfolio }`). Amounts
in portfolio percent use 0 to 100, not fractions. An ISIN belongs inside a leg,
not at the top level. The legacy single-class fields remain accepted, but
prefer explicit legs for a concrete multi-sided proposal.

A requested no-change check can use `{ "action_type": "hold" }` without legs.
Do not send `legs: []` or invent a zero-value buy or sell to represent holding:
an explicitly supplied empty array fails the schema. If the investor only
asks how their mandate currently stands, read `get_status` instead of creating
a check they did not request.

## Funding changes the meaning

`within_book` is the default: the book keeps its size and each leg moves its
own class. A buy funded from existing cash needs a cash sell leg. The action
type does not supply the missing funding side.

For this hypothetical, explicitly requested internal shift:

```json
{
  "action_type": "rebalance",
  "funding": "within_book",
  "legs": [
    {
      "side": "sell",
      "subject": { "asset_class": "cash" },
      "amount": { "pct_of_portfolio": 10 }
    },
    {
      "side": "buy",
      "subject": { "asset_class": "equities" },
      "amount": { "pct_of_portfolio": 10 }
    }
  ]
}
```

`new_money` describes money from outside the book: buy legs increase the
denominator as well as the purchased exposure. A contribution of 10% of the
current portfolio is not automatically a ten-percentage-point allocation
shift. Do not use `new_money` for an internal cash transfer. If a cash flow or
financing arrangement cannot be represented faithfully by the advertised
schema, explain that limit instead of approximating it silently.

## Read the verdict without upgrading it

| Status | Interpretation |
| --- | --- |
| `ok` | The checked rules did not report a breach for this proposal and evidence. |
| `breach` | The result identifies a touched rule outside the investor's limit. |
| `cooling_off` | The investor's pause commitment applies; report the returned unlock time. |
| `no_rule` | No applicable rule was available; this is not a general endorsement. |
| `unavailable` | The checker lacks usable evidence; retain the saved check and explain recovery. |
| `unclassified` | Some proposal could not be classified; explain the returned coverage. |

Use actual `reasons`, `cited_rules`, `cited_bands`, `coverage`, `unlocks_at`
and `next_step_href`. A rule's `leg_index` refers to the submitted leg, starting
at zero. The verdict does not identify a security or measure every source of
investment risk. Avoid a broader "safe" or "suitable" conclusion.

## Write and read boundaries

`check_action` saves a check and returns `check_id`. A second call creates a
separate record. `get_reflection_history({ id })` reads that saved check;
its verdict and freshness remain those of the original check.

`record_decision` accepts that `check_id`, `outcome`, optional `note`, and an
optional investor-supplied `broker_reference`. It records one outcome only.
The reference is a note, not broker access. Verify the returned
`recorded`, `check_id` and `decided_at` before claiming a successful save.

If a write response is missing, inspect the original check. An existing matching
outcome establishes that it is recorded; a conflicting outcome must remain.
A positive `unreadable_count` means stored checks were skipped. If the exact-ID
read has no item and reports an unreadable row, the check's state is unknown,
not absent. Retry only if the read returns the intended check with both its
outcome and decision timestamp unset and the investor's stated choice remains
authorized. If the read fails or the
check is not found, stop the retry and explain the uncertainty.

Permissions are `policy:read` for policy/status, `check:run` for saving a check,
`reflection:read` for history and `reflection:write` for a stated outcome. Use
only grants actually present; a supported scope is not permission to use it.
