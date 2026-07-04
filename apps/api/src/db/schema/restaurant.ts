import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
  }
);

export type Restaurant = InferSelectModel<typeof restaurants>;
export type NewRestaurant = InferInsertModel<typeof restaurants>;