import ollama from "ollama";
import {
  RepairAnalysisSchema,
  type RepairAnalysis,
} from "../models/repair.model.js";
import {
  RepairConversationSchema,
  UserRequestSchema,
} from "../models/conversation.model.js";
import { RepairUserContext, trainMessage } from "../config/train.js";

const model =  "aisingapore/Gemma-SEA-LION-v4.5-E2B-IT";

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

const repairAnalysisFormat = {
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
};

export async function analyzeRepair(
  description: string,
): Promise<RepairAnalysis> {
  const response = await ollama.chat({
    model,
    stream: false,
    messages: [
      {
        role: "system",
        content: `
You are RepAIr Mate, a preliminary home repair intake assistant.
Understand Filipino, Taglish, and English.
Identify the likely repair trade.
Summarize reported symptoms without inventing facts.
Ask up to one useful follow-up questions in natural Taglish.
Do not invent prices, worker availability, or a confirmed diagnosis.
Flag potential safety hazards and recommend qualified help.
If uncertain, acknowledge the uncertainty. Make your responses in Taglish.
        `.trim(),
      },
      {
        role: "user",
        content: description,
      },
    ],
    format: repairAnalysisFormat,
    options: {
      temperature: 0.2,
      repeat_penalty: 1.15,
      num_predict: 512,
    },
  });

  const raw: unknown = JSON.parse(response.message.content);

  return RepairAnalysisSchema.parse(raw);
}

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
