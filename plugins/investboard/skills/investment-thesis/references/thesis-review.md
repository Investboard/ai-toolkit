# Thesis drafting and review

## A useful case, in the investor's words

Adapt the draft to the investor's needs:

- **Reason:** what they believe and why this investment serves their goal.
- **Assumptions:** which beliefs must hold for that reasoning to remain valid.
- **Evidence:** observations supporting those beliefs and what remains unknown.
- **Risks:** plausible ways the reasoning could fail, including contrary evidence.
- **Falsifier:** an observable condition that would challenge the case.
- **Conviction and review:** how the investor describes their confidence and
  when they want to revisit the reasoning.

Use plain questions when the investor has not supplied an answer. A proposed
wording, research observation and quoted saved statement are different things;
label them. Do not invent a probability, performance target, conviction score
or an investor-set review rule.

## Resolve a live record

`get_own_record` accepts `{ isin?, ticker?, exchange? }`, requiring an ISIN or
ticker. An exchange qualifies a ticker but cannot identify an investment by
itself. There is no free-text `name`, historical version or list-all input.
Use identifiers supplied by the investor or a genuinely resolved authorized
source; do not guess an ISIN from a name or policy rule.

| Result | What to say or do |
| --- | --- |
| `resolved: false` | The subject was not resolved; this does not establish absence of a saved thesis. |
| `candidates` | Ask the investor to disambiguate using the returned identifiers. |
| `candidates_truncated: true` | More matches exist; ask for a narrower identifier. |
| `resolved: true`, `found: false` | The resolved subject has no returned thesis text. |
| `gated: true` | Explain the access or entitlement requirement, not an empty thesis. |
| Tool error | Explain the failed read; do not reconstruct the saved record. |

The returned `subject` contains identifiers, not a security name. It is not
a general holding-search endpoint. The tool can retrieve a thesis for an
investment the investor no longer holds; that does not establish current
ownership. Do not infer a holding's value or portfolio weight from this record.

## Read the saved state

The record can be `empty`, `draft`, `active`, `due`, `reviewed` or `closed`.
Preserve the returned state rather than assigning one from intuition. Nullable
fields are absent information, not zero conviction or an implicit judgement.

Quote `statement` and `falsifier` verbatim as the investor's own words.
`recorded_at` and `review_due_at` describe the returned projection. It is not
a historical version and has no version ID or journal ID. To compare original
wording, request the exact saved version from Investboard rather than claiming
that today's projection is what the investor believed at an earlier date.

The returned `verdict` contains a judgement and `written_at`; `open` is a
recorded undecided review, and null means no review was returned. Neither
provides the full observation and assessment stored in the app. Ask for those
details if they are needed for a meaningful retrospective.

## Review without rewriting history

Start with the investor's observations since the thesis. Then examine which
assumptions they still hold, which have been challenged and whether they
believe their own falsifier has occurred. Distinguish a reasoning review from
short-term price performance; one does not automatically settle the other.

`get_journal` can retrieve due entries, but has no instrument filter or thesis
version reference. A stored `agent_reflection_id` links an entry to an exact
check through `get_reflection_history({ id })`; a matching ticker or date
proves no relationship. Use the app's exact version for a historical thesis
comparison or a version-specific review.

A positive `unreadable_count` on history means a stored row was skipped during
decoding. An empty linked-check result with that signal is unreadable, not
proof that the check never existed. Keep that gap visible in the review.

Write a proposed review in the conversation and label it as a draft. The
current MCP does not save theses, observations, journal reviews or edits.
Saving those is an Investboard app step. The available `record_decision`
tool cannot be repurposed: it accepts an existing check ID and a stated
`proceeded`, `abandoned` or `deferred` outcome, once per check.

Reading a thesis or journal requires `record:read`; linked check history
requires `reflection:read`. A supplied file is a dated snapshot, not a grant
of those live permissions. Use only the connection's actual grants.
