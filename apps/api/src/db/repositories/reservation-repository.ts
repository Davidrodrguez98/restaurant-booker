import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/db";
import {
  reservation,
  reservationSetting,
  serviceWindow,
  type ReservationInsert,
} from "@/db/schemas/schema";
import { calculateOccupiedSeats } from "@/utils/availability";

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

  async getAvailability(restaurantId: string, date: string, partySize: number) {
    const settings = await db
      .select({
        id: reservationSetting.id,
        slotIntervalMinutes: reservationSetting.slotIntervalMinutes,
        defaultSlotCapacity: reservationSetting.defaultSlotCapacity,
      })
      .from(reservationSetting)
      .where(eq(reservationSetting.restaurantId, restaurantId))
      .limit(1);

    const setting = settings[0];

    if (!setting) {
      return [];
    }

    const windows = await db
      .select({
        start: serviceWindow.start,
        end: serviceWindow.end,
      })
      .from(serviceWindow)
      .where(eq(serviceWindow.reservationSettingId, setting.id));

    const occupancyForDay = await db
      .select({
        reservationTime: reservation.reservationTime,
        confirmedReservations: sql<number>`sum(case when ${reservation.status} = 'CONFIRMED' then ${reservation.partySize} else 0 end)`.as("confirmedReservations"),
        cancelledReservations: sql<number>`sum(case when ${reservation.status} = 'CANCELLED' then ${reservation.partySize} else 0 end)`.as("cancelledReservations"),
      })
      .from(reservation)
      .where(
        and(
          eq(reservation.restaurantId, restaurantId),
          eq(reservation.reservationDate, date),
        ),
      )
      .groupBy(reservation.reservationTime);

    const occupancyByTime = new Map<string, { confirmed: number; cancelled: number }>();

    for (const occupancyEntry of occupancyForDay) {
      occupancyByTime.set(this.normalizeTime(occupancyEntry.reservationTime), {
        confirmed: Number(occupancyEntry.confirmedReservations ?? 0),
        cancelled: Number(occupancyEntry.cancelledReservations ?? 0),
      });
    }

    const slots: Array<{ time: string; capacity: number; available: boolean; remainingCapacity: number }> = [];

    for (const window of windows) {
      const startMinutes = this.timeToMinutes(window.start);
      const endMinutes = this.timeToMinutes(window.end);
      const interval = setting.slotIntervalMinutes;

      for (let minute = startMinutes; minute < endMinutes; minute += interval) {
        const slotTime = this.minutesToTime(minute);
        const occupancy = occupancyByTime.get(slotTime) ?? {
          confirmed: 0,
          cancelled: 0,
        };
        const bookedSlots = 0;
        const occupiedSeats = calculateOccupiedSeats({
          bookedSlots,
          confirmedReservations: occupancy.confirmed,
          cancelledReservations: occupancy.cancelled,
        });
        const remainingCapacity = Math.max(0, setting.defaultSlotCapacity - occupiedSeats);
        const available = remainingCapacity >= partySize;

        slots.push({
          time: slotTime,
          capacity: setting.defaultSlotCapacity,
          available,
          remainingCapacity,
        });
      }
    }

    return slots;
  }

  private normalizeTime(time: string | null) {
    if (!time) {
      return "00:00";
    }

    const [hours, minutes] = time.split(":").slice(0, 2).map(Number);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  private timeToMinutes(time: string | null) {
    if (!time) {
      return 0;
    }

    const [hours, minutes] = time.split(":").slice(0, 2).map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }
}

export const reservationRepository = new ReservationRepository();
