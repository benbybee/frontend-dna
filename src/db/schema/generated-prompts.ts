import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { extractedTokens } from "./extracted-tokens";

export const generatedPrompts = pgTable("generated_prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  tokensId: uuid("tokens_id")
    .notNull()
    .references(() => extractedTokens.id),
  markdown: text("markdown").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
