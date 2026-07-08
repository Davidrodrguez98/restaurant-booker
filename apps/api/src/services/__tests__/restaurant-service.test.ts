import { describe, expect, it, jest } from "@jest/globals";

jest.mock("@/db/repositories/restaurant-repository", () => ({
	restaurantRepository: {},
}));

import { RestaurantService } from "../restaurant-service";

describe("RestaurantService", () => {
	it("returns all restaurants", async () => {
		const mockRepository = {
			getAll: jest
				.fn()
				.mockImplementation(() =>
					Promise.resolve([{ id: "restaurant-1", name: "R1" }]),
				),
		};

		const service = new RestaurantService(mockRepository as any);
		const restaurants = await service.getAllRestaurants();

		expect(mockRepository.getAll).toHaveBeenCalled();
		expect(restaurants).toEqual([{ id: "restaurant-1", name: "R1" }]);
	});

	it("updates a restaurant when it exists", async () => {
		const mockRepository = {
			getById: jest
				.fn()
				.mockImplementation(() => Promise.resolve({ id: "restaurant-1" })),
			update: jest
				.fn()
				.mockImplementation(() =>
					Promise.resolve({ id: "restaurant-1", name: "Updated" }),
				),
		};

		const service = new RestaurantService(mockRepository as any);
		const updated = await service.updateRestaurant("restaurant-1", {
			name: "Updated",
		} as any);

		expect(mockRepository.getById).toHaveBeenCalledWith("restaurant-1");
		expect(mockRepository.update).toHaveBeenCalledWith("restaurant-1", {
			name: "Updated",
		});
		expect(updated).toEqual({ id: "restaurant-1", name: "Updated" });
	});

	it("throws when deleting a restaurant that does not exist", async () => {
		const mockRepository = {
			getById: jest.fn().mockImplementation(() => Promise.resolve(null)),
			delete: jest.fn(),
		};

		const service = new RestaurantService(mockRepository as any);

		await expect(service.deleteRestaurant("restaurant-1")).rejects.toThrow(
			"Restaurant not found",
		);
		expect(mockRepository.delete).not.toHaveBeenCalled();
	});
});
