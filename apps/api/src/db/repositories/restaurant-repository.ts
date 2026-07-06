

import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { restaurant, type RestaurantInsert } from "@/db/schemas/schema";

export class RestaurantRepository {
  async getAll() {
    return db.select().from(restaurant);
  }

  async getById(id: string) {
    const [result] = await db
      .select()
      .from(restaurant)
      .where(eq(restaurant.id, id))
      .limit(1);

    return result ?? null;
  }

  async create(data: RestaurantInsert) {
    const [created] = await db.insert(restaurant).values(data).returning();

    return created;
  }

  async update(
    id: string,
    data: Partial<Omit<RestaurantInsert, "id">>,
  ) {
    const [updated] = await db
      .update(restaurant)
      .set(data)
      .where(eq(restaurant.id, id))
      .returning();

    return updated ?? null;
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(restaurant)
      .where(eq(restaurant.id, id))
      .returning();

    return deleted ?? null;
  }
}

export const restaurantRepository = new RestaurantRepository();