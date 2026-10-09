import { Router } from "express";
import {
  createRepairConversation,
  startConversation,
} from "../controllers/repair.controller.js";

const router = Router();

router.post("/start", startConversation);

router.post("/chat", createRepairConversation);

export default router;
