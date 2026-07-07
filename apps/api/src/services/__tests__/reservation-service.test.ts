import { describe, expect, it, jest } from "@jest/globals";

import { ReservationService } from "../reservation-service";

describe("ReservationService", () => {
	it("creates a reservation for an existing restaurant", async () => {
		const mockRepository = {
			getById: jest.fn().mockResolvedValue({ id: "restaurant-1" }),
			createReservation: jest.fn().mockResolvedValue({
				id: "reservation-1",
				restaurantId: "restaurant-1",
				userId: "user-1",
				status: "CONFIRMED",
			}),
		};

		const service = new ReservationService(
			{
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
			} as any,
			mockRepository as any,
		);

		const reservation = await service.createReservation("user-1", {
			restaurantId: "restaurant-1",
			reservationDate: "2026-07-10",
			reservationTime: "19:00",
			partySize: 4,
		});

		expect(mockRepository.getById).toHaveBeenCalledWith("restaurant-1");
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
});
