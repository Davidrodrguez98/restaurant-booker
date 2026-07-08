import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { build } from "esbuild";

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(apiDir, "src");
const distDir = path.join(apiDir, "dist");

await rm(distDir, { recursive: true, force: true });

await build({
	entryPoints: [
		path.join(srcDir, "index.ts"),
		path.join(srcDir, "scripts/export-openapi.ts"),
	],
	outdir: distDir,
	outbase: srcDir,
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	packages: "external",
	sourcemap: true,
	sourcesContent: true,
	legalComments: "none",
	logLevel: "info",
	tsconfig: path.join(apiDir, "tsconfig.json"),
});
