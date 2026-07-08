import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as appSchema from "@/db/schemas/schema";
import * as authSchema from "@/db/schemas/auth";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({
	client: sql,
	schema: {
		...appSchema,
		...authSchema,
	},
});
