import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/db";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins";
import { user, session, account, verification } from "@/db/schemas/auth";
import {
	restaurant,
	reservationSetting,
	serviceWindow,
	favourite,
	comment,
	reservation,
	operatingHour,
} from "@/db/schemas/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user,
			session,
			account,
			verification,
			restaurant,
			reservationSetting,
			serviceWindow,
			favourite,
			comment,
			reservation,
			operatingHour,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		database: {
			generateId: "uuid",
			defaultFindManyLimit: 50,
		},
	},
	trustedOrigins: ["http://localhost:3001", "http://localhost:3000"],
	plugins: [bearer(), nextCookies()],
});
