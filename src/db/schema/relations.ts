import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { scrapeJobs } from "./scrape-jobs";
import { extractedTokens } from "./extracted-tokens";
import { generatedPrompts } from "./generated-prompts";

export const projectsRelations = relations(projects, ({ many, one }) => ({
  scrapeJobs: many(scrapeJobs),
  extractedTokens: one(extractedTokens),
  generatedPrompts: many(generatedPrompts),
}));

export const scrapeJobsRelations = relations(scrapeJobs, ({ one }) => ({
  project: one(projects, {
    fields: [scrapeJobs.projectId],
    references: [projects.id],
  }),
}));

export const extractedTokensRelations = relations(extractedTokens, ({ one }) => ({
  project: one(projects, {
    fields: [extractedTokens.projectId],
    references: [projects.id],
  }),
}));

export const generatedPromptsRelations = relations(generatedPrompts, ({ one }) => ({
  project: one(projects, {
    fields: [generatedPrompts.projectId],
    references: [projects.id],
  }),
  tokens: one(extractedTokens, {
    fields: [generatedPrompts.tokensId],
    references: [extractedTokens.id],
  }),
}));
