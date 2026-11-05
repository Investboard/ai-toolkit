import { createHash } from "node:crypto";

export const CONDITIONS = ["with_skill", "without_skill"];
export const LOCAL_TOOLS = ["read_file", "calculate"];
export const SKILLS = [
	"portfolio-intelligence",
	"investment-strategy-check",
	"investment-decision-making",
	"investment-thesis",
];
export class EvalInputError extends Error {}
export function fail(message) {
	throw new EvalInputError(message);
}
export function object(value, keys, label) {
	if (!value || typeof value !== "object" || Array.isArray(value))
		fail(`${label} must be an object`);
	if (Object.keys(value).some((key) => !keys.includes(key)))
		fail(`${label} has an unsupported field`);
}
export function string(value, label, max = 100_000) {
	if (typeof value !== "string" || !value.trim() || value.length > max)
		fail(`${label} must be a nonempty bounded string`);
}
export function strings(value, label) {
	if (!Array.isArray(value) || value.length > 100) fail(`Invalid ${label}`);
	for (const item of value) string(item, label);
	if (new Set(value).size !== value.length) fail(`Duplicate ${label}`);
}
export function digest(value) {
	return createHash("sha256")
		.update(typeof value === "string" ? value : JSON.stringify(value))
		.digest("hex");
}
export function safeRelative(value) {
	string(value, "relative path", 500);
	return (
		!value.startsWith("/") &&
		!value.includes("\\") &&
		!value.split("/").some((part) => !part || part === "." || part === "..")
	);
}
export function validateCase(c) {
	object(
		c,
		[
			"id",
			"skill",
			"prompt",
			"files",
			"allowed_tools",
			"required_calls",
			"max_calls",
			"forbidden_text",
			"reviews",
			"tool_fixtures",
		],
		"case",
	);
	string(c.id, "case id", 100);
	if (!/^[a-z0-9-]+$/.test(c.id)) fail("Invalid case id");
	if (![...SKILLS, "none", "any"].includes(c.skill))
		fail("Invalid expected skill");
	string(c.prompt, "prompt");
	for (const key of ["files", "allowed_tools", "forbidden_text"])
		strings(c[key], key);
	if (
		c.files.some(
			(file) =>
				!safeRelative(file) ||
				!["evals/fixtures/", "examples/"].some((root) => file.startsWith(root)),
		)
	)
		fail("Case fixtures must stay in the synthetic fixture directories");
	if (!Array.isArray(c.required_calls) || c.required_calls.length > 30)
		fail("Invalid required calls");
	for (const call of c.required_calls) {
		object(call, ["name", "arguments", "status"], "required call");
		string(call.name, "required tool");
		if (!c.allowed_tools.includes(call.name))
			fail("Required tool is not allowed");
		if (
			call.arguments !== undefined &&
			(!call.arguments ||
				typeof call.arguments !== "object" ||
				Array.isArray(call.arguments))
		)
			fail("Invalid required arguments");
		if (
			call.status !== undefined &&
			!["success", "error", "timeout"].includes(call.status)
		)
			fail("Invalid required tool status");
	}
	if (!Array.isArray(c.tool_fixtures)) fail("Tool fixture array is required");
	for (const fixture of c.tool_fixtures) {
		object(fixture, ["name", "arguments", "status", "result"], "tool fixture");
		string(fixture.name, "fixture tool name");
		if (
			!c.allowed_tools.includes(fixture.name) ||
			!["success", "error", "timeout"].includes(fixture.status)
		)
			fail("Invalid fixture tool");
		if (
			!fixture.arguments ||
			typeof fixture.arguments !== "object" ||
			Array.isArray(fixture.arguments)
		)
			fail("Invalid fixture arguments");
		if (!Object.hasOwn(fixture, "result")) fail("Fixture result is required");
	}
	object(c.max_calls, c.allowed_tools, "call limits");
	for (const count of Object.values(c.max_calls))
		if (!Number.isInteger(count) || count < 0 || count > 100)
			fail("Invalid call limit");
	if (!Array.isArray(c.reviews) || !c.reviews.length)
		fail("Manual rubric is required");
	const ids = new Set();
	for (const review of c.reviews) {
		object(review, ["id", "description", "critical"], "review check");
		string(review.id, "review id", 100);
		string(review.description, "review description");
		if (ids.has(review.id) || typeof review.critical !== "boolean")
			fail("Invalid review rubric");
		ids.add(review.id);
	}
}
export function validateTrace(t) {
	object(
		t,
		[
			"schema_version",
			"case_id",
			"condition",
			"case_sha256",
			"provenance",
			"skills_loaded",
			"tool_calls",
			"answer",
		],
		"trace",
	);
	if (t.schema_version !== 1 || !CONDITIONS.includes(t.condition))
		fail("Invalid trace version or condition");
	for (const key of ["case_id", "case_sha256", "answer"]) string(t[key], key);
	if (!/^[a-f0-9]{64}$/.test(t.case_sha256)) fail("Invalid case fingerprint");
	object(
		t.provenance,
		["kind", "environment", "client", "model", "source_ref", "skills_sha256"],
		"trace provenance",
	);
	const p = t.provenance;
	if (
		!["captured", "synthetic"].includes(p.kind) ||
		p.environment !== "synthetic"
	)
		fail(
			"Only labelled synthetic-environment captures or grader fixtures are accepted",
		);
	for (const key of ["client", "model", "source_ref"]) string(p[key], key, 500);
	if (t.condition === "with_skill") {
		if (!/^[a-f0-9]{64}$/.test(p.skills_sha256 ?? ""))
			fail("Invalid skill fingerprint");
	} else if (p.skills_sha256 !== null)
		fail("Baseline must declare no installed skills");
	strings(t.skills_loaded, "loaded skills");
	if (t.skills_loaded.some((s) => !SKILLS.includes(s)))
		fail("Unknown loaded skill");
	if (!Array.isArray(t.tool_calls) || t.tool_calls.length > 200)
		fail("Invalid tool calls");
	for (const call of t.tool_calls) {
		object(call, ["name", "arguments", "status", "result"], "tool call");
		string(call.name, "tool name", 200);
		if (
			!call.arguments ||
			typeof call.arguments !== "object" ||
			Array.isArray(call.arguments)
		)
			fail("Tool arguments must be an object");
		if (!["success", "error", "timeout"].includes(call.status))
			fail("Invalid tool status");
	}
}
export function validateReview(r) {
	object(r, ["trace_sha256", "check_id", "verdict", "reviewer"], "review");
	for (const key of ["trace_sha256", "check_id", "reviewer"])
		string(r[key], key, 500);
	if (
		!/^[a-f0-9]{64}$/.test(r.trace_sha256) ||
		!["pass", "fail"].includes(r.verdict)
	)
		fail("Invalid review decision");
}
