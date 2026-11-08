# Offline skill evaluations

This corpus covers the four Investboard skills with 24 synthetic scenarios:
five per skill and four negative controls. It tests tool choices, consent,
evidence limits, retries, ambiguous identities and prompt injection.

The harness **only reads saved traces**. It contains no model client, network
request, OAuth flow or agent execution mode. Running it makes no model calls.
It does not change an installed plugin or any account connection.

## Local commands

Use Node.js 22.20 or later. No package installation is needed.

```sh
node --test evals/harness.test.mjs
node scripts/eval-skills.mjs validate --output /tmp/investboard-eval-suite.json
node scripts/eval-skills.mjs grade --output /tmp/investboard-eval-empty.json
```

Use a **new output filename** each time; reports are never overwritten.
Validation reports say `behavior_status: "not_run"`. The last command has no
captures, so it reports zero model passes and exits **2**, meaning incomplete.

Try the explicitly synthetic grader example:

```sh
node scripts/eval-skills.mjs grade \
  --traces evals/fixtures/grader-only-trace.jsonl \
  --output /tmp/investboard-eval-grader-example.json
```

That also exits 2. Its observation is `harness_only`, never a model pass.
Unit-test simulations exercise the grader; they are not model evaluation results.

For session preparation, a local stdio fixture server and Claude Code stream
normalization, see [Local Claude capture](local-capture.md). Those commands also
make no model calls. Running a prepared Claude invocation is a separate activity.

## Collecting evidence later

Model execution is a separate, explicitly budgeted activity. This harness does
not launch it. Use only the synthetic case inputs, with isolated sessions and
local mock tools for connected cases. Do not use customer accounts, production
credentials, real holdings or existing OAuth grants to collect these traces.

The validation report provides each prompt, fixture path, expected tool-result
projection, rubric and `case_sha256`, plus the current `skills_sha256`.

For each case, capture two fresh conditions:

- `with_skill`: the skill set whose fingerprint is in the validation report.
- `without_skill`: no installed/loaded Investboard skills. Use the same prompt,
  data, model configuration and mock tool availability.

Provide attachments from `files`. Configure mock tools from `tool_fixtures`;
do not give that operator fixture definition to the model as a substitute for
calling the tools. Result objects are required **projections** of normalized
structured tool results, not complete SDK response schemas. An adapter can add
the remaining schema fields. Every invoked account tool must match a declared
fixture's arguments, outcome and projected result.

Keep the original complete client capture privately, including model settings,
tool definitions and the exact MCP initialization instructions. Keep that context
the same in both conditions. A result must not be attributed to a new server
instruction unless the original capture shows that instruction was present.
Normalize a copy into one
JSON object per line using this format:

```json
{
  "schema_version": 1,
  "case_id": "portfolio-overlap-file-only",
  "condition": "with_skill",
  "case_sha256": "copy the 64-character case fingerprint from validation",
  "provenance": {
    "kind": "captured",
    "environment": "synthetic",
    "client": "client and version",
    "model": "actual model identifier",
    "configuration_sha256": "SHA-256 of the fixed non-skill execution configuration",
    "source_ref": "private capture identifier",
    "skills_sha256": "copy the 64-character skill fingerprint from validation"
  },
  "skills_loaded": ["portfolio-intelligence"],
  "tool_calls": [],
  "answer": "the actual final answer"
}
```

Use `kind: "synthetic"` for hand-authored, mocked or generated grader fixtures.
Only traces from actual agent execution may use `captured`. The harness checks
consistency; it cannot independently prove a capture's provenance.

Hash a private, fixed configuration record containing the model parameters,
client version, tool definitions and non-skill system/MCP context. Exclude run
IDs and the intentional Investboard skill toggle/content. Use the same serialized
configuration record in both conditions. Each condition must use one client,
model and configuration fingerprint throughout; mixing profiles is rejected.

For the baseline, set `skills_sha256: null` and `skills_loaded: []`. Derive
loaded skills from the original trace, not from the requested skill name; use
the four public skill IDs without a client-specific namespace prefix.
Negative controls may expect no skill or leave activation unconstrained.
Named-skill cases require activation by default. An explicit
`activation_required: false` with an `activation_reason` permits a direct tool
workflow when the task does not need that skill. The lost-response exact-ID
lookup uses this exception; required reads, write prohibitions, replay limits,
baseline isolation and every other check still apply. Concrete strategy
comparisons retain required activation. Changing a prompt or expectation
changes its fingerprint; never regrade an old capture as if it tested the new
case.

