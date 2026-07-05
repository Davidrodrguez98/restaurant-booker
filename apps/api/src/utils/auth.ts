import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db";
import { restaurant } from "../db/schemas/schema";
import { user, session, account, verification } from "../db/schemas/auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		database: {
			generateId: "uuid",
		},
	},
	plugins: [nextCookies()],
});
