import {
	integer,
	pgEnum,
	pgTable,
	real,
	text,
	uuid,
	varchar,
	time,
	date,
	timestamp,
	primaryKey
} from "drizzle-orm/pg-core";
import {
	InferInsertModel,
	InferSelectModel,
	defineRelations,
	sql,
} from "drizzle-orm";

import { user } from "@/db/schemas/auth";

export const cuisineTypeEnum = pgEnum("cuisine_type", [
	"ASIAN",
	"PIZZA",
	"AMERICAN",
	"MEXICAN",
]);

export const restaurant = pgTable("restaurants", {
	id: uuid("id").primaryKey().default(sql`pg_catalog.gen_random_uuid()`),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description").notNull(),
	address: varchar("address", { length: 255 }).notNull(),
	neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
	image: varchar("image", { length: 500 }).notNull(),
	cuisineType: cuisineTypeEnum("cuisine_type").notNull(),
	rating: real("rating").default(0).notNull(),
	latitude: real("latitude").notNull(),
	longitude: real("longitude").notNull(),
	capacity: integer("capacity").notNull(),
});

export const reservationSetting = pgTable("reservation_settings", {
  id: uuid("id").primaryKey().default(sql`pg_catalog.gen_random_uuid()`),

  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),

  slotIntervalMinutes: integer("slot_interval_minutes").notNull(),

  defaultSlotCapacity: integer("default_slots_capacity").notNull(),
});

export const serviceWindow = pgTable("service_windows", {
  id: uuid("id").primaryKey().default(sql`pg_catalog.gen_random_uuid()`),

  reservationSettingId: uuid("reservation_setting_id")
    .notNull()
    .references(() => reservationSetting.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 10 }).notNull(),

  start: time("start").notNull(),

  end: time("end").notNull(),
});

export const reservationStatus = pgEnum("reservation_status", ["CONFIRMED", "CANCELLED"]);

export const reservation = pgTable("reservations", {
  id: uuid("id").primaryKey().default(sql`pg_catalog.gen_random_uuid()`),

  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  reservationDate: date("reservation_date").notNull(),

  reservationTime: time("reservation_time").notNull(),

  partySize: integer("party_size").notNull(),

  status: reservationStatus("status").notNull(),

  createdAt: timestamp("created_at").notNull(),
});

export const daysOfWeekEnum = pgEnum("days_of_week", [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
]);

export const operatingHour = pgTable("operating_hours", {
	id: uuid("id").primaryKey().default(sql`pg_catalog.gen_random_uuid()`),

	restaurantId: uuid("restaurant_id")
		.notNull()
		.references(() => restaurant.id, { onDelete: "cascade" }),

	dayOfWeek: daysOfWeekEnum("day_of_week").notNull(),

	openTime: time("open_time").notNull(),

	closeTime: time("close_time").notNull(),
});

export const favourite = pgTable("favourites", {
	userId: uuid("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	restaurantId: uuid("restaurant_id")
		.notNull()
		.references(() => restaurant.id, { onDelete: "cascade" }),
}, (table) => [
	primaryKey({ columns: [table.userId, table.restaurantId] }),
]);

export const comment = pgTable("comments", {
  id: uuid("id").primaryKey().default(sql`pg_catalog.gen_random_uuid()`),

  restaurantId: uuid("restaurant_id")
	.notNull()
	.references(() => restaurant.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
	.notNull()
	.references(() => user.id, { onDelete: "cascade" }),

  rating: integer("rating").notNull(),

  body: text("body").notNull(),

  createdAt: timestamp("created_at").notNull(),
});

export const restaurantRelations = defineRelations(
  {
    restaurant,
    reservationSetting,
    operatingHour,
    comment,
    reservation,
    favourite,
	serviceWindow,
  },
  (r) => ({
    restaurant: {
      reservationSetting: r.one.reservationSetting({
        from: r.restaurant.id,
        to: r.reservationSetting.restaurantId,
      }),
      operatingHours: r.many.operatingHour({
        from: r.restaurant.id,
        to: r.operatingHour.restaurantId,
      }),
      comments: r.many.comment({
        from: r.restaurant.id,
        to: r.comment.restaurantId,
      }),
      reservations: r.many.reservation({
        from: r.restaurant.id,
        to: r.reservation.restaurantId,
      }),
      favourites: r.many.favourite({
        from: r.restaurant.id,
        to: r.favourite.restaurantId,
      }),
    },
	reservationSetting: {
	  restaurant: r.one.restaurant({
		from: r.reservationSetting.restaurantId,
		to: r.restaurant.id,
	  }),
	  serviceWindows: r.many.serviceWindow({
		from: r.reservationSetting.id,
		to: r.serviceWindow.reservationSettingId,
	  }),
	},
	serviceWindow: {
	  reservationSetting: r.one.reservationSetting({
		from: r.serviceWindow.reservationSettingId,
		to: r.reservationSetting.id,
	  }),
	},
	operatingHour: {
	  restaurant: r.one.restaurant({
		from: r.operatingHour.restaurantId,
		to: r.restaurant.id,
	  }),
	},
	comment: {
	  restaurant: r.one.restaurant({
		from: r.comment.restaurantId,
		to: r.restaurant.id,
	  }),
	},
	reservation: {
	  restaurant: r.one.restaurant({
		from: r.reservation.restaurantId,
		to: r.restaurant.id,
	  }),
	},
	favourite: {
	  restaurant: r.many.restaurant({
		from: r.favourite.restaurantId,
		to: r.restaurant.id,
	  }),
	}
  }),
);

export type RestaurantSelect = InferSelectModel<typeof restaurant>;
export type RestaurantInsert = InferInsertModel<typeof restaurant>;
export type ReservationSettingSelect = InferSelectModel<typeof reservationSetting>;
export type ReservationSettingInsert = InferInsertModel<typeof reservationSetting>;
export type ServiceWindowSelect = InferSelectModel<typeof serviceWindow>;
export type ServiceWindowInsert = InferInsertModel<typeof serviceWindow>;
export type ReservationSelect = InferSelectModel<typeof reservation>;
export type ReservationInsert = InferInsertModel<typeof reservation>;
export type OperatingHourSelect = InferSelectModel<typeof operatingHour>;
export type OperatingHourInsert = InferInsertModel<typeof operatingHour>;
export type FavouriteSelect = InferSelectModel<typeof favourite>;
export type FavouriteInsert = InferInsertModel<typeof favourite>;
export type CommentSelect = InferSelectModel<typeof comment>;
export type CommentInsert = InferInsertModel<typeof comment>;
