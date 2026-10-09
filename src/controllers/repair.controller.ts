import type { Request, Response, NextFunction } from "express";
import { AnalyzeRepairRequestSchema } from "../models/repair.model.js";
import {
  analyzeRepair,
  ChatMessage,
  continueRepairConversation,
} from "../services/ollama.service.js";

import { randomUUID } from "node:crypto";
import {
  UserRequestSchema,
  userRequestSchema,
} from "../models/conversation.model.js";
import z from "zod";

export type ConversationData = {
  user: UserRequestSchema;
  history: ChatMessage[];
};
const conversationsMap = new Map<string, ConversationData>();

export async function createRepairConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const validation = AnalyzeRepairRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid repair description.",
      errors: z.treeifyError(validation.error),
    });
    return;
  }

  try {
    const conversation = conversationsMap.get(validation.data.conversationId);
    if (!conversation) {
      res.status(400).json({
        success: false,
        message: "Please start a new conversation.",
        errors: ["Conversation records not found."],
      });
      return;
    }
    const result = await continueRepairConversation(
      conversation.history,
      validation.data.description,
      conversation.user,
    );

    conversation.history.push({
      role: "user",
      content: validation.data.description,
    });
    conversation.history.push({
      role: "assistant",
      content: result.reply,
    });
    conversationsMap.set(validation.data.conversationId, conversation);

    console.log(conversation.history);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function startConversation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const validation = userRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Information is incomplete.",
      errors: z.treeifyError(validation.error),
    });
    return;
  }

  const conversationId = randomUUID();

  // const user = `
  // Use these data to address the user.

  // [Requestor: ${validation.data.first_name} ${validation.data.last_name}
  // Gender: ${validation.data.gender}
  // Mobile Number: ${validation.data.mobile_number}]
  // `.trim();
  conversationsMap.set(conversationId, {
    user: validation.data,
    history: [],
  });

  res.status(200).json({ success: true, data: conversationId });
}
