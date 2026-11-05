import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	access,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { normalizeClaude } from "./lib/claude-trace.mjs";
import { digest, SKILLS } from "./lib/contracts.mjs";
import { gradeSuite } from "./lib/grade.mjs";
import {
	prepareSession,
	SMOKE_CASES,
	verifyCaptureCode,
	verifySessionFiles,
} from "./lib/local-session.mjs";
import { createFixtureServer, MOCK_TOOLS } from "./lib/mock-mcp.mjs";
import { loadSuite, readJsonl, skillFingerprint } from "./lib/suite.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const suite = await loadSuite(root);
// Every client stream below is a synthetic protocol simulation, NOT a model run.
const options = {
	instructions: "Synthetic local standing instructions.",
	clientVersion: "unit-test",
	model: "not-a-model-run",
};
async function prepared(
	t,
	caseId = "decision-lost-write-response",
	condition = "with_skill",
) {
	const base = await mkdtemp(path.join(os.tmpdir(), "investboard-capture-"));
	t.after(() => rm(base, { recursive: true, force: true }));
	const directory = path.join(base, "session");
	await prepareSession(root, directory, { ...options, caseId, condition });
	return {
		directory,
		session: JSON.parse(
			await readFile(path.join(directory, "session.json"), "utf8"),
		),
	};
}
function capture(session, calls = [], skill = undefined) {
	const journal = [
		{
			type: "initialize",
			instructions_sha256: digest(session.configuration.instructions),
			configuration_sha256: session.configuration_sha256,
		},
	];
	const events = [
		{
			type: "system",
			subtype: "init",
			claude_code_version: "unit-test",
			cwd: session.workspace_paths[0],
			plugins:
				session.condition === "with_skill"
					? [
							{
								name: "investboard",
								path: path.join(
									session.workspace_paths[0],
									"plugins/investboard",
								),
							},
						]
					: [],
			skills:
				session.condition === "with_skill"
					? SKILLS.map((skill) => `investboard:${skill}`)
					: [],
			mcp_servers: [{ name: "investboard", status: "connected" }],
			tools: ["Skill", ...MOCK_TOOLS.map((t) => `mcp__investboard__${t.name}`)],
		},
	];
	let counter = 0;
	for (const row of (skill
		? [
				{
					name: "Skill",
					arguments: { skill: `investboard:${skill}` },
					status: "success",
					result: "Loaded skill.",
				},
			]
		: []
	).concat(calls)) {
		const id = `tool-${counter++}`;
		events.push({
			type: "assistant",
			message: {
				model: options.model,
				content: [
					{
						type: "tool_use",
						id,
						name:
							row.name === "Skill" ? "Skill" : `mcp__investboard__${row.name}`,
						input: row.arguments,
					},
				],
			},
		});
		events.push({
			type: "user",
			message: {
				content: [
					{
						type: "tool_result",
						tool_use_id: id,
						is_error: row.status !== "success",
						content: [{ type: "text", text: JSON.stringify(row.result) }],
					},
				],
			},
		});
		if (row.name !== "Skill") journal.push({ type: "tool_call", ...row });
	}
	events.push({
		type: "assistant",
		message: {
			model: options.model,
			content: [{ type: "text", text: "Synthetic answer for adapter tests." }],
		},
	});
	events.push({
		type: "result",
		subtype: "success",
		is_error: false,
		permission_denials: [],
		result: "Synthetic answer for adapter tests.",
	});
	return { events, journal };
}
const normalize = (session, events, journal) =>
	normalizeClaude(session, events, journal, {
		kind: "synthetic",
		sourceRef: "private-unit-simulation",
	});

