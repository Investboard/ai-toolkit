import { isDeepStrictEqual } from "node:util";
import { digest, fail, SKILLS, validateTrace } from "./contracts.mjs";
import { validateSession } from "./local-session.mjs";

function wireMatches(value, expected, isError, depth = 0) {
	if (isDeepStrictEqual(value, expected)) return true;
	if (depth > 4) return false;
	if (typeof value === "string") {
		try {
			return wireMatches(JSON.parse(value), expected, isError, depth + 1);
		} catch {
			return false;
		}
	}
	if (Array.isArray(value))
		return (
			value.length === 1 &&
			value[0]?.type === "text" &&
			wireMatches(value[0].text, expected, isError, depth + 1)
		);
	// Accept the MCP envelope, not arbitrary objects containing a convenient sub-result.
	return (
		value &&
		typeof value === "object" &&
		Object.keys(value).every((key) =>
			["content", "structuredContent", "isError", "_meta"].includes(key),
		) &&
		isDeepStrictEqual(value.structuredContent, expected) &&
		(value.isError ?? false) === isError &&
		wireMatches(value.content, expected, isError, depth + 1)
	);
}
function skillId(value) {
	return typeof value === "string" && value.startsWith("investboard:")
		? value.slice("investboard:".length)
		: value;
}
export function normalizeClaude(session, events, journal, { kind, sourceRef }) {
	validateSession(session);
	if (!["captured", "synthetic"].includes(kind))
		fail("Declare captured or synthetic provenance explicitly");
	if (!sourceRef) fail("Original capture reference is required");
	const init = events.filter(
		(e) => e.type === "system" && e.subtype === "init",
	);
	const end = events.filter((e) => e.type === "result");
	if (
		init.length !== 1 ||
		end.length !== 1 ||
		end[0].subtype !== "success" ||
		end[0].is_error
	)
		fail(
			"A complete, successful client capture is required; keep incomplete originals separately",
		);
	if (
		init[0].claude_code_version &&
		session.configuration.client !==
			`Claude Code ${init[0].claude_code_version}`
	)
		fail("Client version differs from prepared configuration");
	if (
		!Array.isArray(init[0].mcp_servers) ||
		init[0].mcp_servers.length !== 1 ||
		init[0].mcp_servers[0].name !== "investboard" ||
		init[0].mcp_servers[0].status !== "connected"
	)
		fail("Capture must connect only to the local fixture server");
	const expectedTools = [
		"Skill",
		...session.configuration.mock_tools.map(
			(t) => `mcp__investboard__${t.name}`,
		),
	];
	if (
		!Array.isArray(init[0].tools) ||
		!isDeepStrictEqual([...init[0].tools].sort(), expectedTools.sort())
	)
		fail("Unexpected client tools; isolate the session before recording");
	const handshakes = journal.filter((r) => r.type === "initialize");
	if (
		!handshakes.length ||
		handshakes.some(
			(r) =>
				r.instructions_sha256 !== digest(session.configuration.instructions) ||
				r.configuration_sha256 !== session.configuration_sha256,
		)
	)
		fail("Missing or mismatched local MCP initialization evidence");
	const uses = [],
		results = new Map(),
		ids = new Set(),
		models = new Set(),
		answers = [];
	for (const event of events) {
		if (event.type === "assistant") {
			if (event.message?.model) models.add(event.message.model);
			for (const block of event.message?.content ?? []) {
				if (block.type === "tool_use") {
					if (!block.id || ids.has(block.id))
						fail("Duplicate or missing tool-use identity");
					ids.add(block.id);
					uses.push(block);
				} else if (block.type === "text") answers.push(block.text);
			}
		} else if (event.type === "user") {
			for (const block of event.message?.content ?? [])
				if (block.type === "tool_result") {
					if (results.has(block.tool_use_id)) fail("Duplicate tool result");
					results.set(block.tool_use_id, block);
				}
		}
	}
	if (models.size !== 1 || !models.has(session.configuration.requested_model))
		fail("Capture must identify the exact prepared model without fallback");
	if ([...results.keys()].some((id) => !ids.has(id)))
		fail("Orphan tool result");
	const mock = journal.filter((r) => r.type === "tool_call"),
		consumed = new Set(),
		loaded = new Set();
	const calls = [];
	for (const use of uses) {
		const result = results.get(use.id);
		if (!result) fail("Missing tool result; preserve the incomplete capture");
		const args = use.input ?? {},
			status = result.is_error ? "error" : "success";
		if (use.name.startsWith("mcp__investboard__")) {
			const name = use.name.slice("mcp__investboard__".length);
			const index = mock.findIndex(
				(r, i) =>
					!consumed.has(i) &&
					r.name === name &&
					isDeepStrictEqual(r.arguments, args),
			);
			if (index < 0)
				fail("MCP tool use is not corroborated by the local server journal");
			const row = mock[index];
			consumed.add(index);
			if (
				(row.status === "success") !== !result.is_error ||
				!wireMatches(result.content, row.result, row.status !== "success")
			)
				fail("Client tool result differs from local fixture evidence");
			calls.push({
				name,
				arguments: args,
				status: row.status,
				result: row.result,
			});
			if (name === "read_file" && row.status === "success") {
				const match = args.path?.match(
					/^plugins\/investboard\/skills\/([^/]+)\/SKILL.md$/,
				);
				if (match && SKILLS.includes(match[1])) loaded.add(match[1]);
			}
		} else if (use.name === "Skill") {
			const skill = skillId(args.skill);
			calls.push({
				name: "load_skill",
				arguments: { ...args, skill },
				status,
				result: result.content,
			});
			if (status === "success" && SKILLS.includes(skill)) loaded.add(skill);
		} else {
			// Never drop, or relabel, unexpected shell/network/helper calls.
			calls.push({
				name: use.name,
				arguments: args,
				status,
				result: result.content,
			});
		}
	}
	if (consumed.size !== mock.length) fail("Unaccounted local server calls");
	// Preserve visible pre-tool commentary too: disclosure before the final answer still counts.
	if (
		typeof end[0].result === "string" &&
		end[0].result.trim() &&
		!answers.includes(end[0].result)
	)
		answers.push(end[0].result);
	const answer = answers.join("\n\n");
	if (!answer) fail("Final answer is missing");
	const trace = {
		schema_version: 1,
		case_id: session.packet.id,
		condition: session.condition,
		case_sha256: session.packet.case_sha256,
		provenance: {
			kind,
			environment: "synthetic",
			client: session.configuration.client,
			model: [...models][0],
			configuration_sha256: session.configuration_sha256,
			source_ref: sourceRef,
			skills_sha256:
				session.condition === "with_skill" ? session.skills_sha256 : null,
		},
		skills_loaded: [...loaded],
		tool_calls: calls,
		answer,
	};
	validateTrace(trace);
	return trace;
}
