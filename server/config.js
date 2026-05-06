import dotenv from "dotenv";

dotenv.config();

const generatedSecret = "onehmt-logistics-jwt-2026-05-06-9f6db7d4c3a8e21b5c";

export const config = {
  port: Number(process.env.BACKEND_PORT || 3001),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:Sravani%40426@localhost:5432/EntryDetails",
  jwtSecret: process.env.JWT_SECRET || generatedSecret,
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || "",
  sessionCookieName: "onehmt_session",
};

