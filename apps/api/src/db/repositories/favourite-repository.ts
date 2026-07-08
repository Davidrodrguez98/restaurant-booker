import { and, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { favourite } from "@/db/schemas/schema";

export class FavouriteRepository {
	async getByUserId(userId: string) {
		return db.query.favourite.findMany({
			where: eq(favourite.userId, userId),
			with: {
				restaurant: true,
			},
		});
	}

	async getByUserIdAndRestaurantId(userId: string, restaurantId: string) {
		const [result] = await db
			.select()
			.from(favourite)
			.where(
				and(
					eq(favourite.userId, userId),
					eq(favourite.restaurantId, restaurantId),
				),
			)
			.limit(1);

		return result ?? null;
	}

	async create(userId: string, restaurantId: string) {
		const [created] = await db
			.insert(favourite)
			.values({
				userId,
				restaurantId,
			})
			.returning();

		return created;
	}

	async delete(userId: string, restaurantId: string) {
		const [deleted] = await db
			.delete(favourite)
			.where(
				and(
					eq(favourite.userId, userId),
					eq(favourite.restaurantId, restaurantId),
				),
			)
			.returning();

		return deleted ?? null;
	}
}

export const favouriteRepository = new FavouriteRepository();
