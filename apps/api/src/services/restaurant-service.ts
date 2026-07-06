

import {
  restaurantRepository,
  RestaurantRepository,
} from "@/db/repositories/restaurant-repository";
import type { RestaurantInsert } from "@/db/schemas/schema";
import { ensureRestaurantExists } from "@/utils/ensure-restaurant-exists";

export class RestaurantService {
  constructor(
    private readonly repository: RestaurantRepository =
      restaurantRepository,
  ) {}

  async getAllRestaurants() {
    return this.repository.getAll();
  }

  async getRestaurantById(id: string) {
    return ensureRestaurantExists(id, this.repository);
  }

  async createRestaurant(data: RestaurantInsert) {
    return this.repository.create(data);
  }

  async updateRestaurant(
    id: string,
    data: Partial<Omit<RestaurantInsert, "id">>,
  ) {
    const existingRestaurant = await this.repository.getById(id);

    if (!existingRestaurant) {
      throw new Error("Restaurant not found");
    }

    return this.repository.update(id, data);
  }

  async deleteRestaurant(id: string) {
    const existingRestaurant = await this.repository.getById(id);

    if (!existingRestaurant) {
      throw new Error("Restaurant not found");
    }

    return this.repository.delete(id);
  }
}

export const restaurantService = new RestaurantService();