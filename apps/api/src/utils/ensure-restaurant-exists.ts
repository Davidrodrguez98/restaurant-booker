import type { RestaurantRepository } from "@/db/repositories/restaurant-repository";

export async function ensureRestaurantExists(
  restaurantId: string,
  repository: Pick<RestaurantRepository, "getById">,
) {
  const restaurant = await repository.getById(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  return restaurant;
}
