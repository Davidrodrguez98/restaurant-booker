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
	primaryKey,
	index,
} from "drizzle-orm/pg-core";
import {
	InferInsertModel,
	InferSelectModel,
	relations,
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
	id: uuid("id")
		.primaryKey()
		.default(sql`pg_catalog.gen_random_uuid()`),
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
	id: uuid("id")
		.primaryKey()
		.default(sql`pg_catalog.gen_random_uuid()`),

	restaurantId: uuid("restaurant_id")
		.references(() => restaurant.id, { onDelete: "cascade" }),

	slotIntervalMinutes: integer("slot_interval_minutes").notNull(),

	defaultSlotCapacity: integer("default_slots_capacity").notNull(),
});

export const serviceWindow = pgTable("service_windows", {
	id: uuid("id")
		.primaryKey()
		.default(sql`pg_catalog.gen_random_uuid()`),

	reservationSettingId: uuid("reservation_setting_id")
		.notNull()
		.references(() => reservationSetting.id, { onDelete: "cascade" }),

	name: varchar("name", { length: 10 }).notNull(),

	start: time("start").notNull(),

	end: time("end").notNull(),
});

export const reservationStatus = pgEnum("reservation_status", [
	"CONFIRMED",
	"CANCELLED",
]);

export const reservation = pgTable(
	"reservations",
	{
		id: uuid("id")
			.primaryKey()
			.default(sql`pg_catalog.gen_random_uuid()`),

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
	},
	(table) => [
		index("reservations_slot_status_idx").on(
			table.restaurantId,
			table.reservationDate,
			table.reservationTime,
			table.status,
		),
		index("reservations_slot_idx").on(
			table.restaurantId,
			table.reservationDate,
			table.reservationTime,
		),
	],
);

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
	id: uuid("id")
		.primaryKey()
		.default(sql`pg_catalog.gen_random_uuid()`),

	restaurantId: uuid("restaurant_id")
		.notNull()
		.references(() => restaurant.id, { onDelete: "cascade" }),

	dayOfWeek: daysOfWeekEnum("day_of_week").notNull(),

	openTime: time("open_time").notNull(),

	closeTime: time("close_time").notNull(),
});

export const favourite = pgTable(
	"favourites",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		restaurantId: uuid("restaurant_id")
			.notNull()
			.references(() => restaurant.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.userId, table.restaurantId] })],
);

export const comment = pgTable("comments", {
	id: uuid("id")
		.primaryKey()
		.default(sql`pg_catalog.gen_random_uuid()`),

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

export const restaurantRelations = relations(restaurant, ({ one, many }) => ({
	reservationSetting: one(reservationSetting),
	operatingHours: many(operatingHour),
	comments: many(comment),
	reservations: many(reservation),
	favourites: many(favourite),
}));

export const reservationSettingRelations = relations(
	reservationSetting,
	({ one, many }) => ({
		restaurant: one(restaurant, {
			fields: [reservationSetting.restaurantId],
			references: [restaurant.id],
		}),
		serviceWindows: many(serviceWindow),
	}),
);

export const serviceWindowRelations = relations(serviceWindow, ({ one }) => ({
	reservationSetting: one(reservationSetting, {
		fields: [serviceWindow.reservationSettingId],
		references: [reservationSetting.id],
	}),
}));

export const operatingHourRelations = relations(operatingHour, ({ one }) => ({
	restaurant: one(restaurant, {
		fields: [operatingHour.restaurantId],
		references: [restaurant.id],
	}),
}));

export const commentRelations = relations(comment, ({ one }) => ({
	restaurant: one(restaurant, {
		fields: [comment.restaurantId],
		references: [restaurant.id],
	}),
	user: one(user, {
		fields: [comment.userId],
		references: [user.id],
	}),
}));

export const reservationRelations = relations(reservation, ({ one }) => ({
	restaurant: one(restaurant, {
		fields: [reservation.restaurantId],
		references: [restaurant.id],
	}),
	user: one(user, {
		fields: [reservation.userId],
		references: [user.id],
	}),
}));

export const favouriteRelations = relations(favourite, ({ one }) => ({
	restaurant: one(restaurant, {
		fields: [favourite.restaurantId],
		references: [restaurant.id],
	}),
	user: one(user, {
		fields: [favourite.userId],
		references: [user.id],
	}),
}));

export type RestaurantSelect = InferSelectModel<typeof restaurant>;
export type RestaurantInsert = InferInsertModel<typeof restaurant>;
export type ReservationSettingSelect = InferSelectModel<
	typeof reservationSetting
>;
export type ReservationSettingInsert = InferInsertModel<
	typeof reservationSetting
>;
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
