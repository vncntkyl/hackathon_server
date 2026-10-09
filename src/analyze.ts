import ollama from "ollama";
import { z } from "zod";

const RepairAnalysisSchema = z.object({
  trade: z.enum(["plumber", "electrician", "carpenter", "technician", "other"]),
  problem: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  followUpQuestions: z.array(z.string()).max(3),
  safetyWarning: z.string().nullable(),
});

async function analyzeRepair(description: string) {
  const response = await ollama.chat({
    model: "gemma3:4b",
    stream: false,
    messages: [
      {
        role: "system",
        content: `
You are RepAIr Mate, a preliminary home repair intake assistant.
Understand English, Filipino, and Taglish.
Classify the likely trade and ask up to 3 useful follow-up questions.
Do not claim a confirmed diagnosis.
Treat electrical hazards as safety-critical.
Return only information that fits the requested schema.
Make your responses in taglish.
        `.trim(),
      },
      {
        role: "user",
        content: description,
      },
    ],
    format: {
      type: "object",
      properties: {
        trade: {
          type: "string",
          enum: ["plumber", "electrician", "carpenter", "technician", "other"],
        },
        problem: { type: "string" },
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
        "urgency",
        "followUpQuestions",
        "safetyWarning",
      ],
    },
    options: {
      temperature: 0,
    },
  });

  const parsed = JSON.parse(response.message.content);
  return RepairAnalysisSchema.parse(parsed);
}

console.dir(new Date().getTime());
analyzeRepair("May spark yung saksakan nung tinry ko magsaksak ng fan.")
  .then((result) => console.dir(result, { depth: null }))
  .catch((error) => {
    console.error("Repair analysis failed:", error);
  })
  .finally(() => console.dir(new Date().getTime()));
