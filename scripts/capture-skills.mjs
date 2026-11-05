#!/usr/bin/env node
// Preparation and normalization only. This command NEVER launches Claude.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeClaude } from "../evals/lib/claude-trace.mjs";
import { EvalInputError, fail } from "../evals/lib/contracts.mjs";
import {
	prepareSession,
	SMOKE_CASES,
	saveNew,
	verifyCaptureCode,
	verifySessionFiles,
} from "../evals/lib/local-session.mjs";
import { loadSuite, readBounded, readJsonl } from "../evals/lib/suite.mjs";

export async function main(args) {
	const [command, ...options] = args;
	if (command === "--help") {
		console.log(
			"Offline capture adapter: prepare|prepare-smoke --output-dir DIR --instructions FILE --client-version VERSION --model EXACT_ID [--case ID --condition with_skill|without_skill] | normalize --session DIR --stream JSONL --kind captured|synthetic --output NEW_JSONL",
		);
		return;
	}
	const flags = new Map();
	const allowed =
		command === "normalize"
			? ["--session", "--stream", "--kind", "--output"]
			: [
					"--output-dir",
					"--instructions",
					"--client-version",
					"--model",
					...(command === "prepare" ? ["--case", "--condition"] : []),
				];
	if (!["prepare", "prepare-smoke", "normalize"].includes(command))
		fail("Unknown offline capture command");
	for (let i = 0; i < options.length; i += 2) {
		if (
			!allowed.includes(options[i]) ||
			!options[i + 1] ||
			options[i + 1].startsWith("--") ||
			flags.has(options[i])
		)
			fail("Invalid capture options");
		flags.set(options[i], options[i + 1]);
	}
	for (const key of allowed)
		if (!flags.has(key)) fail("Required capture option is missing");
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
	if (command === "normalize") {
		const directory = path.resolve(flags.get("--session"));
		const session = JSON.parse(
			await readBounded(path.join(directory, "session.json")),
		);
		await verifySessionFiles(directory, session);
		await verifyCaptureCode(root, session);
		const suite = await loadSuite(root);
		if (
			session.suite_sha256 !== suite.suite_sha256 ||
			session.skills_sha256 !== suite.skills_sha256 ||
			JSON.stringify(session.packet) !==
				JSON.stringify(suite.cases.find((c) => c.id === session.packet.id))
		)
			fail("Prepared session differs from the current corpus or skills");
		const stream = path.resolve(flags.get("--stream"));
		const trace = normalizeClaude(
			session,
			await readJsonl(stream),
			await readJsonl(path.join(directory, "mock-journal.jsonl")),
			{ kind: flags.get("--kind"), sourceRef: stream },
		);
		const output = path.resolve(flags.get("--output"));
		await saveNew(output, `${JSON.stringify(trace)}\n`);
		console.log(
			JSON.stringify({
				status: "normalized_not_reviewed",
				case_id: trace.case_id,
				condition: trace.condition,
				provenance_kind: trace.provenance.kind,
				output,
			}),
		);
	} else {
		const options = {
			instructions: await readBounded(flags.get("--instructions")),
			clientVersion: flags.get("--client-version"),
			model: flags.get("--model"),
		};
		const directory = path.resolve(flags.get("--output-dir"));
		const prepared = [];
		if (command === "prepare-smoke") {
			await mkdir(directory, { mode: 0o700 });
			for (const caseId of SMOKE_CASES)
				for (const condition of ["with_skill", "without_skill"])
					prepared.push(
						await prepareSession(
							root,
							path.join(directory, `${caseId}-${condition}`),
							{ ...options, caseId, condition },
						),
					);
			await saveNew(path.join(directory, "plan.json"), {
				status: "prepared_not_run",
				prepared,
			});
		} else
			prepared.push(
				await prepareSession(root, directory, {
					...options,
					caseId: flags.get("--case"),
					condition: flags.get("--condition"),
				}),
			);
		console.log(
			JSON.stringify({
				status: "prepared_not_run",
				sessions: prepared.length,
				directory,
			}),
		);
	}
}
if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
	main(process.argv.slice(2)).catch((error) => {
		console.error(
			error instanceof EvalInputError
				? error.message
				: "Capture adapter stopped; inspect schemas and use new output paths. No model was invoked.",
		);
		process.exitCode = 1;
	});
