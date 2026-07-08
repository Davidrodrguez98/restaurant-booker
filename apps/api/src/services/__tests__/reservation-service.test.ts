import { describe, expect, it, jest } from "@jest/globals";

import { ReservationService } from "../reservation-service";

describe("ReservationService", () => {
	it("creates a reservation for an existing restaurant", async () => {
		const mockRestaurantRepository = {
			getById: jest.fn().mockResolvedValue({ id: "restaurant-1" }),
		};

		const mockReservationRepository = {
			createReservation: jest.fn().mockResolvedValue({
				id: "reservation-1",
				restaurantId: "restaurant-1",
				userId: "user-1",
				status: "CONFIRMED",
			}),
			getReservationsByUserId: jest.fn(),
			getReservationById: jest.fn(),
			cancelReservation: jest.fn(),
			getAvailability: jest.fn(),
		};

		const service = new ReservationService(
			mockReservationRepository as any,
			mockRestaurantRepository as any,
		);

		const reservation = await service.createReservation("user-1", {
			restaurantId: "restaurant-1",
			reservationDate: "2026-07-10",
			reservationTime: "19:00:00",
			partySize: 4,
		} as any);

		expect(mockRestaurantRepository.getById).toHaveBeenCalledWith("restaurant-1");
		expect(mockReservationRepository.createReservation).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({ restaurantId: "restaurant-1" }),
		);
		expect(reservation).toMatchObject({
			id: "reservation-1",
			restaurantId: "restaurant-1",
			userId: "user-1",
		});
	});

	it("returns availability slots for a given restaurant, date, and party size", async () => {
		const mockRestaurantRepository = {
			getById: jest.fn().mockResolvedValue({ id: "restaurant-1" }),
		};

		const mockReservationRepository = {
			getAvailability: jest.fn().mockResolvedValue([
				{ time: "13:00", available: true, remainingCapacity: 4, capacity: 4 },
				{ time: "13:30", available: false, remainingCapacity: 2, capacity: 4 },
			]),
		};

		const service = new ReservationService(
			mockReservationRepository as any,
			mockRestaurantRepository as any,
		);

		const availability = await service.getAvailability("restaurant-1", "2026-07-10", 4);

		expect(mockRestaurantRepository.getById).toHaveBeenCalledWith("restaurant-1");
		expect(mockReservationRepository.getAvailability).toHaveBeenCalledWith(
			"restaurant-1",
			"2026-07-10",
			4,
		);
		expect(availability).toEqual([
			{ time: "13:00", available: true, remainingCapacity: 4, capacity: 4 },
			{ time: "13:30", available: false, remainingCapacity: 2, capacity: 4 },
		]);
	});

	it("propagates slot conflict errors from repository", async () => {
		const conflictError = new Error(
			"Party size exceeds available seats for the selected slot",
		) as Error & { status?: number };
		conflictError.status = 409;

		const mockRestaurantRepository = {
			getById: jest.fn().mockResolvedValue({ id: "restaurant-1" }),
		};

		const mockReservationRepository = {
			createReservation: jest.fn().mockRejectedValue(conflictError),
			getReservationsByUserId: jest.fn(),
			getReservationById: jest.fn(),
			cancelReservation: jest.fn(),
			getAvailability: jest.fn(),
		};

		const service = new ReservationService(
			mockReservationRepository as any,
			mockRestaurantRepository as any,
		);

		await expect(
			service.createReservation("user-1", {
				restaurantId: "restaurant-1",
				reservationDate: "2026-07-10",
				reservationTime: "19:00:00",
				partySize: 6,
			} as any),
		).rejects.toMatchObject({
			message: "Party size exceeds available seats for the selected slot",
			status: 409,
		});
	});

	it("propagates already-cancelled conflict from repository", async () => {
		const alreadyCancelledError = new Error(
			"Cancelled reservation cannot be cancelled again",
		) as Error & { status?: number };
		alreadyCancelledError.status = 409;

		const mockReservationRepository = {
			cancelReservation: jest.fn().mockRejectedValue(alreadyCancelledError),
			createReservation: jest.fn(),
			getReservationsByUserId: jest.fn(),
			getReservationById: jest.fn(),
			getAvailability: jest.fn(),
		};

		const service = new ReservationService(mockReservationRepository as any, {
			getById: jest.fn(),
		} as any);

		await expect(
			service.cancelReservation("reservation-1", "user-1"),
		).rejects.toMatchObject({
			message: "Cancelled reservation cannot be cancelled again",
			status: 409,
		});
	});

	it("handles concurrent create attempts where only one succeeds", async () => {
		const conflictError = new Error(
			"Party size exceeds available seats for the selected slot",
		) as Error & { status?: number };
		conflictError.status = 409;

		const mockRestaurantRepository = {
			getById: jest.fn().mockResolvedValue({ id: "restaurant-1" }),
		};

		const mockReservationRepository = {
			createReservation: jest
				.fn()
				.mockResolvedValueOnce({ id: "reservation-1", status: "CONFIRMED" })
				.mockRejectedValueOnce(conflictError),
			getReservationsByUserId: jest.fn(),
			getReservationById: jest.fn(),
			cancelReservation: jest.fn(),
			getAvailability: jest.fn(),
		};

		const service = new ReservationService(
			mockReservationRepository as any,
			mockRestaurantRepository as any,
		);

		const requestData = {
			restaurantId: "restaurant-1",
			reservationDate: "2026-07-10",
			reservationTime: "19:00:00",
			partySize: 4,
		} as any;

		const [first, second] = await Promise.allSettled([
			service.createReservation("user-1", requestData),
			service.createReservation("user-2", requestData),
		]);

		expect(first.status).toBe("fulfilled");
		expect(second.status).toBe("rejected");
		if (second.status === "rejected") {
			expect(second.reason).toMatchObject({ status: 409 });
		}
	});
});
