
import cors, { type CorsOptions } from "cors";

const allowedOrigins = (
  process.env.FRONTEND_URL ?? "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header, such as
    // local scripts and server-to-server requests.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked origin: ${origin}`),
    );
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};