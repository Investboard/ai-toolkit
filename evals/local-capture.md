# Local Claude capture

The capture adapter prepares isolated sessions and normalizes saved Claude Code
JSONL streams. It does **not** execute Claude, make inference requests, read
credentials, modify installed plugins or configure an account. The fixture MCP
server uses newline JSON-RPC over stdio. It has no HTTP listener, network client,
database, account SDK or OAuth flow.

## Prepare eight cases

Use a fresh output directory outside the public repository (or under ignored
`evals/local/`). Supply a text snapshot of the MCP initialization instructions
you intend to test. Keep its source commit privately; this adapter cannot prove
that a production deployment serves those instructions.

```sh
node scripts/capture-skills.mjs prepare-smoke \
  --instructions /private/tmp/mcp-instructions.txt \
  --client-version 2.1.220 \
  --model claude-sonnet-4-6 \
  --output-dir /private/tmp/investboard-smoke-new
```

Use the installed client version and an exact model ID available to your account,
not a moving alias. Preparation creates 16 sessions: with and without skills for
each of these eight cases:

- Portfolio overlap and whole-portfolio denominators
- Partial fund coverage and unknown exposure
- File-based thesis drafting
- Injection in a supplied policy
- Decision discussion without write consent
- Recovery after a lost write response
- An unrelated request
- A request to execute an order

Each session contains:

- `workspace/`: only that case's attachments and, for the with-skill condition,
  exact copies of the four skills and plugin metadata. The production MCP config,
  hooks and other plugin execution components are excluded. Unsupported execution
  fields in a future manifest stop preparation.
- `claude-config/`: a new, empty client configuration directory.
- `mcp.json`: only the local fixture server.
- `prompt.txt`: the original prompt plus attachment paths. Answers, expected
  calls, rubrics and fixture definitions are not shown to the model.
- `session.json`: the private case, input hashes and fixed configuration record.
- `invocation.json`: executable, argv, cwd, environment and capture paths.
  It contains no credentials and is **not executed automatically**.

The configuration also fingerprints the capture implementation. Changed adapter
code or prepared input bytes require a fresh session rather than silently reusing
old provenance.

The account tool descriptors are deliberately simplified synthetic interfaces:
all 12 account tools remain visible in every case, including writes in no-consent
cases. They are not production input/output schema coverage. Declared fixture
calls return their supplied projection. Unexpected calls and excess replays
return an error and remain in the journal. No write reaches a real account.
`read_file` can read only the copied, hash-bound attachments and skill files;
absolute paths, traversal, symlinks, edits and other files are refused.

## Execute only within an authorized allowance

Execution still makes real model requests. For a subscription-only run:

1. Verify the **same account** used for inference has included quota left and
   paid usage credits/extra usage are **OFF**. Stop if either fact is unknown.
2. Use the account's existing subscription OAuth credential through the client's
   supported token environment. Keep it in process memory only; never put it in
   an invocation file, repository, log or chat. Do not mint a new token, use an
   API key/helper, switch providers, buy credits or enable overage for this test.
3. Apply the invocation's isolated configuration environment. Do not inherit
   API keys, auth helpers, provider overrides or a default user configuration.
   Verify authentication without sending a model prompt before execution.
4. Launch precisely the saved executable/argv in its cwd, pipe `prompt.txt`
   to stdin and save stdout/stderr to its private, **new** capture files.
   Do not add tools, permissive modes, installed plugins or production MCPs.
5. Run one session at a time. Recheck quota and overage before each invocation.
   Stop on quota, authentication, connection or capture errors. Do not retry,
   fall back to another model/provider or buy usage.

The adapter cannot enforce or independently verify provider billing. Its
`billing_gate` is an operator instruction, not a spend cap. An estimated
`--max-budget-usd` value is not a guarantee of zero charges. If quota is
exhausted, retain the prepared sessions as **not run** until it resets.

The configuration deliberately enables only native `Skill` and local MCP tools.
It does not enable shell, browser, network, editing or delegation tools.
The plugin's production URL may occur in skill prose, but no such connection
is configured. Nothing changes existing OAuth grants or customer connections.

## Normalize and grade

The server creates `mock-journal.jsonl` exclusively and refuses to overwrite it.
Keep this journal, the exact prepared session, the original full client stream,
client settings and stderr privately. A new trial needs a new session directory.

```sh
node scripts/capture-skills.mjs normalize \
  --session /private/tmp/investboard-smoke-new/decision-lost-write-response-with_skill \
  --stream /private/tmp/investboard-smoke-new/decision-lost-write-response-with_skill/claude-stream.jsonl \
  --kind captured \
  --output /private/tmp/decision-recovery-capture-new.jsonl
```

Use `--kind synthetic` for hand-authored streams or grader simulations. Only
actual client executions may be labelled `captured`. Normalization checks
consistency, not authenticity. It requires a complete successful stream, the
prepared exact model, the isolated tool inventory and local MCP initialization.
Every MCP call/result must match the server journal. Unknown or denied tool
attempts are retained; they are not hidden by normalization. Visible assistant
commentary before tool calls is retained in `answer` along with the final answer,
so an early disclosure cannot disappear from outgoing-evidence checks.

Native `Skill` calls become `load_skill`; a successful skill activation or
reading its exact `SKILL.md` establishes `skills_loaded`. Merely listing a
skill as available does not establish activation. Missing, incomplete or
inconsistent evidence stops normalization and must be reported as a capture
failure, never as a behavior pass.

Collect the normalized rows into a private JSONL file, then use the existing
[grading and human-review workflow](README.md#grade-and-review). No model judge
is required. Review the original streams, answers, numeric reasoning and consent
against both rubric checks. Do not auto-mark qualitative checks as passed.

Eight cases cover only part of the 24-case corpus: the full report remains
incomplete with the other 16 cases marked `not_run`. A complete improvement
score requires all 48 compatible observations; do not turn this smoke test into
a full-suite, production OAuth, directory-install or multi-client acceptance
claim.

## Local verification

```sh
node --test evals/harness.test.mjs evals/capture.test.mjs
```

These tests simulate streams and exercise real local stdio, including evidence
corroboration, activation, replay errors, file confinement, context mismatch,
output preservation and canary disclosure. They never execute a model.
