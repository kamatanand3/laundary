// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./routes/index.js";

import swaggerUi from "swagger-ui-express";
import { specs } from "./docs/openapi.js";

const app = express();

// Security & middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
app.get("/api-docs.json", (_req, res) => res.json(specs));

// API routes
app.use("/api", router);

// Global error handler (keep last)
app.use(errorHandler);

export default app;
