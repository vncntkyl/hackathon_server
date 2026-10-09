import express from "express";
import { corsOptions } from "./config/cors.js";
import cors from "cors";
import router from "./routes/repair.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "RepAIr Mate API is running.",
  });
});

app.use("/api/repairs", router);

app.use(errorMiddleware);

export default app;
