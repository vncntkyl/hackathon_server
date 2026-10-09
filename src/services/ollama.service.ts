import ollama from "ollama";
import { type RepairAnalysis } from "../models/conversation.model.js";
import { UserRequestSchema } from "../models/conversation.model.js";
import { trainMessage } from "../config/train.js";

const model = "aisingapore/Gemma-SEA-LION-v4.5-E2B-IT";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
export type ConversationFormat = {
  reply: string;
  isReadyForReport: boolean;
  assessment: RepairAnalysis;
};
const conversationFormat = {
  type: "object",
  properties: {
    reply: { type: "string" },
    isReadyForReport: { type: "boolean" },
    assessment: {
      type: "object",
      properties: {
        trade: {
          type: "string",
          enum: [
            "plumber",
            "electrician",
            "carpenter",
            "aircon_technician",
            "appliance_technician",
            "other",
          ],
        },
        problem: { type: "string" },
        symptoms: {
          type: "array",
          items: { type: "string" },
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        followUpQuestions: {
          type: "array",
          items: { type: "string" },
        },
        safetyWarning: {
          type: ["string", "null"],
        },
      },
      required: [
        "trade",
        "problem",
        "symptoms",
        "urgency",
        "followUpQuestions",
        "safetyWarning",
      ],
    },
  },
  required: ["reply", "isReadyForReport", "assessment"],
};

export async function continueRepairConversation(
  history: ChatMessage[],
  newMessage: string,
  user: UserRequestSchema,
): Promise<ConversationFormat> {
  const response = await ollama.chat({
    model,
    stream: false,
    messages: [
      {
        role: "system",
        content: trainMessage({
          firstName: user.first_name,
          gender: user.gender,
        }),
        tool_name: "RepAIrMate",
      },
      ...history,
      { role: "user", content: newMessage },
    ],
    format: conversationFormat,
  });

  const raw: ConversationFormat = JSON.parse(response.message.content);

  return raw;
}
