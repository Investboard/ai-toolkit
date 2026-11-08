import { mkdir, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { CONDITIONS, digest, fail, safeRelative } from "./contracts.mjs";
import { MOCK_TOOLS } from "./mock-mcp.mjs";
import { loadSuite, readBounded } from "./suite.mjs";

export const SMOKE_CASES = [
	"portfolio-overlap-file-only",
	"portfolio-partial-coverage",
	"thesis-file-draft",
	"strategy-injected-policy",
	"decision-no-consent",
	"decision-lost-write-response",
	"negative-unrelated-task",
	"negative-order-execution",
];
export async function captureFingerprint(root) {
	const sources = [
		"scripts/mock-mcp.mjs",
		"scripts/capture-skills.mjs",
		"evals/lib/mock-mcp.mjs",
		"evals/lib/local-session.mjs",
		"evals/lib/claude-trace.mjs",
		"evals/lib/contracts.mjs",
	];
	return digest(
		await Promise.all(
			sources.map(async (file) => [
				file,
				digest(await readBounded(path.join(root, file))),
			]),
		),
	);
}
export async function verifyCaptureCode(root, session) {
	if (session.configuration.adapter_sha256 !== (await captureFingerprint(root)))
		fail("Capture adapter changed after session preparation");
}
export function validateSession(s) {
	if (
		s.schema_version !== 1 ||
		!CONDITIONS.includes(s.condition) ||
		!s.packet?.case_sha256 ||
		!Array.isArray(s.files) ||
		!Array.isArray(s.workspace_paths) ||
		!s.workspace_paths.length ||
		s.workspace_paths.some(
			(p) => typeof p !== "string" || !path.isAbsolute(p),
		) ||
		!s.file_hashes ||
		s.files.some(
			(f) =>
				typeof f !== "string" ||
				!safeRelative(f) ||
				(!s.packet.files.includes(f) &&
					!(
						s.condition === "with_skill" && f.startsWith("plugins/investboard/")
					)),
		) ||
		s.configuration_sha256 !== digest(s.configuration) ||
		!Array.isArray(s.configuration?.mock_tools) ||
		digest(s.configuration.mock_tools) !== digest(MOCK_TOOLS)
	)
		fail("Invalid prepared capture session");
}
export async function saveNew(file, value) {
	await writeFile(
		file,
		typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
		{ flag: "wx", mode: 0o600 },
	);
}
export async function verifySessionFiles(directory, session) {
	validateSession(session);
	const workspace = await realpath(path.join(directory, "workspace"));
	for (const file of session.files) {
		const target = path.join(workspace, file);
		if (
			(await realpath(target)) !== target ||
			digest(await readBounded(target)) !== session.file_hashes[file]
		)
			fail("Prepared input changed after capture setup");
	}
}
export async function prepareSession(root, directory, options) {
	const suite = await loadSuite(root),
		packet = suite.cases.find((c) => c.id === options.caseId);
	if (!packet || !CONDITIONS.includes(options.condition))
		fail("Unknown case or condition");
	for (const key of ["instructions", "clientVersion", "model"])
		if (typeof options[key] !== "string" || !options[key].trim())
			fail("Instructions, client version and exact model are required");
	await mkdir(directory, { mode: 0o700 }); // Never reuse or overwrite a session.
	const workspace = path.join(directory, "workspace");
	await mkdir(workspace, { mode: 0o700 });
	await mkdir(path.join(directory, "claude-config"), { mode: 0o700 });
	const files = [],
		file_hashes = {};
	async function copy(relative) {
		const original = path.join(await realpath(root), relative);
		if ((await realpath(original)) !== original)
			fail("Prepared input uses a symbolic link");
		const content = await readBounded(original);
		await mkdir(path.dirname(path.join(workspace, relative)), {
			recursive: true,
		});
		await saveNew(path.join(workspace, relative), content);
		files.push(relative);
		file_hashes[relative] = digest(content);
	}
	for (const file of packet.files) await copy(file);
	if (options.condition === "with_skill") {
		const visit = async (relative) => {
			for (const entry of await readdir(path.join(root, relative), {
				withFileTypes: true,
			})) {
				if (entry.isSymbolicLink()) fail("Plugin copy refuses symbolic links");
				const file = `${relative}/${entry.name}`;
				if (entry.isDirectory()) await visit(file);
				else await copy(file);
			}
		};
		await visit("plugins/investboard/skills");
		await copy("plugins/investboard/.claude-plugin/plugin.json");
		const manifest = JSON.parse(
			await readBounded(
				path.join(workspace, "plugins/investboard/.claude-plugin/plugin.json"),
			),
		);
		if (
			[
				"mcpServers",
				"hooks",
				"agents",
				"commands",
				"outputStyles",
				"lspServers",
				"settings",
			].some((key) => Object.hasOwn(manifest, key))
		)
			fail(
				"Plugin manifest has execution components this isolated adapter does not support",
			);
	}
	const configuration = {
		client: `Claude Code ${options.clientVersion}`,
		requested_model: options.model,
		instructions: options.instructions,
		mock_tools: MOCK_TOOLS,
		builtin_tools: ["Skill"],
		effort: "low",
		isolation: "fresh-config-no-hooks-memory-connectors;local-fixtures-only",
		adapter_sha256: await captureFingerprint(root),
		system_context:
			"default Claude Code system context; fresh workspace and config; skill toggle excluded",
	};
	const session = {
		schema_version: 1,
		workspace_paths: [
			...new Set([path.resolve(workspace), await realpath(workspace)]),
		],
		condition: options.condition,
		packet,
		skills_sha256: suite.skills_sha256,
		suite_sha256: suite.suite_sha256,
		configuration,
		configuration_sha256: digest(configuration),
		files,
		file_hashes,
	};
	await saveNew(path.join(directory, "session.json"), session);
	const mcp = {
		mcpServers: {
			investboard: {
				command: process.execPath,
				args: [path.join(root, "scripts/mock-mcp.mjs"), "--session", directory],
				env: {
					ANTHROPIC_API_KEY: "",
					ANTHROPIC_AUTH_TOKEN: "",
					CLAUDE_CODE_OAUTH_TOKEN: "",
				},
			},
		},
	};
	await saveNew(path.join(directory, "mcp.json"), mcp);
	const prompt =
		packet.prompt +
		(packet.files.length
			? "\n\nAttached local files (use read_file with these relative paths):\n" +
				packet.files.join("\n")
			: "");
	await saveNew(path.join(directory, "prompt.txt"), prompt);
	const args = [
		"--print",
		"--verbose",
		"--output-format",
		"stream-json",
		"--model",
		options.model,
		"--effort",
		"low",
		"--max-turns",
		"12",
		"--tools",
		"Skill",
		"--permission-mode",
		"dontAsk",
		"--allowedTools",
		"Skill",
		...MOCK_TOOLS.map((t) => `mcp__investboard__${t.name}`),
		"--setting-sources",
		"",
		"--settings",
		JSON.stringify({
			enabledPlugins: {},
			disableBundledSkills: true,
			disableAllHooks: true,
			autoMemoryEnabled: false,
			disableClaudeAiConnectors: true,
			syncClaudeAiPlugins: false,
			syncClaudeAiSkills: false,
		}),
		"--strict-mcp-config",
		"--mcp-config",
		path.join(directory, "mcp.json"),
		"--no-chrome",
		"--no-session-persistence",
	];
	if (options.condition === "with_skill")
		args.push("--plugin-dir", path.join(workspace, "plugins/investboard"));
	await saveNew(path.join(directory, "invocation.json"), {
		executable: "claude",
		args,
		cwd: workspace,
		stdin_file: path.join(directory, "prompt.txt"),
		stdout_file: path.join(directory, "claude-stream.jsonl"),
		stderr_file: path.join(directory, "claude-stderr.log"),
		env: {
			CLAUDE_CONFIG_DIR: path.join(directory, "claude-config"),
			DISABLE_AUTOUPDATER: "1",
			CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
			CLAUDE_CODE_SKIP_PROMPT_HISTORY: "1",
			CLAUDE_CODE_DISABLE_BUNDLED_SKILLS: "1",
			CLAUDE_CODE_DISABLE_CLAUDE_MDS: "1",
			DISABLE_DOCTOR_COMMAND: "1",
			ENABLE_TOOL_SEARCH: "false",
		},
		auth: "Supply the existing subscription OAuth token in memory only. Never use an API key or token helper.",
		billing_gate:
			"Do not execute unless the same account has included quota and paid usage credits are OFF. Recheck before each session. Stop on a quota error; no retries or model fallback.",
	});
	return {
		case_id: packet.id,
		condition: options.condition,
		status: "prepared_not_run",
		directory,
	};
}
