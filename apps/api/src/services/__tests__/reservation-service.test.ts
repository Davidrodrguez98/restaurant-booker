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
});
