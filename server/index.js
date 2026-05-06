import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { config } from "./config.js";
import { pool, query, withTransaction } from "./db.js";
import {
  clearSessionCookie,
  hashPassword,
  isAdminEmail,
  makeId,
  normalizeEmail,
  setSessionCookie,
  signSession,
  verifyPassword,
  verifySession,
} from "./auth.js";
import { ensureSchema } from "./schema.js";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const googleSchema = z.object({
  accessToken: z.string().min(1),
});

const entrySchema = z.object({
  driver_name: z.string().trim().min(1).max(100),
  contact_number: z.string().trim().max(20).nullable().optional(),
  vehicle_number: z.string().trim().min(1).max(20),
  vehicle_model: z.string().trim().min(1).max(50),
  vehicle_type_id: z.number().int().min(1),
  package_hours_id: z.number().int().min(1).max(4),
  ownership_id: z.number().int().min(1).max(3),
  logistics_date: z.string().min(1),
  starting_meter: z.number().int().min(0),
  closing_meter: z.number().int().min(0),
  starting_time: z.string().min(1),
  closing_time: z.string().min(1),
  total_km: z.number().min(0),
  total_hours: z.number().min(0),
  extra_km: z.number().min(0),
  extra_hours: z.number().min(0),
  total_amount: z.number().min(0),
});

function toUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar_url: row.avatar_url,
    role: row.role || "user",
  };
}

