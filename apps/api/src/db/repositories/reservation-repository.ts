import { desc, eq } from "drizzle-orm";

import { db } from "@/db/db";
import {
  reservation,
  type ReservationInsert,
} from "@/db/schemas/schema";

export class ReservationRepository {
  async getReservationsByUserId(userId: string) {
    return db
      .select()
      .from(reservation)
      .where(eq(reservation.userId, userId))
      .orderBy(desc(reservation.createdAt));
  }

  async getReservationById(reservationId: string) {
    const [result] = await db
      .select()
      .from(reservation)
      .where(eq(reservation.id, reservationId))
      .limit(1);

    return result ?? null;
  }

  async createReservation(
    userId: string,
    data: Omit<ReservationInsert, "id" | "userId" | "status" | "createdAt">
  ) {
    const [created] = await db
      .insert(reservation)
      .values({
        userId,
        status: "CONFIRMED",
        createdAt: new Date(),
        reservationDate: data.reservationDate,
        reservationTime: data.reservationTime,
        partySize: data.partySize,
        restaurantId: data.restaurantId,
      })
      .returning();

    return created;
  }

  async cancelReservation(reservationId: string) {
    const [updated] = await db
      .update(reservation)
      .set({ status: "CANCELLED" })
      .where(eq(reservation.id, reservationId))
      .returning();

    return updated ?? null;
  }
}

export const reservationRepository = new ReservationRepository();
