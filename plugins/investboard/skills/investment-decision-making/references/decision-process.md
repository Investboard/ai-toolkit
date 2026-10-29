# Decision process and record semantics

## A decision worksheet

Adapt the depth to the choice rather than filling every field mechanically:

- What goal is this choice intended to serve?
- What alternatives is the investor considering, including waiting?
- Which facts are observed, which are assumptions, and what is missing?
- Which investor-set rules apply, and what did an actual check return?
- What are the trade-offs, timing constraints and reversibility?
- What evidence would change the investor's mind?
- What did the investor decide, and when do they want to revisit it?

Keep a proposed worksheet distinct from an existing saved record. The assistant
can draft it in the conversation; that does not write a thesis or journal entry.

## Retrieve a bounded, honest history

`get_reflection_history` accepts `limit` (1 to 100), a cursor pair `before`
and `before_id`, or an exact saved check `id`. It returns `items`,
`next_before`, `next_before_id` and, when present, `unreadable_count` for
stored rows skipped during decoding. It lists assistant-generated checks,
not every investment decision or all checks made inside the app.

`get_journal` accepts `limit` (1 to 50), the same cursor field names and
`reviews_due_only`. A page can be shortened by its byte budget, so follow
both returned cursor values even when there are fewer items than the limit.
Do not manufacture a cursor from an arbitrary date or reuse one collection's
cursor for another. Neither tool has a date-range input, and both page by
`created_at`, not by the dates of later outcomes or reviews.

Apply the requested period to the relevant event date in the investor's
timezone: check and journal creation use `created_at`, reported outcomes use
`decided_at`, and returned journal reviews use `verdict.written_at`. State
the chosen basis and boundaries. A null outcome or review date is not an
event in that period; do not substitute its record's creation date.
`decided_at` dates outcome recording, not necessarily when the investor
made the choice or a trade executed. State that limitation if the requested
period concerns actual decisions or transactions rather than recorded outcomes.

For a creation-date review, traversing the requested creation window can cover
that window. For outcomes recorded or reviews written in a period, an old
record can have a recent event: fully traverse the relevant collection, use
an actually available event-date filter/export, or explicitly report a partial
sample. Crossing the start date in creation order cannot establish complete
decision-date or review-date coverage. Due-review results likewise need the
whole filtered collection or a disclosed partial result.

If a cursor is unrecognized or a read fails, do not label the whole collection
empty. Restart from the newest page when appropriate and disclose any remaining
gap. If the retrieval is stopped before the requested scope is covered, say
which period or pages were actually reviewed.

When any page reports a positive `unreadable_count`, accumulate the reported
skips and disclose them alongside the readable sample. Continue with the
returned cursor even when `items` is empty. Reaching the final cursor does
not recover those rows or justify a complete-history claim. Do not invent
the skipped content or a skip count absent from the response. Their dates are
not returned, so do not assign them to the requested period or assume that
they fall outside it.

## Do not collapse different evidence

| Record element | What it establishes |
| --- | --- |
| Check action and original verdict | What was proposed and how the rules evaluated the evidence then. |
| `outcome`, note and `decided_at` | What the investor reported choosing after that check. |
| `linked_decision` | A derived transaction association with its stated matching strength, not the reported outcome itself. |
| Journal memo, mood, conviction and falsifier | What the investor recorded in their own words. |
| Journal verdict and its date | A recorded later judgement; `open` remains undecided and null means none was returned. |

A journal's `agent_reflection_id` is the supported link to
`get_reflection_history({ id })`. A thesis projection has no historical version
ID or journal ID. Do not create relationships using similar dates or tickers.
The exposed journal verdict does not include the longer observation and
assessment stored in the app. Request that material from the investor if it
is necessary, rather than reconstructing it.

Outcomes and linked transactions do not provide realized performance, costs,
tax effects or portfolio attribution. Do not label a decision profitable or
unprofitable without separate, adequate evidence supplied for that question.

## Recording and recovering a stated outcome

An exact `check_id` returned by `check_action` can be read directly from history.
`record_decision` saves one authorized investor-stated outcome: `proceeded`,
`abandoned` or `deferred`, with an optional note and investor-supplied broker
reference. It does not execute an order or save a journal review.

After an uncertain write response, read that exact check. Confirm a matching
recorded outcome, preserve a conflicting one, and retry only after a successful
read returns the intended record with both outcome and decision timestamp
unset, and the write remains authorized. An empty exact-ID read with a positive
`unreadable_count` leaves the record state unknown; it does not prove absence.
If that read fails or the identity is uncertain, stop. Do not create another
check to bypass an outcome that was already recorded.

Policy/status require `policy:read`, checks `check:run`, history
`reflection:read`, outcomes `reflection:write`, and journals/theses `record:read`.
Missing permission or entitlement is not an empty result; use only actual grants.
