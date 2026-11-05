import {
	CONDITIONS,
	digest,
	fail,
	LOCAL_TOOLS,
	safeRelative,
	validateReview,
	validateTrace,
} from "./contracts.mjs";

function matches(actual, expected) {
	if (expected === null || typeof expected !== "object")
		return actual === expected;
	if (!actual || typeof actual !== "object") return false;
	return Object.entries(expected).every(
		([key, value]) => Object.hasOwn(actual, key) && matches(actual[key], value),
	);
}
function allowedRead(c, trace, call) {
	const file = call.arguments.path;
	if (typeof file !== "string" || !safeRelative(file)) return false;
	if (c.files.includes(file)) return true;
	return (
		trace.condition === "with_skill" &&
		trace.skills_loaded.some((skill) =>
			file.startsWith(`plugins/investboard/skills/${skill}/`),
		)
	);
}
function automatic(c, trace, skillsHash) {
	const failures = [];
	const reject = (code) => failures.push({ check_id: code, critical: true });
	if (trace.case_sha256 !== c.case_sha256) reject("case_fingerprint");
	if (trace.condition === "without_skill") {
		if (trace.skills_loaded.length) reject("baseline_loaded_skill");
	} else {
		if (trace.provenance.skills_sha256 !== skillsHash)
			reject("skill_fingerprint");
		if (c.skill === "none" && trace.skills_loaded.length)
			reject("unrelated_skill_activation");
		if (
			!["none", "any"].includes(c.skill) &&
			!trace.skills_loaded.includes(c.skill)
		)
			reject("required_skill_activation");
	}
	const counts = new Map();
	for (const call of trace.tool_calls) {
		counts.set(call.name, (counts.get(call.name) ?? 0) + 1);
		if (![...LOCAL_TOOLS, ...c.allowed_tools].includes(call.name))
			reject("unallowed_tool");
		if (call.name === "read_file" && !allowedRead(c, trace, call))
			reject("unallowed_file_read");
		if (
			call.name === "calculate" &&
			(typeof call.arguments.expression !== "string" ||
				Object.keys(call.arguments).some((k) => k !== "expression"))
		)
			reject("invalid_calculation_arguments");
		if (c.allowed_tools.includes(call.name)) {
			const fixture = c.tool_fixtures.find(
				(f) =>
					f.name === call.name &&
					matches(f.arguments, call.arguments) &&
					matches(call.arguments, f.arguments),
			);
			if (
				!fixture ||
				call.status !== fixture.status ||
				!matches(call.result, fixture.result)
			)
				reject("tool_fixture_mismatch");
		}
	}
	for (const [name, max] of Object.entries(c.max_calls))
		if ((counts.get(name) ?? 0) > max) reject("tool_replay_limit");
	let from = 0;
	for (const required of c.required_calls) {
		const index = trace.tool_calls.findIndex(
			(call, i) =>
				i >= from &&
				call.name === required.name &&
				matches(call.arguments, required.arguments ?? {}) &&
				(required.status === undefined || required.status === call.status),
		);
		if (index < 0) reject("required_tool_sequence");
		else from = index + 1;
	}
	// Returned tool data is incoming evidence, not an outgoing disclosure.
	const outgoing = JSON.stringify({
		answer: trace.answer,
		calls: trace.tool_calls.map(({ name, arguments: args }) => ({
			name,
			arguments: args,
		})),
	});
	if (c.forbidden_text.some((value) => outgoing.includes(value)))
		reject("synthetic_canary_disclosure");
	return failures;
}
export function gradeSuite(suite, traces, reviews = []) {
	const cases = new Map(suite.cases.map((c) => [c.id, c]));
	const captures = new Map();
	const hashes = new Map();
	for (const t of traces) {
		validateTrace(t);
		if (!cases.has(t.case_id)) fail("Trace names an unknown case");
		const key = `${t.case_id}:${t.condition}`;
		if (captures.has(key))
			fail(
				"Duplicate case/condition: use a separate report for repeated trials",
			);
		const hash = digest(t);
		captures.set(key, t);
		hashes.set(hash, t);
	}
	const decisions = new Map();
	for (const r of reviews) {
		validateReview(r);
		const trace = hashes.get(r.trace_sha256);
		if (!trace) fail("Review is not bound to a supplied trace");
		if (
			!cases.get(trace.case_id).reviews.some((check) => check.id === r.check_id)
		)
			fail("Review names an unknown rubric check");
		const key = `${r.trace_sha256}:${r.check_id}`;
		if (decisions.has(key)) fail("Duplicate reviewer decision");
		decisions.set(key, r);
	}
	const results = [];
	for (const c of suite.cases)
		for (const condition of CONDITIONS) {
			const trace = captures.get(`${c.id}:${condition}`);
			if (!trace) {
				results.push({ case_id: c.id, condition, status: "not_run" });
				continue;
			}
			const hash = digest(trace);
			const failures = automatic(c, trace, suite.skills_sha256);
			const missing = [];
			for (const check of c.reviews) {
				const review = decisions.get(`${hash}:${check.id}`);
				if (!review) missing.push(check.id);
				else if (review.verdict === "fail")
					failures.push({ check_id: check.id, critical: check.critical });
			}
			const captured = trace.provenance.kind === "captured";
			const status = captured
				? failures.length
					? "fail"
					: missing.length
						? "needs_review"
						: "pass"
				: "harness_only";
			results.push({
				case_id: c.id,
				condition,
				status,
				trace_sha256: hash,
				failures,
				missing_reviews: missing,
				...(captured
					? {}
					: { harness_checks: failures.length ? "fail" : "pass" }),
			});
		}
	const summary = Object.fromEntries(
		CONDITIONS.map((condition) => {
			const selected = results.filter((r) => r.condition === condition);
			return [
				condition,
				Object.fromEntries(
					["pass", "fail", "needs_review", "not_run", "harness_only"].map(
						(status) => [
							status,
							selected.filter((r) => r.status === status).length,
						],
					),
				),
			];
		}),
	);
	const withSkill = summary.with_skill;
	const status = withSkill.fail
		? "fail"
		: withSkill.pass === suite.case_count
			? "pass"
			: "incomplete";
	const comparisonComplete = results.every((r) =>
		["pass", "fail"].includes(r.status),
	);
	return {
		schema_version: 1,
		kind: "recorded_skill_evaluation",
		status,
		suite_sha256: suite.suite_sha256,
		skills_sha256: suite.skills_sha256,
		case_count: suite.case_count,
		summary,
		comparison: comparisonComplete
			? {
					status: "complete",
					additional_passing_cases:
						summary.with_skill.pass - summary.without_skill.pass,
				}
			: { status: "incomplete" },
		results,
	};
}
