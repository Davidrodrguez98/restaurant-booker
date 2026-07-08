import {
	favouriteRepository,
	FavouriteRepository,
	favouriteRepository,
	FavouriteRepository,
} from "../db/repositories/favourite-repository";
import {
	restaurantRepository,
	RestaurantRepository,
} from "../db/repositories/restaurant-repository";

export class FavouriteService {
	constructor(
		private readonly favourites: FavouriteRepository = favouriteRepository,
		private readonly restaurants: RestaurantRepository = restaurantRepository,
	) {}

	async getMyFavourites(userId: string) {
		return this.favourites.getByUserId(userId);
	}

	async addFavourite(userId: string, restaurantId: string) {
		const restaurant = await this.restaurants.getById(restaurantId);

		if (!restaurant) {
			throw new Error("Restaurant not found");
		}

		const existing = await this.favourites.getByUserIdAndRestaurantId(
			userId,
			restaurantId,
		);

		if (existing) {
			return existing;
		}

		return this.favourites.create(userId, restaurantId);
	}

	async removeFavourite(userId: string, restaurantId: string) {
		const existing = await this.favourites.getByUserIdAndRestaurantId(
			userId,
			restaurantId,
		);

		if (!existing) {
			throw new Error("Favourite not found");
		}

		return this.favourites.delete(userId, restaurantId);
	}
}

export const favouriteService = new FavouriteService();