async function getUserWithRoleById(id) {
  const result = await query(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        u.avatar_url,
        CASE
          WHEN COALESCE(BOOL_OR(r.role = 'admin'), FALSE) THEN 'admin'
          ELSE 'user'
        END AS role
      FROM app_users u
      LEFT JOIN user_roles r ON r.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `,
    [id],
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

async function ensureUserRole(client, userId, email) {
  const role = isAdminEmail(email) ? "admin" : "user";
  await client.query(
    `
      INSERT INTO user_roles (id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role) DO NOTHING
    `,
    [makeId(), userId, role],
  );
  return role;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to verify Google account.");
  }

  const profile = await response.json();
  if (!profile.email || !profile.email_verified) {
    throw new Error("Google account email is not verified.");
  }

  return profile;
}

async function authMiddleware(req, res, next) {
  const token = req.cookies[config.sessionCookieName];
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const session = verifySession(token);
    const user = await getUserWithRoleById(session.sub);
    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Session is no longer valid." });
    }
    req.user = user;
    next();
  } catch (error) {
    clearSessionCookie(res);
    return res.status(401).json({ error: "Invalid session." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const passwordHash = await hashPassword(parsed.password);

    const user = await withTransaction(async (client) => {
      const existing = await client.query(
        "SELECT id FROM app_users WHERE email = $1",
        [email],
      );
      if (existing.rows[0]) {
        return null;
      }

      const userId = makeId();
      await client.query(
        `
          INSERT INTO app_users (id, email, password_hash, name)
          VALUES ($1, $2, $3, $4)
        `,
        [userId, email, passwordHash, parsed.name.trim()],
      );

      const role = await ensureUserRole(client, userId, email);
      return {
        id: userId,
        email,
        name: parsed.name.trim(),
        avatar_url: null,
        role,
      };
    });

    if (!user) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    setSessionCookie(res, signSession(user));
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const result = await query(
      `
        SELECT
          u.id,
          u.email,
          u.name,
          u.avatar_url,
          u.password_hash,
          CASE
            WHEN COALESCE(BOOL_OR(r.role = 'admin'), FALSE) THEN 'admin'
            ELSE 'user'
          END AS role
        FROM app_users u
        LEFT JOIN user_roles r ON r.user_id = u.id
        WHERE u.email = $1
        GROUP BY u.id
      `,
      [email],
    );

    const row = result.rows[0];
    if (!row?.password_hash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await verifyPassword(parsed.password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    await withTransaction(async (client) => {
      await ensureUserRole(client, row.id, email);
    });
    const user = await getUserWithRoleById(row.id);
    setSessionCookie(res, signSession(user));
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/google", async (req, res, next) => {
  try {
    const parsed = googleSchema.parse(req.body);
    const profile = await fetchGoogleProfile(parsed.accessToken);
    const email = normalizeEmail(profile.email);

    const user = await withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT
            u.id,
            u.email,
            u.name,
            u.avatar_url,
            u.google_sub
          FROM app_users u
          WHERE u.google_sub = $1 OR u.email = $2
          LIMIT 1
        `,
        [profile.sub, email],
      );

      let userId;
      if (existing.rows[0]) {
        userId = existing.rows[0].id;
        await client.query(
          `
            UPDATE app_users
            SET
              email = $2,
              google_sub = $3,
              name = $4,
              avatar_url = $5
            WHERE id = $1
          `,
          [userId, email, profile.sub, profile.name || email.split("@")[0], profile.picture || null],
        );
      } else {
        userId = makeId();
        await client.query(
          `
            INSERT INTO app_users (id, email, google_sub, name, avatar_url)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [userId, email, profile.sub, profile.name || email.split("@")[0], profile.picture || null],
        );
      }

      const role = await ensureUserRole(client, userId, email);
      return {
        id: userId,
        email,
        name: profile.name || email.split("@")[0],
        avatar_url: profile.picture || null,
        role,
      };
    });

    setSessionCookie(res, signSession(user));
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/entries", authMiddleware, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const result = await query(
      `
        SELECT *
        FROM logistics_entries
        WHERE ($1::text = 'admin' OR user_id = $2)
        ORDER BY logistics_date DESC, created_at DESC
      `,
      [req.user.role, req.user.id],
    );

    res.json({ entries: result.rows.map(normalizeEntryRow), isAdmin });
  } catch (error) {
    next(error);
  }
});

app.get("/api/entries/:id", authMiddleware, async (req, res, next) => {
  try {
    const result = await query(
      `
        SELECT *
        FROM logistics_entries
        WHERE id = $1
      `,
      [req.params.id],
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Entry not found." });
    }
    if (req.user.role !== "admin" && row.user_id !== req.user.id) {
      return res.status(403).json({ error: "You do not have access to this entry." });
    }
    res.json({ entry: normalizeEntryRow(row) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/entries", authMiddleware, async (req, res, next) => {
  try {
    const entry = entrySchema.parse(req.body);
    const result = await query(
      `
        INSERT INTO logistics_entries (
          id, user_id, driver_name, contact_number, vehicle_number, vehicle_model,
          vehicle_type_id, package_hours_id, ownership_id, logistics_date,
          starting_meter, closing_meter, starting_time, closing_time,
          total_km, total_hours, extra_km, extra_hours, total_amount
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18, $19
        )
        RETURNING *
      `,
      [
        makeId(),
        req.user.id,
        entry.driver_name,
        entry.contact_number || null,
        entry.vehicle_number,
        entry.vehicle_model,
        entry.vehicle_type_id,
        entry.package_hours_id,
        entry.ownership_id,
        entry.logistics_date,
        entry.starting_meter,
        entry.closing_meter,
        entry.starting_time,
        entry.closing_time,
        entry.total_km,
        entry.total_hours,
        entry.extra_km,
        entry.extra_hours,
        entry.total_amount,
      ],
    );
    res.status(201).json({ entry: normalizeEntryRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/entries/:id", authMiddleware, async (req, res, next) => {
  try {
    const entry = entrySchema.parse(req.body);
    const existing = await query(
      "SELECT id, user_id FROM logistics_entries WHERE id = $1",
      [req.params.id],
    );
    const row = existing.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Entry not found." });
    }
    if (req.user.role !== "admin" && row.user_id !== req.user.id) {
      return res.status(403).json({ error: "You do not have access to edit this entry." });
    }

    const result = await query(
      `
        UPDATE logistics_entries
        SET
          driver_name = $2,
          contact_number = $3,
          vehicle_number = $4,
          vehicle_model = $5,
          vehicle_type_id = $6,
          package_hours_id = $7,
          ownership_id = $8,
          logistics_date = $9,
          starting_meter = $10,
          closing_meter = $11,
          starting_time = $12,
          closing_time = $13,
          total_km = $14,
          total_hours = $15,
          extra_km = $16,
          extra_hours = $17,
          total_amount = $18
        WHERE id = $1
        RETURNING *
      `,
      [
        req.params.id,
        entry.driver_name,
        entry.contact_number || null,
        entry.vehicle_number,
        entry.vehicle_model,
        entry.vehicle_type_id,
        entry.package_hours_id,
        entry.ownership_id,
        entry.logistics_date,
        entry.starting_meter,
        entry.closing_meter,
        entry.starting_time,
        entry.closing_time,
        entry.total_km,
        entry.total_hours,
        entry.extra_km,
        entry.extra_hours,
        entry.total_amount,
      ],
    );
    res.json({ entry: normalizeEntryRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/entries/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM logistics_entries WHERE id = $1 RETURNING id",
      [req.params.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Entry not found." });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: error.issues[0]?.message || "Invalid request." });
  }

  console.error(error);
  return res.status(500).json({ error: error.message || "Server error." });
});

function normalizeEntryRow(row) {
  return {
    ...row,
    total_km: Number(row.total_km),
    total_hours: Number(row.total_hours),
    extra_km: Number(row.extra_km),
    extra_hours: Number(row.extra_hours),
    total_amount: Number(row.total_amount),
  };
}

async function start() {
  await ensureSchema();
  await pool.query("SELECT 1");
  app.listen(config.port, () => {
    console.log(`OneHmt API listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
