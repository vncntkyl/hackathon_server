import { z } from "zod";
import { RepairAnalysisSchema } from "./repair.model.js";

export const ConversationStatusSchema = z.enum([
  "collecting",
  "ready",
  "completed",
]);

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
  mobile_number: z.string(),
});

export type UserRequestSchema = z.infer<typeof userRequestSchema>;
export type RepairConversation = z.infer<typeof RepairConversationSchema>;


