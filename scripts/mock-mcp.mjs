#!/usr/bin/env node
// Local stdio only. No HTTP listener, account SDK, OAuth, or network operation.
import { open, readFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import {
	validateSession,
	verifyCaptureCode,
} from "../evals/lib/local-session.mjs";
import { createFixtureServer } from "../evals/lib/mock-mcp.mjs";

export async function serve(
	directory,
	input = process.stdin,
	output = process.stdout,
) {
	const session = JSON.parse(
		await readFile(path.join(directory, "session.json"), "utf8"),
	);
	validateSession(session);
	await verifyCaptureCode(
		path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
		session,
	);
	const journal = await open(
		path.join(directory, "mock-journal.jsonl"),
		"wx",
		0o600,
	);
	try {
		const handle = await createFixtureServer(session, directory, (row) =>
			journal.writeFile(`${JSON.stringify(row)}\n`),
		);
		const lines = createInterface({ input, crlfDelay: Infinity });
		for await (const line of lines) {
			if (Buffer.byteLength(line) > 4 * 1024 * 1024)
				throw new Error("Message too large");
			let response;
			try {
				response = await handle(JSON.parse(line));
			} catch {
				response = {
					jsonrpc: "2.0",
					id: null,
					error: { code: -32700, message: "Invalid fixture request" },
				};
			}
			if (response) output.write(`${JSON.stringify(response)}\n`);
		}
	} finally {
		await journal.close();
	}
}
if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const [flag, directory, ...rest] = process.argv.slice(2);
	if (flag !== "--session" || !directory || rest.length) {
		console.error("Use mock-mcp.mjs --session PREPARED_DIRECTORY");
		process.exitCode = 1;
	} else
		serve(path.resolve(directory)).catch(() => {
			console.error(
				"Local fixture server stopped; inspect the prepared session and a fresh journal path.",
			);
			process.exitCode = 1;
		});
}
