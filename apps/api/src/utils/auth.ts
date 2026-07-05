import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db";
import { restaurant } from "../db/schema/restaurant";
import { user, session, account, verification } from "../db/schema/auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			restaurant,
			user,
			session,
			account,
			verification,
		}
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()]
});