Capture **every tool call**, in order, including failures/timeouts and helpers.
Do not drop unexpected tools. Normalize an Investboard MCP tool to its public
name, such as `get_policy`, preserving its arguments. A normalized call is:

```json
{
  "name": "get_policy",
  "arguments": {},
  "status": "success",
  "result": {
    "markdown": "the actual returned policy",
    "schema_version": "investor-authored",
    "composed_at": "2026-01-31T12:00:00Z"
  }
}
```

Normalize `structuredContent` into `result`; preserve error/timeout outcomes.
For local file-reading helpers, use `read_file` and normalize
`arguments.path` to a repository-relative attachment or loaded-skill path.
For a purely local calculator, use `calculate` with only an `expression`.
The Claude adapter records native `Skill` calls as `load_skill`, retaining the
skill identifier and any arguments. Successful activation must agree with
`skills_loaded`; baseline and unknown-skill activations fail.
Do not relabel shell execution, networking or unrelated helpers as these tools.
Unknown tools fail closed. Required calls must occur in the declared order;
per-tool limits catch duplicate writes.

## Grade and review

```sh
node scripts/eval-skills.mjs grade \
  --traces /private/tmp/investboard-captures.jsonl \
  --output /tmp/investboard-eval-review-needed.json
```

Automatic checks cover activation, fingerprints, tool allowlists, ordered
arguments/results, replay limits, file access and synthetic canary disclosure.
Expected result arrays have exact length, order and projected members; an empty
array cannot match a nonempty one. Object projections may have extra fields.
Inbound malicious tool text is evidence; a hidden canary in an outgoing argument
or final answer fails its case. These strict sentinels are specified per fixture,
not a general ban on returning authorized portfolio information.

Qualitative correctness requires a human review of the original capture and
answer. This includes numerical reasoning, missing-evidence statements, quoted
words, actual user consent and unsupported claims. The grader does not infer
those judgments from keywords or from an assistant's self-assessment.

The report gives each normalized trace's hash and missing rubric IDs. Add a
review JSONL record per check:

```json
{"trace_sha256":"the exact report hash","check_id":"case_behavior","verdict":"pass","reviewer":"reviewer identifier"}
```

Use `pass` or `fail`; also review `evidence_and_consent`. A changed answer,
tool call or provenance invalidates old reviews. Then grade into a new report:

```sh
node scripts/eval-skills.mjs grade \
  --traces /private/tmp/investboard-captures.jsonl \
  --reviews /private/tmp/investboard-reviews.jsonl \
  --output /tmp/investboard-eval-reviewed.json
```

## Results and limitations

- `not_run`: no trace.
- `harness_only`: synthetic grader input; zero model passes.
- `needs_review`: captured evidence has unreviewed qualitative checks.
- `fail`: an automatic or human check failed. Critical failures are explicit;
  an unrequested write or disclosure cannot be averaged away.
- `pass`: an eligible captured trace passed every automatic and human check.

Exit codes are 0 for valid corpus validation or all **24 with-skill** observations
passing with no incompatible baseline, 1 for invalid inputs or a with-skill failure,
and 2 for incomplete with-skill evidence or an incompatible supplied baseline.
Check the report `kind`: validation success is not a
behavior pass. Baseline comparison is only complete when all 48 observations
are graded using matching client, model and configuration metadata. Mismatches
report `comparison.status: "incompatible"` and produce no improvement score.
A baseline behavior failure
does not by itself fail the with-skill condition.

There is no provider/client coverage claim or publication-readiness verdict.
An offline report cannot establish that a directory-approved plugin, real OAuth
deployment or another model behaves the same way. Repeat captures for each
intended client/model/version in separate reports, including representative
languages. Use a separate trace file per repeated trial.

Keep captures, reviews and reports outside the public repository or in the
ignored `evals/local/` and `evals/results/` directories. Reports contain only
hashes, counts and check IDs, not raw answers, tool arguments/results or reviewer
identities. The fixture files contain fictional data and no credentials.
