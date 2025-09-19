// src/config/db.js
import mysql from "mysql2/promise";
import { env } from "./env.js";

// Ensure env values are loaded
if (!env.db.user || !env.db.password || !env.db.host || !env.db.database) {
  throw new Error("❌ Missing required DB environment variables");
}

// Create pool
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,         // return dates as strings
  namedPlaceholders: true,   // allow :param style placeholders
});

// Optional: test connection once on startup
export async function assertDbConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    console.log("✅ DB connected:", {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      database: env.db.database,
    });
    conn.release();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}
