import { pgSchema, index, integer, serial, smallint, uniqueIndex } from "drizzle-orm/pg-core";

const av = pgSchema("availability");

export const openingHours = av.table(
  "opening_hours",
  {
    id: serial("id").primaryKey(),
    spaceId: integer("space_id").notNull(),
    dayOfWeek: smallint("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (table) => [
    index("availability_opening_hours_space_idx").on(table.spaceId),
    uniqueIndex("availability_opening_hours_day_idx").on(table.spaceId, table.dayOfWeek),
  ]
);