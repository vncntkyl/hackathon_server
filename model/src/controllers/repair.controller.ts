import type { Request, Response, NextFunction } from "express";
import {
  ChatMessage,
  continueRepairConversation,
} from "../services/ollama.service.js";

import { randomUUID } from "node:crypto";
import {
  AnalyzeRepairRequestSchema,
  UserRequestSchema,
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
      message: "Please provide valid conversation details.",
      errors: z.treeifyError(validation.error),
    });
    return;
  }

  try {
    const { conversationId, description, user } = validation.data;

    const id = conversationId ?? randomUUID();
    const conversation = conversationId
      ? conversationsMap.get(conversationId)
      : { user, history: [] as ChatMessage[] };

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found. Please start a new chat.",
      });
      return;
    }

    const result = await continueRepairConversation(
      conversation.history,
      description,
      conversation.user,
    );

    conversation.history.push(
      { role: "user", content: description },
      { role: "assistant", content: result.reply },
    );

    conversationsMap.set(id, conversation);

    res.status(200).json({
      success: true,
      conversationId: id,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// export async function startConversation(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   const validation = userRequestSchema.safeParse(req.body);

//   if (!validation.success) {
//     res.status(400).json({
//       success: false,
//       message: "Information is incomplete.",
//       errors: z.treeifyError(validation.error),
//     });
//     return;
//   }

//   const conversationId = randomUUID();

//   // const user = `
//   // Use these data to address the user.

//   // [Requestor: ${validation.data.first_name} ${validation.data.last_name}
//   // Gender: ${validation.data.gender}
//   // Mobile Number: ${validation.data.mobile_number}]
//   // `.trim();
//   conversationsMap.set(conversationId, {
//     user: validation.data,
//     history: [],
//   });

//   res.status(200).json({ success: true, data: conversationId });
// }
