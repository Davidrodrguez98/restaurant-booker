import {
  restaurantRepository,
  RestaurantRepository,
} from "@/db/repositories/restaurant-repository";
import {
  reservationRepository,
  ReservationRepository,
} from "@/db/repositories/reservation-repository";
import { ReservationInsert } from "@/db/schemas/schema";
import { ensureRestaurantExists } from "@/utils/ensure-restaurant-exists";

export class ReservationService {
  constructor(
    private readonly repository: ReservationRepository = reservationRepository,
    private readonly restaurants: RestaurantRepository = restaurantRepository,
  ) {}

  async createReservation(userId: string, data: ReservationInsert) {
    await ensureRestaurantExists(data.restaurantId, this.restaurants);

    return this.repository.createReservation(userId, data);
  }

  async getAvailability(restaurantId: string, date: string, partySize: number) {
    await ensureRestaurantExists(restaurantId, this.restaurants);

    return this.repository.getAvailability(restaurantId, date, partySize);
  }

  async getMyReservations(userId: string) {
    return this.repository.getReservationsByUserId(userId);
  }

  async getReservationById(reservationId: string) {
    const reservation = await this.repository.getReservationById(reservationId);

    if (!reservation) {
      const error = new Error("Reservation not found") as Error & { status?: number };
      error.status = 404;
      throw error;
    }

    return reservation;
  }

  async cancelReservation(reservationId: string, userId: string) {
    return this.repository.cancelReservation(reservationId, userId);
  }
}

export const reservationService = new ReservationService();
