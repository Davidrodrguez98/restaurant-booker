import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as authSchema from "@/db/schemas/auth";
import * as appSchema from "@/db/schemas/schema";
import { loadEnv } from "@/utils/load-env";

loadEnv();

const transactionDatabaseUrl =
	process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!transactionDatabaseUrl) {
	throw new Error("DATABASE_URL is not configured");
}

const transactionSql = postgres(transactionDatabaseUrl, {
	prepare: false,
	ssl: "require",
});

export const transactionDb = drizzle(transactionSql, {
	schema: {
		...appSchema,
		...authSchema,
	},
});