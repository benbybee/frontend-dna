import { pgEnum, pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const scrapeJobs = pgTable("scrape_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  status: jobStatusEnum("status").notNull().default("pending"),
  browserbaseSessionId: text("browserbase_session_id"),
  rawTokens: jsonb("raw_tokens"),
  error: text("error"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
