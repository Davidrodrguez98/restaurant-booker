export type OccupiedSeatInput = {
  confirmedReservations: number;
  cancelledReservations: number;
};

export function calculateOccupiedSeats({
  confirmedReservations,
  cancelledReservations,
}: OccupiedSeatInput) {
  return Math.max(0, confirmedReservations - cancelledReservations);
}
