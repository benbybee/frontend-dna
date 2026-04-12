import { pgTable, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const extractedTokens = pgTable("extracted_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  typography: jsonb("typography").notNull(),
  colors: jsonb("colors").notNull(),
  spacing: jsonb("spacing").notNull(),
  shadows: jsonb("shadows").notNull(),
  borders: jsonb("borders").notNull(),
  breakpoints: jsonb("breakpoints").notNull(),
  motion: jsonb("motion").notNull(),
  assets: jsonb("assets").notNull(),
  components: jsonb("components"),
  rawCssVariables: jsonb("raw_css_variables").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
