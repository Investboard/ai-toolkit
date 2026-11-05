import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { digest, fail, SKILLS, validateCase } from "./contracts.mjs";

const MAX_FILE_BYTES = 16 * 1024 * 1024;
export async function readBounded(file) {
	if ((await stat(file)).size > MAX_FILE_BYTES)
		fail("Input file exceeds the local size limit");
	return readFile(file, "utf8");
}
export async function readJsonl(file) {
	if (!file) return [];
	const lines = (await readBounded(file)).split(/\r?\n/);
	const rows = [];
	for (let index = 0; index < lines.length; index++) {
		if (!lines[index].trim()) continue;
		try {
			rows.push(JSON.parse(lines[index]));
		} catch {
			fail(`Invalid JSON at input line ${index + 1}`);
		}
	}
	return rows;
}
export async function skillFingerprint(root) {
	const base = path.join(root, "plugins/investboard/skills");
	const entries = [];
	async function visit(dir) {
		for (const entry of (await readdir(dir, { withFileTypes: true })).sort(
			(a, b) => a.name.localeCompare(b.name),
		)) {
			const file = path.join(dir, entry.name);
			if (entry.isSymbolicLink())
				fail("Skill fingerprint refuses symbolic links");
			if (entry.isDirectory()) await visit(file);
			else
				entries.push([
					path.relative(base, file).split(path.sep).join("/"),
					digest(await readBounded(file)),
				]);
		}
	}
	await visit(base);
	return digest(entries);
}
export async function loadSuite(root) {
	let cases;
	try {
		cases = JSON.parse(await readBounded(path.join(root, "evals/cases.json")));
	} catch {
		fail("Cannot read the evaluation corpus");
	}
	if (!Array.isArray(cases) || cases.length !== 24)
		fail("Expected the complete 24-case corpus");
	const seen = new Set();
	const packets = [];
	const realRoot = await realpath(root);
	for (const c of cases) {
		validateCase(c);
		if (seen.has(c.id)) fail("Duplicate case id");
		seen.add(c.id);
		const files = [];
		for (const relative of c.files) {
			const resolved = await realpath(path.join(root, relative));
			if (resolved !== path.join(realRoot, relative))
				fail("Fixture escapes its declared path or uses a symbolic link");
			files.push([relative, digest(await readBounded(resolved))]);
		}
		packets.push({ ...c, case_sha256: digest({ case: c, files }) });
	}
	for (const skill of SKILLS)
		if (cases.filter((c) => c.skill === skill).length !== 5)
			fail("Each skill needs five cases");
	return {
		schema_version: 1,
		kind: "suite_validation",
		status: "valid",
		behavior_status: "not_run",
		case_count: packets.length,
		skills_sha256: await skillFingerprint(root),
		suite_sha256: digest(packets.map((p) => [p.id, p.case_sha256])),
		cases: packets,
	};
}
