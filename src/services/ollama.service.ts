import ollama from "ollama";
import {
  RepairAnalysisSchema,
  type RepairAnalysis,
} from "../models/repair.model.js";

const model = process.env.OLLAMA_MODEL ?? "gemma3:4b";

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
Ask up to three useful follow-up questions in natural Taglish.
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
      temperature: 0,
    },
  });

  const raw: unknown = JSON.parse(response.message.content);

  return RepairAnalysisSchema.parse(raw);
}
