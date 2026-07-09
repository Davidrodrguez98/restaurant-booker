import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/db";
import { transactionDb } from "@/db/transaction-db";
import {
	reservation,
	reservationSetting,
	serviceWindow,
	type ReservationInsert,
} from "@/db/schemas/schema";
import { calculateOccupiedSeats } from "@/utils/availability";

type CreateReservationInput = Omit<
	ReservationInsert,
	"id" | "userId" | "status" | "createdAt"
>;

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

	async createReservation(userId: string, data: CreateReservationInput) {
		if (data.partySize <= 0) {
			throw this.createError("Party size must be greater than zero", 400);
		}

		const normalizedTime = this.normalizeTime(data.reservationTime);
		const databaseTime = this.toDatabaseTime(normalizedTime);

		this.assertReservationInFuture(data.reservationDate, normalizedTime);

		return transactionDb.transaction(async (tx) => {
			const setting = await this.getReservationSetting(tx, data.restaurantId);

			if (!setting) {
				throw this.createError("Reservation settings not found", 404);
			}

			const windows = await this.getServiceWindows(tx, setting.id);

			if (!this.isTimeWithinGeneratedSlots(normalizedTime, windows, setting.slotIntervalMinutes)) {
				throw this.createError("Reservation time must match one of the generated slots", 400);
			}

			await this.acquireSlotLock(
				tx,
				data.restaurantId,
				data.reservationDate,
				normalizedTime,
			);

			const occupancy = await this.getSlotOccupancy(
				tx,
				data.restaurantId,
				data.reservationDate,
				databaseTime,
			);

			const occupiedSeats = calculateOccupiedSeats({
				confirmedReservations: occupancy.createdReservations,
				cancelledReservations: occupancy.cancelledReservations,
			});

			const remainingCapacity = Math.max(0, setting.defaultSlotCapacity - occupiedSeats);

			if (data.partySize > remainingCapacity) {
				throw this.createError(
					"Party size exceeds available seats for the selected slot",
					409,
				);
			}

			const [created] = await tx
				.insert(reservation)
				.values({
					userId,
					status: "CONFIRMED",
					createdAt: new Date(),
					reservationDate: data.reservationDate,
					reservationTime: databaseTime,
					partySize: data.partySize,
					restaurantId: data.restaurantId,
				})
				.returning();

			return created;
		});
	}

	async cancelReservation(reservationId: string, userId: string) {
		return transactionDb.transaction(async (tx) => {
			const [existingReservation] = await tx
				.select()
				.from(reservation)
				.where(eq(reservation.id, reservationId))
				.limit(1);

			if (!existingReservation) {
				throw this.createError("Reservation not found", 404);
			}

			if (existingReservation.userId !== userId) {
				throw this.createError("Forbidden", 403);
			}

			if (existingReservation.status === "CANCELLED") {
				throw this.createError("Cancelled reservation cannot be cancelled again", 409);
			}

			await this.acquireSlotLock(
				tx,
				existingReservation.restaurantId,
				existingReservation.reservationDate,
				this.normalizeTime(existingReservation.reservationTime),
			);

			const [updated] = await tx
				.update(reservation)
				.set({ status: "CANCELLED" })
				.where(
					and(
						eq(reservation.id, reservationId),
						eq(reservation.status, "CONFIRMED"),
					),
				)
				.returning();

			if (!updated) {
				throw this.createError("Cancelled reservation cannot be cancelled again", 409);
			}

			return updated;
		});
	}

	async getAvailability(restaurantId: string, date: string, partySize: number) {
		const setting = await this.getReservationSetting(db, restaurantId);

		if (!setting) {
			return [];
		}

		const windows = await this.getServiceWindows(db, setting.id);
		const occupancyForDay = await this.getDayOccupancy(db, restaurantId, date);

		const occupancyByTime = new Map<
			string,
			{ created: number; cancelled: number }
		>();

		// Populate the occupancyByTime map with the occupancy data for each time slot
		for (const occupancyEntry of occupancyForDay) {
			occupancyByTime.set(this.normalizeTime(occupancyEntry.reservationTime), {
				created: Number(occupancyEntry.createdReservations ?? 0),
				cancelled: Number(occupancyEntry.cancelledReservations ?? 0),
			});
		}

		const slots: Array<{
			time: string;
			capacity: number;
			available: boolean;
			remainingCapacity: number;
		}> = [];

		for (const window of windows) {
			const startMinutes = this.timeToMinutes(window.start);
			const endMinutes = this.timeToMinutes(window.end);
			const interval = setting.slotIntervalMinutes;

			for (let minute = startMinutes; minute < endMinutes; minute += interval) {
				const slotTime = this.minutesToTime(minute);
				const occupancy = occupancyByTime.get(slotTime) ?? {
					created: 0,
					cancelled: 0,
				};
				const occupiedSeats = calculateOccupiedSeats({
					confirmedReservations: occupancy.created,
					cancelledReservations: occupancy.cancelled,
				});
				const remainingCapacity = Math.max(
					0,
					setting.defaultSlotCapacity - occupiedSeats,
				);
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

	private async getDayOccupancy(tx: any, restaurantId: string, reservationDate: string) {
		return tx
			.select({
				reservationTime: reservation.reservationTime,
				createdReservations:
					sql<number>`coalesce(sum(${reservation.partySize}), 0)`.as(
						"createdReservations",
					),
				cancelledReservations:
					sql<number>`coalesce(sum(case when ${reservation.status} = 'CANCELLED' then ${reservation.partySize} else 0 end), 0)`.as(
						"cancelledReservations",
					),
			})
			.from(reservation)
			.where(
				and(
					eq(reservation.restaurantId, restaurantId),
					eq(reservation.reservationDate, reservationDate),
				),
			)
			.groupBy(reservation.reservationTime);
	}

	private async getReservationSetting(tx: any, restaurantId: string) {
		const [setting] = await tx
			.select({
				id: reservationSetting.id,
				slotIntervalMinutes: reservationSetting.slotIntervalMinutes,
				defaultSlotCapacity: reservationSetting.defaultSlotCapacity,
			})
			.from(reservationSetting)
			.where(eq(reservationSetting.restaurantId, restaurantId))
			.limit(1);

		return setting ?? null;
	}

	private async getServiceWindows(tx: any, reservationSettingId: string) {
		return tx
			.select({
				start: serviceWindow.start,
				end: serviceWindow.end,
			})
			.from(serviceWindow)
			.where(eq(serviceWindow.reservationSettingId, reservationSettingId));
	}

	private async getSlotOccupancy(
		tx: any,
		restaurantId: string,
		reservationDate: string,
		reservationTime: string,
	) {
		const [occupancy] = await tx
			.select({
				createdReservations:
					sql<number>`coalesce(sum(${reservation.partySize}), 0)`.as(
						"createdReservations",
					),
				cancelledReservations:
					sql<number>`coalesce(sum(case when ${reservation.status} = 'CANCELLED' then ${reservation.partySize} else 0 end), 0)`.as(
						"cancelledReservations",
					),
			})
			.from(reservation)
			.where(
				and(
					eq(reservation.restaurantId, restaurantId),
					eq(reservation.reservationDate, reservationDate),
					eq(reservation.reservationTime, reservationTime),
				),
			)
			.limit(1);

		return {
			createdReservations: Number(occupancy?.createdReservations ?? 0),
			cancelledReservations: Number(occupancy?.cancelledReservations ?? 0),
		};
	}

	private isTimeWithinGeneratedSlots(
		normalizedReservationTime: string,
		windows: Array<{ start: string | null; end: string | null }>,
		slotIntervalMinutes: number,
	) {
		for (const window of windows) {
			const startMinutes = this.timeToMinutes(window.start);
			const endMinutes = this.timeToMinutes(window.end);

			for (
				let minute = startMinutes;
				minute < endMinutes;
				minute += slotIntervalMinutes
			) {
				if (this.minutesToTime(minute) === normalizedReservationTime) {
					return true;
				}
			}
		}

		return false;
	}

	private assertReservationInFuture(reservationDate: string, reservationTime: string) {
		const reservationDateTime = new Date(`${reservationDate}T${reservationTime}:00`);

		if (Number.isNaN(reservationDateTime.getTime())) {
			throw this.createError("Invalid reservation date or time", 400);
		}

		if (reservationDateTime <= new Date()) {
			throw this.createError("A reservation cannot be created in the past", 400);
		}
	}

	private async acquireSlotLock(
		tx: any,
		restaurantId: string,
		reservationDate: string,
		normalizedReservationTime: string,
	) {
		const slotKey = `${reservationDate}:${normalizedReservationTime}`;

		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtext(${restaurantId}), hashtext(${slotKey}))`,
		);
	}

	private toDatabaseTime(time: string) {
		return `${time}:00`;
	}

	private createError(message: string, status: number) {
		const error = new Error(message) as Error & { status?: number };
		error.status = status;
		return error;
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
