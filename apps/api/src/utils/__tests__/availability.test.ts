import { describe, expect, it } from "@jest/globals";

import { calculateOccupiedSeats } from "../availability";

describe("calculateOccupiedSeats", () => {
  it("adds pre-booked slots and confirmed reservations while subtracting cancelled reservations", () => {
    expect(
      calculateOccupiedSeats({
        bookedSlots: 2,
        confirmedReservations: 5,
        cancelledReservations: 1,
      }),
    ).toBe(6);
  });

  it("does not return negative occupied seats", () => {
    expect(
      calculateOccupiedSeats({
        bookedSlots: 0,
        confirmedReservations: 2,
        cancelledReservations: 4,
      }),
    ).toBe(0);
  });
});
