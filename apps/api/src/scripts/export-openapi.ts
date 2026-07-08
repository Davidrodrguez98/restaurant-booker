import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { swaggerDocs } from "@/openapi";

async function main() {
	const outputDir = resolve(process.cwd(), "openapi");
	const outputFile = resolve(outputDir, "openapi.json");

	await mkdir(outputDir, { recursive: true });
	await writeFile(outputFile, JSON.stringify(swaggerDocs, null, 2), "utf-8");

	console.log(`OpenAPI spec exported to ${outputFile}`);
}

main().catch((error) => {
	console.error("Failed to export OpenAPI spec:", error);
	process.exit(1);
});
