import { Router } from "express";
import { analyzeRepairController } from "../controllers/repair.controller.js";

const router = Router();

router.post("/analyze", analyzeRepairController);

export default router;
