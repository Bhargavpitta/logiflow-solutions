import dotenv from "dotenv";

dotenv.config();

const generatedSecret = "onehmt-logistics-jwt-2026-05-06-9f6db7d4c3a8e21b5c";
const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

export const config = {
  port: Number(process.env.PORT || process.env.BACKEND_PORT || 3001),
  frontendUrl: frontendUrls[0] || "http://localhost:8080",
  frontendUrls,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:Sravani%40426@localhost:5432/EntryDetails",
  jwtSecret: process.env.JWT_SECRET || generatedSecret,
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || "",
  isProduction,
  sessionCookieSameSite: isProduction ? "none" : "lax",
  sessionCookieSecure: isProduction,
  sessionCookieName: "onehmt_session",
};
