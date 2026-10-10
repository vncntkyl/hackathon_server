import { Router } from "express";
import { createRepairConversation } from "../controllers/repair.controller.js";

const router = Router();

router.post("/chat", createRepairConversation);

export default router;
