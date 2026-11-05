#!/usr/bin/env node
// Offline only: reads saved synthetic-environment traces, never invokes an agent.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EvalInputError } from "../evals/lib/contracts.mjs";
import { gradeSuite } from "../evals/lib/grade.mjs";
import { loadSuite, readJsonl } from "../evals/lib/suite.mjs";

export async function main(args) {
	const [command, ...options] = args;
	if (command === "--help" || command === "help") {
		console.log(
			"Offline skill evaluations: validate [--output FILE] | grade [--traces JSONL] [--reviews JSONL] [--output FILE]",
		);
		return 0;
	}
	if (!["validate", "grade"].includes(command))
		throw new Error(
			"Use validate or grade; no live/model execution mode exists",
		);
	const flags = new Map();
	for (let i = 0; i < options.length; i += 2) {
		const flag = options[i],
			value = options[i + 1];
		if (
			!["--traces", "--reviews", "--output"].includes(flag) ||
			!value ||
			value.startsWith("--") ||
			flags.has(flag)
		)
			throw new Error("Invalid, duplicate or incomplete option");
		flags.set(flag, value);
	}
	if (
		command === "validate" &&
		(flags.has("--traces") || flags.has("--reviews"))
	)
		throw new Error(
			"Validation does not accept model traces or reviewer decisions",
		);
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
	const suite = await loadSuite(root);
	const result =
		command === "validate"
			? suite
			: gradeSuite(
					suite,
					await readJsonl(flags.get("--traces")),
					await readJsonl(flags.get("--reviews")),
				);
	const output = flags.get("--output");
	if (output) {
		// Do not accidentally overwrite an input capture or a source file.
		const destination = path.resolve(output);
		if (
			[flags.get("--traces"), flags.get("--reviews")]
				.filter(Boolean)
				.some((input) => path.resolve(input) === destination)
		)
			throw new Error("Output must not replace an input capture");
		if (!path.basename(destination).endsWith(".json"))
			throw new Error("Use a new JSON report path");
		await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`, {
			flag: "wx",
		});
		console.log(
			JSON.stringify({
				kind: result.kind,
				status: result.status,
				behavior_status: result.behavior_status,
				summary: result.summary,
				output: destination,
			}),
		);
	} else console.log(JSON.stringify(result, null, 2));
	return command === "validate" || result.status === "pass"
		? 0
		: result.status === "fail"
			? 1
			: 2;
}
if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	main(process.argv.slice(2))
		.then((code) => {
			process.exitCode = code;
		})
		.catch((error) => {
			// Inputs can contain private text; do not echo parser exceptions or payloads.
			console.error(
				error instanceof EvalInputError
					? `Skill evaluation failed: ${error.message}. No model was invoked.`
					: "Skill evaluation failed: check input schemas, fingerprints and a new output path. No model was invoked.",
			);
			process.exitCode = 1;
		});
}
