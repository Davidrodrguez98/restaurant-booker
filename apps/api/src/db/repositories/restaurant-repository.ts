import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { transactionDb } from "@/db/transaction-db";
import {
  reservationSetting,
  restaurant,
  serviceWindow,
  type RestaurantInsert,
} from "@/db/schemas/schema";

const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
const DEFAULT_SLOT_CAPACITY = 10;

const DEFAULT_SERVICE_WINDOWS = [
  {
    name: "Lunch",
    start: "13:00",
    end: "15:00",
  },
  {
    name: "Dinner",
    start: "20:00",
    end: "23:00",
  },
] as const;

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
    const created = await transactionDb.transaction(async (tx) => {
      const [newRestaurant] = await tx.insert(restaurant).values(data).returning();

      const [setting] = await tx
        .insert(reservationSetting)
        .values({
          restaurantId: newRestaurant.id,
          slotIntervalMinutes: DEFAULT_SLOT_INTERVAL_MINUTES,
          defaultSlotCapacity: DEFAULT_SLOT_CAPACITY,
        })
        .returning();

      await tx.insert(serviceWindow).values(
        DEFAULT_SERVICE_WINDOWS.map((window) => ({
          reservationSettingId: setting.id,
          name: window.name,
          start: window.start,
          end: window.end,
        })),
      );

      return newRestaurant;
    });

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