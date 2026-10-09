import type { Request, Response, NextFunction } from "express";
import { AnalyzeRepairRequestSchema } from "../models/repair.model.js";
import { analyzeRepair } from "../services/ollama.service.js";

export async function analyzeRepairController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const validation = AnalyzeRepairRequestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid repair description.",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const result = await analyzeRepair(validation.data.description);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