// Review regressions: protocol simulations only, never actual model captures.
test("negative controls require the prepared workspace, plugin and available-skill inventory", async (t) => {
	for (const condition of ["with_skill", "without_skill"]) {
		const { session } = await prepared(t, "negative-unrelated-task", condition);
		const correct = capture(session);
		assert.doesNotThrow(() =>
			normalize(session, correct.events, correct.journal),
		);
		for (const mutate of [
			(e) => {
				delete e.cwd;
			},
			(e) => {
				e.cwd = "/unrelated/workspace";
			},
			(e) => {
				delete e.claude_code_version;
			},
			(e) => {
				delete e.plugins;
			},
			(e) => {
				delete e.skills;
			},
			(e) => {
				e.plugins.push({ name: "unexpected", path: "/other/plugin" });
			},
			(e) => {
				e.skills.push("unexpected-skill");
			},
			(e) => {
				e.plugin_errors = [
					{ plugin: "investboard", type: "manifest-validation-error" },
				];
			},
			...(condition === "with_skill"
				? [
						(e) => {
							e.plugins = [];
							e.skills = [];
						},
						(e) => {
							e.plugins[0].path = "/unrelated/plugins/investboard";
						},
						(e) => {
							e.skills.pop();
						},
					]
				: []),
		]) {
			const raw = capture(session);
			mutate(raw.events[0]);
			assert.throws(
				() => normalize(session, raw.events, raw.journal),
				/workspace|Client version|inventory/,
			);
		}
	}
});
test("fixture replay budgets cover reordered arguments and all pages of a tool", async (t) => {
	const a = await prepared(t, "decision-explicit-outcome"),
		b = await prepared(t, "decision-period-and-pagination");
	for (const { directory, session } of [a, b]) {
		const rows = [];
		const handle = await createFixtureServer(session, directory, async (row) =>
			rows.push(row),
		);
		await handle({ jsonrpc: "2.0", id: 1, method: "initialize" });
		const call = (fixture, args = fixture.arguments) =>
			handle({
				jsonrpc: "2.0",
				id: 2,
				method: "tools/call",
				params: { name: fixture.name, arguments: args },
			});
		for (const fixture of session.packet.tool_fixtures)
			assert.equal((await call(fixture)).result.isError, false);
		const first = session.packet.tool_fixtures[0];
		const reordered = Object.fromEntries(
			Object.entries(first.arguments).reverse(),
		);
		assert.equal((await call(first, reordered)).result.isError, true);
		assert.equal(
			rows.filter((r) => r.type === "tool_call").length,
			session.packet.tool_fixtures.length + 1,
		);
	}
});
test("authoritative denied calls remain errors without a fixture-server invocation", async (t) => {
	const { session } = await prepared(
		t,
		"negative-unrelated-task",
		"without_skill",
	);
	for (const name of ["Bash", "mcp__investboard__record_decision", "Skill"]) {
		for (const includeResult of [true, false]) {
			const raw = capture(session, [], "investment-decision-making");
			const use = raw.events[1].message.content[0];
			use.name = name;
			use.input =
				name === "Skill"
					? { skill: "investboard:investment-decision-making" }
					: {
							check_id: "11111111-1111-4111-8111-111111111111",
							outcome: "proceeded",
						};
			raw.events[2].message.content[0].is_error = true;
			raw.events[2].message.content[0].content =
				"Denied by client permissions.";
			raw.events.at(-1).permission_denials = [
				{ tool_name: name, tool_use_id: use.id, tool_input: use.input },
			];
			raw.events.splice(2, 0, {
				type: "system",
				subtype: "permission_denied",
				tool_name: name,
				tool_use_id: use.id,
			});
			if (!includeResult) raw.events.splice(3, 1);
			const trace = normalize(session, raw.events, raw.journal);
			assert.equal(trace.tool_calls.length, 1);
			assert.equal(trace.tool_calls[0].status, "error");
			assert.equal(
				trace.tool_calls[0].name,
				name === "Skill"
					? "load_skill"
					: name.replace("mcp__investboard__", ""),
			);
			assert.deepEqual(trace.skills_loaded, []);
			const result = gradeSuite(suite, [trace]).results.find(
				(r) => r.trace_sha256,
			);
			assert.equal(result.harness_checks, "fail");
			assert.equal(result.status, "harness_only");
		}
	}
});
test("normalizer refuses missing, orphan, duplicate and contradictory denial evidence", async (t) => {
	const { session } = await prepared(t);
	for (const mutate of [
		(r) => {
			delete r.events.at(-1).permission_denials;
		},
		(r) => {
			r.events.at(-1).permission_denials = {};
		},
		(r) => {
			r.events.at(-1).permission_denials = [
				{ tool_name: "Bash", tool_use_id: "not-captured", tool_input: {} },
			];
		},
		(r) => {
			const use = r.events[1].message.content[0];
			r.events.at(-1).permission_denials = [
				{ tool_name: use.name, tool_use_id: use.id, tool_input: use.input },
			];
		},
		(r) => {
			const use = r.events[1].message.content[0];
			r.events[2].message.content[0].is_error = true;
			r.events.at(-1).permission_denials = [
				{ tool_name: "wrong-name", tool_use_id: use.id, tool_input: use.input },
			];
		},
		(r) => {
			const use = r.events[1].message.content[0];
			r.events[2].message.content[0].is_error = true;
			const denial = {
				tool_name: use.name,
				tool_use_id: use.id,
				tool_input: use.input,
			};
			r.events.at(-1).permission_denials = [denial, denial];
		},
		(r) => {
			r.events.splice(1, 0, {
				type: "system",
				subtype: "permission_denied",
				tool_name: "Bash",
				tool_use_id: "missing",
			});
		},
		(r) => {
			r.events.splice(1, 0, { type: "system", subtype: "permission_denied" });
		},
	]) {
		const raw = capture(session, [], session.packet.skill);
		mutate(raw);
		assert.throws(
			() => normalize(session, raw.events, raw.journal),
			/denial|denied/i,
		);
	}
	const executed = capture(session, session.packet.tool_fixtures);
	const use = executed.events[1].message.content[0];
	executed.events[2].message.content[0].is_error = true;
	executed.events.at(-1).permission_denials = [
		{ tool_name: use.name, tool_use_id: use.id, tool_input: use.input },
	];
	assert.throws(
		() => normalize(session, executed.events, executed.journal),
		/Unaccounted/,
	);
});

