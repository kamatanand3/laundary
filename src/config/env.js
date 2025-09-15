import dotenv from "dotenv";
dotenv.config();

function num(val, fallback) {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function bool(val, fallback = false) {
  if (val === undefined) return fallback;
  return ["true", "1", "yes"].includes(val.toString().toLowerCase());
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

export const env = {
  node: process.env.NODE_ENV || "development",
  port: num(process.env.PORT, 4000),

  db: {
    host: requireEnv("DB_HOST"),
    port: num(process.env.DB_PORT, 3306),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
  },

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES || "15m",
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "30d",
  },

  mail: {
    host: requireEnv("SMTP_HOST"),
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS"),
    },
    from: requireEnv("EMAIL_FROM"),
  },

  otp: {
    digits: num(process.env.OTP_DIGITS, 6),
    ttlMinutes: num(process.env.OTP_TTL_MINUTES, 5),
    reqPerHour: num(process.env.OTP_REQUESTS_PER_HOUR, 5),
  },
};
