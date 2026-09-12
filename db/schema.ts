import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const familyState = sqliteTable("family_state", {
  id: integer("id").primaryKey(),
  state: text("state").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});
