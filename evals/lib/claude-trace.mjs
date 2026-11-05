import path from "node:path";
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
		session.configuration.client !==
		`Claude Code ${init[0].claude_code_version}`
	)
		fail("Client version differs from prepared configuration");
	if (!session.workspace_paths.includes(init[0].cwd))
		fail("Client workspace differs from the prepared session");
	const plugins = init[0].plugins,
		expectedSkills =
			session.condition === "with_skill" ? [...SKILLS].sort() : [];
	if (
		!Array.isArray(plugins) ||
		(session.condition === "without_skill"
			? plugins.length !== 0
			: plugins.length !== 1 ||
				plugins[0].name !== "investboard" ||
				!session.workspace_paths.some(
					(workspace) =>
						path.join(workspace, "plugins/investboard") === plugins[0].path,
				)) ||
		!Array.isArray(init[0].skills) ||
		!isDeepStrictEqual(init[0].skills.map(skillId).sort(), expectedSkills) ||
		(init[0].plugin_errors !== undefined &&
			(!Array.isArray(init[0].plugin_errors) || init[0].plugin_errors.length))
	)
		fail(
			"Client plugin or available-skill inventory differs from the prepared session",
		);
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
	const denied = new Map();
	if (
		!Array.isArray(end[0].permission_denials) ||
		end[0].permission_denials.length > 200 ||
		uses.length > 200
	)
		fail(
			"Terminal permission-denial evidence is missing or exceeds capture limits",
		);
	for (const denial of end[0].permission_denials) {
		const use = uses.find((u) => u.id === denial?.tool_use_id);
		if (
			!use ||
			denied.has(use.id) ||
			denial.tool_name !== use.name ||
			!isDeepStrictEqual(denial.tool_input, use.input ?? {})
		)
			fail(
				"Terminal permission denial does not match a unique captured tool attempt",
			);
		if (results.has(use.id) && !results.get(use.id).is_error)
			fail("Permission denial contradicts a successful tool result");
		denied.set(use.id, denial);
	}
	for (const event of events.filter(
		(e) => e.type === "system" && e.subtype === "permission_denied",
	)) {
		const denial = denied.get(event.tool_use_id);
		if (!denial || denial.tool_name !== event.tool_name)
			fail("Permission-denied event lacks matching terminal evidence");
	}
	const mock = journal.filter((r) => r.type === "tool_call"),
		consumed = new Set(),
		loaded = new Set();
	const calls = [];
	for (const use of uses) {
		const result = results.get(use.id);
		if (!result && !denied.has(use.id))
			fail("Missing tool result; preserve the incomplete capture");
		const args = use.input ?? {},
			status = denied.has(use.id) || result.is_error ? "error" : "success";
		if (denied.has(use.id)) {
			// Permission-layer refusals never reach the fixture server. Retain the
			// attempted name/arguments instead of requiring a nonexistent server call.
			calls.push({
				name: use.name.startsWith("mcp__investboard__")
					? use.name.slice("mcp__investboard__".length)
					: use.name === "Skill"
						? "load_skill"
						: use.name,
				arguments:
					use.name === "Skill" ? { ...args, skill: skillId(args.skill) } : args,
				status: "error",
				result: result?.content ?? { code: "permission_denied" },
			});
			continue;
		}
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
