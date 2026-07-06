import { describe, expect, it, jest } from "@jest/globals";

jest.mock("@/db/repositories/restaurant-repository", () => ({
	restaurantRepository: {},
}));

import { RestaurantService } from "../restaurant-service";

describe("RestaurantService comments", () => {
	it("creates a comment for an existing restaurant", async () => {
		const mockRepository = {
			getById: jest.fn().mockResolvedValue({ id: "restaurant-1" }),
			createComment: jest.fn().mockResolvedValue({
				id: "comment-1",
				restaurantId: "restaurant-1",
				userId: "user-1",
				rating: 5,
				body: "Excellent",
			}),
		};

		const service = new RestaurantService(mockRepository);

		const comment = await service.createComment("restaurant-1", "user-1", {
			rating: 5,
			body: "Excellent",
		});

		expect(mockRepository.getById).toHaveBeenCalledWith("restaurant-1");
		expect(mockRepository.createComment).toHaveBeenCalledWith("restaurant-1", "user-1", {
			rating: 5,
			body: "Excellent",
		});
		expect(comment).toMatchObject({
			id: "comment-1",
			restaurantId: "restaurant-1",
			userId: "user-1",
		});
	});

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

		const service = new RestaurantService(mockRepository);

		const reservation = await service.createReservation("user-1", {
			restaurantId: "restaurant-1",
			reservationDate: "2026-07-10",
			reservationTime: "19:00",
			partySize: 4,
		});

		expect(mockRepository.getById).toHaveBeenCalledWith("restaurant-1");
		expect(mockRepository.createReservation).toHaveBeenCalledWith("user-1", {
			restaurantId: "restaurant-1",
			reservationDate: "2026-07-10",
			reservationTime: "19:00",
			partySize: 4,
		});
		expect(reservation).toMatchObject({
			id: "reservation-1",
			restaurantId: "restaurant-1",
			userId: "user-1",
		});
	});
});
