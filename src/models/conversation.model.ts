import { z } from "zod";

export const ConversationStatusSchema = z.enum([
  "collecting",
  "ready",
  "completed",
]);

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

export const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
});

export const RepairConversationSchema = z.object({
  id: z.string(),
  status: ConversationStatusSchema,
  messages: z.array(ConversationMessageSchema),
  assessment: RepairAnalysisSchema.nullable(),
});

export const userRequestSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string(),
});

export type UserRequestSchema = z.infer<typeof userRequestSchema>;
export type RepairConversation = z.infer<typeof RepairConversationSchema>;

export const AnalyzeRepairRequestSchema = z.object({
  description: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
  user: userRequestSchema,
});

export type AnalyzeRepairRequest = z.infer<typeof AnalyzeRepairRequestSchema>;
