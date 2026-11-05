import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { digest, fail, safeRelative } from "./contracts.mjs";

// Synthetic interfaces, not a copy of the production input/output contracts.
const descriptions = {
	get_policy: "Read the investor's investment policy.",
	get_status: "Read the investor's current mandate standing.",
	check_action: "Check a stated allocation change and save a check.",
	record_decision: "Record a stated outcome for a saved check.",
	get_reflection_history: "Read saved checks and outcomes by id or cursor.",
	get_own_record: "Read the investor's thesis by ticker and optional exchange.",
	get_journal: "Read journal entries and due reviews by cursor.",
	get_portfolio_holdings: "Read connected portfolio holdings.",
	get_portfolio_analysis: "Read portfolio exposures and overlap.",
	get_portfolio_correlations: "Read measured historical correlations.",
	prepare_portfolio_import:
		"Stage supplied portfolio data for investor confirmation.",
	get_portfolio_import: "Read this client's import submission status.",
};
export const MOCK_TOOLS = Object.entries(descriptions)
	.map(([name, description]) => ({
		name,
		description,
		inputSchema: { type: "object", additionalProperties: true },
		annotations: {
			readOnlyHint: ![
				"get_policy",
				"check_action",
				"record_decision",
				"prepare_portfolio_import",
			].includes(name),
			destructiveHint: ["check_action", "record_decision"].includes(name),
			openWorldHint: false,
		},
	}))
	.concat([
		{
			name: "read_file",
			description:
				"Read an attached local file or a loaded plugin skill reference by relative path.",
			inputSchema: {
				type: "object",
				properties: { path: { type: "string" } },
				required: ["path"],
				additionalProperties: false,
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
	]);

export async function createFixtureServer(session, directory, record) {
	const workspace = await realpath(path.join(directory, "workspace"));
	const read = async (args) => {
		if (
			!args ||
			Object.keys(args).length !== 1 ||
			typeof args.path !== "string" ||
			!safeRelative(args.path)
		)
			return { status: "error", result: { code: "fixture_file_denied" } };
		const file = args.path;
		if (!session.files.includes(file))
			return { status: "error", result: { code: "fixture_file_denied" } };
		const expected = path.join(workspace, file);
		try {
			if ((await realpath(expected)) !== expected)
				return { status: "error", result: { code: "fixture_file_denied" } };
			const content = await readFile(expected, "utf8");
			if (digest(content) !== session.file_hashes[file])
				fail("Prepared fixture changed");
			return { status: "success", result: { path: file, content } };
		} catch {
			return { status: "error", result: { code: "fixture_file_unreadable" } };
		}
	};
	let initialized = false;
	const counts = new Map();
	return async (message) => {
		if (
			!message ||
			message.jsonrpc !== "2.0" ||
			typeof message.method !== "string"
		)
			return {
				jsonrpc: "2.0",
				id: message?.id ?? null,
				error: { code: -32600, message: "Invalid request" },
			};
		if (!Object.hasOwn(message, "id")) return undefined;
		const response = (result) => ({ jsonrpc: "2.0", id: message.id, result });
		if (message.method === "initialize") {
			initialized = true;
			await record({
				type: "initialize",
				instructions_sha256: digest(session.configuration.instructions),
				configuration_sha256: session.configuration_sha256,
			});
			return response({
				protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
				capabilities: { tools: {} },
				serverInfo: { name: "Investboard local fixtures", version: "1.0.0" },
				instructions: session.configuration.instructions,
			});
		}
		if (!initialized)
			return {
				jsonrpc: "2.0",
				id: message.id,
				error: { code: -32000, message: "Initialize first" },
			};
		if (message.method === "ping") return response({});
		if (message.method === "tools/list") return response({ tools: MOCK_TOOLS });
		if (message.method !== "tools/call")
			return {
				jsonrpc: "2.0",
				id: message.id,
				error: { code: -32601, message: "Method not found" },
			};
		const name = message.params?.name,
			args = message.params?.arguments ?? {};
		let outcome;
		if (name === "read_file") outcome = await read(args);
		else {
			const fixture = session.packet.tool_fixtures.find(
				(f) => f.name === name && isDeepStrictEqual(f.arguments, args),
			);
			// Match the grader's per-tool budget, independent of argument key order.
			counts.set(name, (counts.get(name) ?? 0) + 1);
			outcome =
				fixture && counts.get(name) <= (session.packet.max_calls[name] ?? 1)
					? { status: fixture.status, result: fixture.result }
					: {
							status: "error",
							result: { code: "fixture_not_configured_or_replayed" },
						};
		}
		await record({ type: "tool_call", name, arguments: args, ...outcome });
		return response({
			content: [{ type: "text", text: JSON.stringify(outcome.result) }],
			structuredContent: outcome.result,
			isError: outcome.status !== "success",
		});
	};
}
