import { describe, expect, it, jest } from "@jest/globals";

import { ReservationRepository } from "../reservation-repository";

type MockTxConfig = {
  selectResults?: unknown[];
  insertResults?: unknown[];
  updateResults?: unknown[];
};

function createMockTx(config: MockTxConfig = {}) {
  const selectResults = [...(config.selectResults ?? [])];
  const insertResults = [...(config.insertResults ?? [])];
  const updateResults = [...(config.updateResults ?? [])];

  const execute = jest.fn().mockResolvedValue([]);
  const insertValues = jest.fn();
  const updateSet = jest.fn();

  const tx = {
    execute,
    select: jest.fn(() => {
      const result = selectResults.shift() ?? [];

      return {
        from: jest.fn(() => ({
          where: jest.fn(() => {
            const whereResult = {
              limit: jest.fn(async () => result),
              then: (resolve: (value: unknown) => unknown) =>
                Promise.resolve(result).then(resolve),
            };

            return whereResult;
          }),
        })),
      };
    }),
    insert: jest.fn(() => ({
      values: insertValues.mockImplementation(() => ({
        returning: jest.fn(async () => insertResults.shift() ?? []),
      })),
    })),
    update: jest.fn(() => ({
      set: updateSet.mockImplementation(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(async () => updateResults.shift() ?? []),
        })),
      })),
    })),
  };

  return {
    tx,
    execute,
    insertValues,
    updateSet,
  };
}

function createRepositoryWithTx(config: MockTxConfig = {}) {
  const { tx, execute, insertValues } = createMockTx(config);

  const writeDb = {
    transaction: jest.fn(async (callback: (innerTx: unknown) => unknown) =>
      callback(tx),
    ),
  };

  const readDb = {
    select: jest.fn(),
  };

  const repository = new ReservationRepository(readDb as any, writeDb as any);

  return {
    repository,
    writeDb,
    execute,
    insertValues,
  };
}

describe("ReservationRepository business rules", () => {
  it("rejects reservation creation in the past", async () => {
    const { repository, writeDb } = createRepositoryWithTx();

    await expect(
      repository.createReservation("user-1", {
        restaurantId: "restaurant-1",
        reservationDate: "2000-01-01",
        reservationTime: "19:00:00",
        partySize: 2,
      } as any),
    ).rejects.toMatchObject({
      message: "A reservation cannot be created in the past",
      status: 400,
    });

    expect((writeDb.transaction as jest.Mock).mock.calls.length).toBe(0);
  });

  it("rejects reservation time that is not generated from service windows", async () => {
    const { repository } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "setting-1",
            slotIntervalMinutes: 30,
            defaultSlotCapacity: 4,
          },
        ],
        [{ start: "18:00:00", end: "20:00:00" }],
      ],
    });

    await expect(
      repository.createReservation("user-1", {
        restaurantId: "restaurant-1",
        reservationDate: "2999-01-01",
        reservationTime: "20:30:00",
        partySize: 2,
      } as any),
    ).rejects.toMatchObject({
      message: "Reservation time must match one of the generated slots",
      status: 400,
    });
  });

  it("rejects creation when party size exceeds slot remaining seats", async () => {
    const { repository } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "setting-1",
            slotIntervalMinutes: 30,
            defaultSlotCapacity: 4,
          },
        ],
        [{ start: "18:00:00", end: "21:00:00" }],
        [{ createdReservations: 4, cancelledReservations: 1 }],
      ],
    });

    await expect(
      repository.createReservation("user-1", {
        restaurantId: "restaurant-1",
        reservationDate: "2999-01-01",
        reservationTime: "19:00:00",
        partySize: 2,
      } as any),
    ).rejects.toMatchObject({
      message: "Party size exceeds available seats for the selected slot",
      status: 409,
    });
  });

  it("creates reservation when capacity is available and acquires slot lock", async () => {
    const createdReservation = [
      {
        id: "reservation-1",
        restaurantId: "restaurant-1",
        reservationDate: "2999-01-01",
        reservationTime: "19:00:00",
        partySize: 2,
        status: "CONFIRMED",
      },
    ];

    const { repository, execute, insertValues } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "setting-1",
            slotIntervalMinutes: 30,
            defaultSlotCapacity: 4,
          },
        ],
        [{ start: "18:00:00", end: "21:00:00" }],
        [{ createdReservations: 2, cancelledReservations: 0 }],
      ],
      insertResults: [createdReservation],
    });

    const result = await repository.createReservation("user-1", {
      restaurantId: "restaurant-1",
      reservationDate: "2999-01-01",
      reservationTime: "19:00:00",
      partySize: 2,
    } as any);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        status: "CONFIRMED",
        restaurantId: "restaurant-1",
        reservationDate: "2999-01-01",
        reservationTime: "19:00:00",
        partySize: 2,
      }),
    );
    expect(result).toMatchObject({ id: "reservation-1" });
  });

  it("rejects cancelling a reservation that does not exist", async () => {
    const { repository } = createRepositoryWithTx({
      selectResults: [[]],
    });

    await expect(repository.cancelReservation("reservation-1", "user-1")).rejects.toMatchObject({
      message: "Reservation not found",
      status: 404,
    });
  });

  it("rejects cancelling another user's reservation", async () => {
    const { repository } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "reservation-1",
            userId: "user-2",
            status: "CONFIRMED",
            restaurantId: "restaurant-1",
            reservationDate: "2999-01-01",
            reservationTime: "19:00:00",
          },
        ],
      ],
    });

    await expect(repository.cancelReservation("reservation-1", "user-1")).rejects.toMatchObject({
      message: "Forbidden",
      status: 403,
    });
  });

  it("rejects cancelling an already cancelled reservation", async () => {
    const { repository } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "reservation-1",
            userId: "user-1",
            status: "CANCELLED",
            restaurantId: "restaurant-1",
            reservationDate: "2999-01-01",
            reservationTime: "19:00:00",
          },
        ],
      ],
    });

    await expect(repository.cancelReservation("reservation-1", "user-1")).rejects.toMatchObject({
      message: "Cancelled reservation cannot be cancelled again",
      status: 409,
    });
  });

  it("rejects when cancellation races and no confirmed row is updated", async () => {
    const { repository } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "reservation-1",
            userId: "user-1",
            status: "CONFIRMED",
            restaurantId: "restaurant-1",
            reservationDate: "2999-01-01",
            reservationTime: "19:00:00",
          },
        ],
      ],
      updateResults: [[]],
    });

    await expect(repository.cancelReservation("reservation-1", "user-1")).rejects.toMatchObject({
      message: "Cancelled reservation cannot be cancelled again",
      status: 409,
    });
  });

  it("cancels a confirmed reservation when business checks pass", async () => {
    const updatedReservation = [
      {
        id: "reservation-1",
        userId: "user-1",
        status: "CANCELLED",
      },
    ];

    const { repository, execute } = createRepositoryWithTx({
      selectResults: [
        [
          {
            id: "reservation-1",
            userId: "user-1",
            status: "CONFIRMED",
            restaurantId: "restaurant-1",
            reservationDate: "2999-01-01",
            reservationTime: "19:00:00",
          },
        ],
      ],
      updateResults: [updatedReservation],
    });

    const result = await repository.cancelReservation("reservation-1", "user-1");

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: "reservation-1",
      status: "CANCELLED",
    });
  });
});