test("smoke selection is eight unique cases covering four skills and negative controls", () => {
	assert.equal(SMOKE_CASES.length, 8);
	assert.equal(new Set(SMOKE_CASES).size, 8);
	const selected = SMOKE_CASES.map((id) =>
		suite.cases.find((c) => c.id === id),
	);
	for (const name of [
		"portfolio-intelligence",
		"investment-thesis",
		"investment-strategy-check",
		"investment-decision-making",
		"none",
		"any",
	])
		assert.ok(selected.some((c) => c.skill === name));
});
test("preparation copies exact skills and attachments without production MCP, hooks or user config", async (t) => {
	const { directory, session } = await prepared(
		t,
		"portfolio-overlap-file-only",
	);
	assert.equal(
		await skillFingerprint(path.join(directory, "workspace")),
		suite.skills_sha256,
	);
	await assert.rejects(
		access(path.join(directory, "workspace/plugins/investboard/.mcp.json")),
	);
	const invocation = JSON.parse(
		await readFile(path.join(directory, "invocation.json"), "utf8"),
	);
	const config = JSON.parse(
		await readFile(path.join(directory, "mcp.json"), "utf8"),
	);
	assert.deepEqual(Object.keys(config.mcpServers), ["investboard"]);
	assert.equal(config.mcpServers.investboard.command, process.execPath);
	assert.equal(
		(await readFile(path.join(directory, "prompt.txt"), "utf8")).includes(
			"39/27",
		),
		false,
	);
	assert.equal(
		invocation.args.includes("--dangerously-skip-permissions"),
		false,
	);
	assert.equal(invocation.args.includes("--strict-mcp-config"), true);
	assert.equal(invocation.args.includes("--tools"), true);
	assert.equal(invocation.args.includes("Bash"), false);
	assert.equal(
		(await readFile(path.join(directory, "invocation.json"), "utf8")).includes(
			"app.investboard.com",
		),
		false,
	);
	await verifySessionFiles(directory, session);
	await verifyCaptureCode(root, session);
});
test("baseline has no skill files and uses the same non-skill configuration", async (t) => {
	const a = await prepared(t),
		b = await prepared(t, "decision-lost-write-response", "without_skill");
	await assert.rejects(access(path.join(b.directory, "workspace/plugins")));
	assert.equal(a.session.configuration_sha256, b.session.configuration_sha256);
	assert.equal(
		JSON.parse(
			await readFile(path.join(b.directory, "invocation.json"), "utf8"),
		).args.includes("--plugin-dir"),
		false,
	);
});
test("preparation refuses session reuse; file verification detects edits", async (t) => {
	const { directory, session } = await prepared(t, "thesis-file-draft");
	const changedCode = structuredClone(session);
	changedCode.configuration.adapter_sha256 = "0".repeat(64);
	await assert.rejects(verifyCaptureCode(root, changedCode), /adapter changed/);
	await assert.rejects(
		prepareSession(root, directory, {
			...options,
			caseId: session.packet.id,
			condition: session.condition,
		}),
	);
	await writeFile(
		path.join(directory, "workspace", session.packet.files[0]),
		"changed",
	);
	await assert.rejects(verifySessionFiles(directory, session), /changed/);
});
test("MCP initialize and list keep write tools visible even for no-consent cases", async (t) => {
	const { directory, session } = await prepared(t, "decision-no-consent"),
		rows = [];
	const handle = await createFixtureServer(session, directory, async (row) =>
		rows.push(row),
	);
	const init = await handle({
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: { protocolVersion: "2025-03-26" },
	});
	assert.equal(init.result.instructions, options.instructions);
	assert.equal(init.result.protocolVersion, "2025-03-26");
	const tools = await handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
	assert.ok(tools.result.tools.some((t) => t.name === "record_decision"));
	assert.equal(rows[0].instructions_sha256, digest(options.instructions));
	assert.equal(
		await handle({ jsonrpc: "2.0", method: "notifications/initialized" }),
		undefined,
	);
});
test("fixture calls, unexpected writes and duplicate reads are journaled without changing accounts", async (t) => {
	const { directory, session } = await prepared(t),
		rows = [];
	const handle = await createFixtureServer(session, directory, async (row) =>
		rows.push(row),
	);
	await handle({ jsonrpc: "2.0", id: 1, method: "initialize" });
	const fixture = session.packet.tool_fixtures[0];
	const call = (name, args) =>
		handle({
			jsonrpc: "2.0",
			id: 2,
			method: "tools/call",
			params: { name, arguments: args },
		});
	const result = await call(fixture.name, fixture.arguments);
	assert.deepEqual(result.result.structuredContent, fixture.result);
	assert.equal(
		(await call(fixture.name, fixture.arguments)).result.isError,
		true,
	);
	assert.equal(
		(await call("record_decision", { outcome: "proceeded" })).result.isError,
		true,
	);
	assert.equal(rows.filter((r) => r.type === "tool_call").length, 3);
});
test("fixture file access rejects traversal, unlisted files, changed bytes and symlinks", async (t) => {
	const { directory, session } = await prepared(t, "thesis-file-draft");
	const handle = await createFixtureServer(session, directory, async () => {});
	await handle({ jsonrpc: "2.0", id: 1, method: "initialize" });
	const read = (file) =>
		handle({
			jsonrpc: "2.0",
			id: 2,
			method: "tools/call",
			params: { name: "read_file", arguments: { path: file } },
		});
	const file = session.packet.files[0];
	assert.equal((await read(file)).result.isError, false);
	for (const file of [
		"../../.claude.json",
		"/etc/passwd",
		"session.json",
		"unlisted.txt",
	])
		assert.equal((await read(file)).result.isError, true);
	const local = path.join(directory, "workspace", file);
	await writeFile(local, "changed");
	assert.equal((await read(file)).result.isError, true);
	await rm(local);
	await symlink(path.join(root, file), local);
	assert.equal((await read(file)).result.isError, true);
});
test("the real stdio process serves JSON-RPC and refuses to overwrite its evidence journal", async (t) => {
	const { directory } = await prepared(t);
	const input = `${[
		{
			jsonrpc: "2.0",
			id: 1,
			method: "initialize",
			params: { protocolVersion: "2024-11-05" },
		},
		{ jsonrpc: "2.0", method: "notifications/initialized" },
		{ jsonrpc: "2.0", id: 2, method: "tools/list" },
	]
		.map((m) => JSON.stringify(m))
		.join("\n")}\n`;
	const run = spawnSync(
		process.execPath,
		[path.join(root, "scripts/mock-mcp.mjs"), "--session", directory],
		{ input, encoding: "utf8" },
	);
	assert.equal(run.status, 0, run.stderr);
	const replies = run.stdout.trim().split("\n").map(JSON.parse);
	assert.equal(replies.length, 2);
	assert.ok(
		replies[1].result.tools.some((t) => t.name === "get_reflection_history"),
	);
	assert.equal(
		(await readJsonl(path.join(directory, "mock-journal.jsonl"))).length,
		1,
	);
	const again = spawnSync(
		process.execPath,
		[path.join(root, "scripts/mock-mcp.mjs"), "--session", directory],
		{ input, encoding: "utf8" },
	);
	assert.equal(again.status, 1);
});
test("normalizer corroborates calls and records native skill activation without inventing a model pass", async (t) => {
	const { session } = await prepared(t),
		raw = capture(session, session.packet.tool_fixtures, session.packet.skill);
	const trace = normalize(session, raw.events, raw.journal);
	assert.deepEqual(trace.skills_loaded, [session.packet.skill]);
	assert.equal(trace.tool_calls[0].name, "load_skill");
	assert.equal(trace.tool_calls[1].name, "get_reflection_history");
	const result = gradeSuite(suite, [trace]).results.find(
		(r) => r.case_id === trace.case_id && r.condition === trace.condition,
	);
	assert.equal(result.status, "harness_only");
	assert.equal(result.harness_checks, "pass");
});
test("normalizer preserves unknown/denied tool attempts so grading fails closed", async (t) => {
	const { session } = await prepared(t),
		raw = capture(session, [], session.packet.skill);
	const event = raw.events[1];
	event.message.content[0].name = "Bash";
	event.message.content[0].input = { command: "curl example.invalid" };
	raw.events[2].message.content[0].is_error = true;
	const trace = normalize(session, raw.events, raw.journal);
	assert.equal(trace.tool_calls[0].name, "Bash");
	assert.ok(
		gradeSuite(suite, [trace])
			.results.find((r) => r.trace_sha256)
			.failures.some((f) => f.check_id === "unallowed_tool"),
	);
});
test("visible pre-tool commentary remains outgoing evidence for canary checks", async (t) => {
	const { session } = await prepared(t, "strategy-injected-policy"),
		raw = capture(session, [], session.packet.skill);
	raw.events[1].message.content.unshift({
		type: "text",
		text: "SYNTHETIC_PRIVATE_POLICY_TOKEN",
	});
	const trace = normalize(session, raw.events, raw.journal);
	assert.ok(
		gradeSuite(suite, [trace])
			.results.find((r) => r.trace_sha256)
			.failures.some((f) => f.check_id === "synthetic_canary_disclosure"),
	);
});
test("normalizer rejects missing calls/results, mismatched fixtures, other models and remote contexts", async (t) => {
	const { session } = await prepared(t);
	for (const mutate of [
		(r) => r.events.pop(),
		(r) => {
			r.events[2].message.content[0].content = "different result";
		},
		(r) => {
			r.events[2].message.content[0].content = JSON.stringify({
				unrelated: r.journal[1].result,
			});
		},
		(r) => {
			r.events[1].message.model = "other-model";
		},
		(r) => {
			r.events[0].mcp_servers.push({ name: "production", status: "connected" });
		},
		(r) => {
			r.events[0].tools.push("Bash");
		},
		(r) => {
			r.events[0].tools.pop();
		},
		(r) => {
			r.events.splice(2, 1);
		},
		(r) => {
			r.journal[0].instructions_sha256 = "0".repeat(64);
		},
		(r) => {
			r.journal.push({
				type: "tool_call",
				name: "record_decision",
				arguments: {},
				status: "error",
				result: {},
			});
		},
	]) {
		const raw = capture(session, session.packet.tool_fixtures);
		mutate(raw);
		assert.throws(() => normalize(session, raw.events, raw.journal));
	}
});
test("baseline skill activation and unknown skill identifiers cannot pass activation checks", async (t) => {
	const { session } = await prepared(t, "decision-no-consent", "without_skill"),
		raw = capture(session, [], "investment-decision-making");
	const trace = normalize(session, raw.events, raw.journal);
	assert.ok(
		gradeSuite(suite, [trace])
			.results.find((r) => r.trace_sha256)
			.failures.some((f) => f.check_id === "invalid_skill_activation"),
	);
});
test("adapter requires an explicit evidence kind and never overwrites normalized output", async (t) => {
	const { directory, session } = await prepared(t),
		raw = capture(session, session.packet.tool_fixtures);
	assert.throws(
		() =>
			normalizeClaude(session, raw.events, raw.journal, { sourceRef: "unit" }),
		/explicitly/,
	);
	const stream = path.join(directory, "raw.jsonl"),
		output = path.join(directory, "trace.jsonl");
	await writeFile(
		stream,
		`${raw.events.map((e) => JSON.stringify(e)).join("\n")}\n`,
	);
	await writeFile(
		path.join(directory, "mock-journal.jsonl"),
		`${raw.journal.map((e) => JSON.stringify(e)).join("\n")}\n`,
	);
	const args = [
		path.join(root, "scripts/capture-skills.mjs"),
		"normalize",
		"--session",
		directory,
		"--stream",
		stream,
		"--kind",
		"synthetic",
		"--output",
		output,
	];
	assert.equal(
		spawnSync(process.execPath, args, { encoding: "utf8" }).status,
		0,
	);
	assert.equal(
		spawnSync(process.execPath, args, { encoding: "utf8" }).status,
		1,
	);
	assert.equal(
		JSON.parse(await readFile(output, "utf8")).provenance.kind,
		"synthetic",
	);
});
