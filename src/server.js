import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://127.0.0.1:${PORT}`));
