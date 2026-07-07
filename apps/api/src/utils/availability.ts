export type OccupiedSeatInput = {
  bookedSlots: number;
  confirmedReservations: number;
  cancelledReservations: number;
};

export function calculateOccupiedSeats({
  bookedSlots,
  confirmedReservations,
  cancelledReservations,
}: OccupiedSeatInput) {
  return Math.max(0, bookedSlots + confirmedReservations - cancelledReservations);
}
