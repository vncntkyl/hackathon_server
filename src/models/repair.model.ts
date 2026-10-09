import { z } from "zod";
import { UserLocationSchema } from "./location.model.js";

export const RepairAnalysisSchema = z.object({
  trade: z.enum([
    "plumber",
    "electrician",
    "carpenter",
    "aircon_technician",
    "appliance_technician",
    "other",
  ]),
  problem: z.string(),
  symptoms: z.array(z.string()),
  urgency: z.enum(["low", "medium", "high"]),
  followUpQuestions: z.array(z.string()).max(3),
  safetyWarning: z.string().nullable(),
});

export type RepairAnalysis = z.infer<typeof RepairAnalysisSchema>;

export const AnalyzeRepairRequestSchema = z.object({
  description: z.string().trim().min(1).max(4000),
  location: UserLocationSchema,
  conversationId: z.string(),
});

export type AnalyzeRepairRequest = z.infer<typeof AnalyzeRepairRequestSchema>;
