import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";

const candidatePaths = [
	resolve(process.cwd(), "apps/api/.env"),
	resolve(process.cwd(), "apps/api/.env.local"),
	resolve(process.cwd(), ".env"),
	resolve(process.cwd(), ".env.local"),
];

export function loadEnv() {
	for (const candidatePath of candidatePaths) {
		if (existsSync(candidatePath)) {
			config({ path: candidatePath });
			return;
		}
	}

	config();
}