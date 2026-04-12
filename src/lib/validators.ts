import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  urls: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one URL is required")
    .max(10, "Maximum 10 URLs per project"),
});

export const internalScrapeSchema = z.object({
  jobId: z.string().uuid(),
  url: z.string().url(),
  projectId: z.string().uuid(),
});

export const extractWebhookSchema = z.object({
  urls: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one URL is required")
    .max(10, "Maximum 10 URLs"),
  callbackUrl: z.string().url("Must be a valid callback URL"),
  callbackSecret: z.string().min(1, "Callback secret is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type InternalScrapeInput = z.infer<typeof internalScrapeSchema>;
export type ExtractWebhookInput = z.infer<typeof extractWebhookSchema>;
