import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { seed, reset } from "drizzle-seed";

import * as authSchema from "./schemas/auth";
import * as appSchema from "./schemas/schema";
import { randomInt } from "crypto";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is not defined");
}

const db = drizzle(databaseUrl);

async function main() {
	const RESTAURANT_COUNT = 15;

	await reset(db, authSchema);
	await reset(db, appSchema);

	await seed(db, {
		user: authSchema.user,
		account: authSchema.account,
		restaurant: appSchema.restaurant,
		reservationSetting: appSchema.reservationSetting,
		reservation: appSchema.reservation,
		serviceWindow: appSchema.serviceWindow,
		comment: appSchema.comment,
		operatingHour: appSchema.operatingHour,
		favourite: appSchema.favourite
	}, {
		seed: randomInt(1, 1000),
	}).refine((f) => ({
		user: {
			count: 1,
			columns: {
				name: f.fullName(),
				email: f.valuesFromArray({
					values: ["test@test.com"]
				}),
				image: f.valuesFromArray({
					values: [
						"/images/avatar-1.png",
					],
				}),
				emailVerified: f.boolean(),
				createdAt: f.date(),
				updatedAt: f.date(),
			},
			with: {
				account: 1,
				favourite: 1
			}
		},
		account: {
			columns: {
				password: f.valuesFromArray({
					values: ["add0312e2c97afcdc0ef9d08849136ff:1fc26f59bb1601d4afa3d7a1ca513abab362f183d3cfba94a56e69283d0867fe1ca87e9afe4815957aa89af3599c4c8cacae0fb1e1d84bbf050c1641c2484204"]
				}), // 12345678
				providerId: f.valuesFromArray({
					values: ["credential"]
				}),
				accountId: f.uuid(),
			}
		},
		restaurant: {
			count: RESTAURANT_COUNT,
			columns: {
				name: f.companyName(),
				description: f.loremIpsum({
					sentencesCount: 1
				}),
				address: f.streetAddress(),
				neighborhood: f.valuesFromArray({
					values: ["Downtown", "Riverfront", "Old Town", "Midtown"],
				}),
				image: f.valuesFromArray({
					values: [
						"/images/restaurant-1.jpg",
						"/images/restaurant-2.jpg",
						"/images/restaurant-3.jpg",
						"/images/restaurant-4.jpg",
					],
				}),
				cuisineType: f.valuesFromArray({
					values: ["ASIAN", "PIZZA", "AMERICAN", "MEXICAN"],
				}),
				rating: f.number({ minValue: 1, maxValue: 5, precision: 100 }),
				latitude: f.number({ minValue: 34, maxValue: 35, precision: 1000 }),
				longitude: f.number({
					minValue: -118,
					maxValue: -119,
					precision: 1000,
				}),
				capacity: f.int({ minValue: 40, maxValue: 90 }),
			},
			with: {
				reservationSetting: 1,
				reservation: 4,
				comment: 10,
				operatingHour: 5
			}
		},
		reservationSetting: {
			columns: {
				slotIntervalMinutes: f.valuesFromArray({ values: [60, 30] }),
				defaultSlotCapacity: f.valuesFromArray({ values: [5, 10, 15] }),
			},
			with: {
				serviceWindow: 1
			}
		},
		reservation: {
			columns: {
				reservationDate: f.date({
					minDate: "2026-07-01",
					maxDate: "2026-07-07"
				}),
				reservationTime: f.valuesFromArray({
					values: ["13:00", "14:00", "14:30", "15:00", "19:00", "19:30", "20:00", "20:30", "21:00"],
				}),
				partySize: f.int({ minValue: 1, maxValue: 6 }),
				status: f.valuesFromArray({
					values: ["CONFIRMED", "CANCELLED"],
				}),
				createdAt: f.date({
					minDate: new Date("2026-06-01"),
					maxDate: new Date("2026-06-10"),
				}),
			},
		},
		serviceWindow: {
			columns: {
				name: f.valuesFromArray({
					values: ["Lunch"],
				}),
				start: f.valuesFromArray({
					values: ["11:00", "12:00"],
				}),
				end: f.valuesFromArray({
					values: ["14:00", "17:00"],
				}),
			},
		},
		comment: {
			columns: {
				rating: f.int({ minValue: 1, maxValue: 5 }),
				body: f.loremIpsum({
					sentencesCount: 1
				}),
				createdAt: f.date(),
			},
		}
	}));
	return;
}

main()
.then(() => {
	console.log("Seed completed successfully");
	process.exit(0);
})
.catch((error) => {
	console.error("Seed failed", error);
	process.exit(1);
});
