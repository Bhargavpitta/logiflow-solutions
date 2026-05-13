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
    origin(origin, callback) {
      if (!origin || config.frontendUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
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
  email: z.string().trim().min(1).max(255),
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

const hostSchema = z.object({
  host_name: z.string().trim().min(1).max(160),
  contact_number: z.string().trim().max(20).nullable().optional(),
  alt_number: z.string().trim().max(20).nullable().optional(),
  location: z.string().trim().nullable().optional(),
});

const driverSchema = z.object({
  driver_name: z.string().trim().min(1).max(120),
  contact_number: z.string().trim().max(20).nullable().optional(),
  alt_number: z.string().trim().max(20).nullable().optional(),
  license_id: z.string().trim().max(50).nullable().optional(),
  location: z.string().trim().nullable().optional(),
  driver_type: z.enum(["agency_driver", "driver_owner"]),
  agency_id: z.string().uuid().nullable().optional(),
});

const vehicleSchema = z.object({
  owner_name: z.string().trim().min(1).max(120),
  owner_number: z.string().trim().max(20).nullable().optional(),
  vehicle_name: z.string().trim().max(80).optional(),
  vehicle_number: z.string().trim().min(1).max(40),
  vehicle_model: z.string().trim().max(80).optional(),
  vehicle_type: z.string().trim().max(80).nullable().optional(),
  model_year: z.string().trim().max(10).nullable().optional(),
  location: z.string().trim().nullable().optional(),
  ownership: z.enum(["own", "rent", "agency"]),
  agency_id: z.string().uuid().nullable().optional(),
  agency: z
    .object({
      agency_name: z.string().trim().min(1).max(120),
      organizer_name: z.string().trim().max(120).nullable().optional(),
      organizer_number: z.string().trim().max(20).nullable().optional(),
      alt_number: z.string().trim().max(20).nullable().optional(),
    })
    .optional(),
});

const agencySchema = z.object({
  agency_name: z.string().trim().min(1).max(120),
  organizer_name: z.string().trim().max(120).nullable().optional(),
  organizer_number: z.string().trim().max(20).nullable().optional(),
  alt_number: z.string().trim().max(20).nullable().optional(),
  location: z.string().trim().nullable().optional(),
});

const emcSchema = z.object({
  company_name: z.string().trim().min(1).max(160),
  organizer_name: z.string().trim().max(120).nullable().optional(),
  mobile: z.string().trim().max(20).nullable().optional(),
  alt_mobile: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional().or(z.literal("")),
  location: z.string().trim().nullable().optional(),
  status: z.enum(["active", "pending", "inactive"]).optional(),
});

const eventVehicleSchema = z.object({
  vehicle_id: z.string().uuid(),
  day_date: z.string().min(1),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  driver_id: z.string().uuid().nullable().optional(),
  starting_meter: z.number().nullable().optional(),
  ending_meter: z.number().nullable().optional(),
  rate_card: z.string().trim().nullable().optional(),
  reporting_time: z.string().nullable().optional(),
});

const eventSchema = z.object({
  name: z.string().trim().min(1).max(160),
  from_date: z.string().min(1),
  to_date: z.string().min(1),
  organizer_name: z.string().trim().max(120).nullable().optional(),
  organizer_number: z.string().trim().max(20).nullable().optional(),
  host_id: z.string().uuid().nullable().optional(),
  event_company_id: z.string().uuid().nullable().optional(),
  location: z.string().trim().nullable().optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  vehicles: z.array(eventVehicleSchema).optional(),
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

function toRole(email, currentRole) {
  return isAdminEmail(email) ? "admin" : currentRole || "user";
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
  const role = toRole(email, "user");
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
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Unable to verify Google account.");
  const profile = await response.json();
  if (!profile.email || !profile.email_verified) throw new Error("Google account email is not verified.");
  return profile;
}

async function authMiddleware(req, res, next) {
  const token = req.cookies[config.sessionCookieName];
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    const session = verifySession(token);
    const user = await getUserWithRoleById(session.sub);
    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Session is no longer valid." });
    }
    req.user = user;
    next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ error: "Invalid session." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ========================= AUTH ========================= */

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const passwordHash = await hashPassword(parsed.password);
    const user = await withTransaction(async (client) => {
      const existing = await client.query("SELECT id FROM app_users WHERE email = $1", [email]);
      if (existing.rows[0]) return null;
      const userId = makeId();
      await client.query(
        `INSERT INTO app_users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
        [userId, email, passwordHash, parsed.name.trim()],
      );
      const role = await ensureUserRole(client, userId, email);
      return { id: userId, email, name: parsed.name.trim(), avatar_url: null, role };
    });
    if (!user) return res.status(409).json({ error: "An account with this email already exists." });
    setSessionCookie(res, signSession(user));
    res.status(201).json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const result = await query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.password_hash,
              CASE WHEN COALESCE(BOOL_OR(r.role = 'admin'), FALSE) THEN 'admin' ELSE 'user' END AS role
       FROM app_users u LEFT JOIN user_roles r ON r.user_id = u.id
       WHERE u.email = $1 GROUP BY u.id`,
      [email],
    );
    const row = result.rows[0];
    if (!row?.password_hash) return res.status(401).json({ error: "Invalid email or password." });
    const ok = await verifyPassword(parsed.password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password." });
    const role = toRole(email, row.role);
    if (role !== row.role) {
      await withTransaction(async (client) => {
        await ensureUserRole(client, row.id, email);
      });
    }
    const user = toUser({ ...row, role });
    setSessionCookie(res, signSession(user));
    res.json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/google", async (req, res, next) => {
  try {
    const parsed = googleSchema.parse(req.body);
    const profile = await fetchGoogleProfile(parsed.accessToken);
    const email = normalizeEmail(profile.email);
    const user = await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT u.id, u.email, u.name, u.avatar_url, u.google_sub FROM app_users u
         WHERE u.google_sub = $1 OR u.email = $2 LIMIT 1`,
        [profile.sub, email],
      );
      let userId;
      if (existing.rows[0]) {
        userId = existing.rows[0].id;
        await client.query(
          `UPDATE app_users SET email=$2, google_sub=$3, name=$4, avatar_url=$5 WHERE id=$1`,
          [userId, email, profile.sub, profile.name || email.split("@")[0], profile.picture || null],
        );
      } else {
        userId = makeId();
        await client.query(
          `INSERT INTO app_users (id, email, google_sub, name, avatar_url) VALUES ($1,$2,$3,$4,$5)`,
          [userId, email, profile.sub, profile.name || email.split("@")[0], profile.picture || null],
        );
      }
      const role = await ensureUserRole(client, userId, email);
      return { id: userId, email, name: profile.name || email.split("@")[0], avatar_url: profile.picture || null, role };
    });
    setSessionCookie(res, signSession(user));
    res.json({ user });
  } catch (error) { next(error); }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => res.json({ user: req.user }));
app.post("/api/auth/logout", (_req, res) => { clearSessionCookie(res); res.json({ ok: true }); });

/* ========================= ENTRIES ========================= */

app.get("/api/entries", authMiddleware, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM logistics_entries
       WHERE ($1::text = 'admin' OR user_id = $2)
       ORDER BY logistics_date DESC, created_at DESC`,
      [req.user.role, req.user.id],
    );
    res.json({ entries: result.rows.map(normalizeEntryRow), isAdmin: req.user.role === "admin" });
  } catch (error) { next(error); }
});

app.get("/api/entries/:id", authMiddleware, async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM logistics_entries WHERE id = $1`, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "Entry not found." });
    if (req.user.role !== "admin" && row.user_id !== req.user.id)
      return res.status(403).json({ error: "You do not have access to this entry." });
    res.json({ entry: normalizeEntryRow(row) });
  } catch (error) { next(error); }
});

app.post("/api/entries", authMiddleware, async (req, res, next) => {
  try {
    const entry = entrySchema.parse(req.body);
    const result = await query(
      `INSERT INTO logistics_entries (
         id, user_id, driver_name, contact_number, vehicle_number, vehicle_model,
         vehicle_type_id, package_hours_id, ownership_id, logistics_date,
         starting_meter, closing_meter, starting_time, closing_time,
         total_km, total_hours, extra_km, extra_hours, total_amount
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [makeId(), req.user.id, entry.driver_name, entry.contact_number || null,
       entry.vehicle_number, entry.vehicle_model, entry.vehicle_type_id,
       entry.package_hours_id, entry.ownership_id, entry.logistics_date,
       entry.starting_meter, entry.closing_meter, entry.starting_time, entry.closing_time,
       entry.total_km, entry.total_hours, entry.extra_km, entry.extra_hours, entry.total_amount],
    );
    res.status(201).json({ entry: normalizeEntryRow(result.rows[0]) });
  } catch (error) { next(error); }
});

app.put("/api/entries/:id", authMiddleware, async (req, res, next) => {
  try {
    const entry = entrySchema.parse(req.body);
    const existing = await query("SELECT id, user_id FROM logistics_entries WHERE id = $1", [req.params.id]);
    const row = existing.rows[0];
    if (!row) return res.status(404).json({ error: "Entry not found." });
    if (req.user.role !== "admin" && row.user_id !== req.user.id)
      return res.status(403).json({ error: "You do not have access to edit this entry." });
    const result = await query(
      `UPDATE logistics_entries SET
         driver_name=$2, contact_number=$3, vehicle_number=$4, vehicle_model=$5,
         vehicle_type_id=$6, package_hours_id=$7, ownership_id=$8, logistics_date=$9,
         starting_meter=$10, closing_meter=$11, starting_time=$12, closing_time=$13,
         total_km=$14, total_hours=$15, extra_km=$16, extra_hours=$17, total_amount=$18
       WHERE id=$1 RETURNING *`,
      [req.params.id, entry.driver_name, entry.contact_number || null,
       entry.vehicle_number, entry.vehicle_model, entry.vehicle_type_id,
       entry.package_hours_id, entry.ownership_id, entry.logistics_date,
       entry.starting_meter, entry.closing_meter, entry.starting_time, entry.closing_time,
       entry.total_km, entry.total_hours, entry.extra_km, entry.extra_hours, entry.total_amount],
    );
    res.json({ entry: normalizeEntryRow(result.rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/entries/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM logistics_entries WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Entry not found." });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

/* ========================= HOSTS ========================= */

app.get("/api/hosts", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const r = await query(`SELECT * FROM public.hosts ORDER BY host_name`);
    res.json({ hosts: r.rows });
  } catch (e) { next(e); }
});

app.post("/api/hosts", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const h = hostSchema.parse(req.body);
    const r = await query(
      `INSERT INTO public.hosts (host_name, contact_number, alt_number, location)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [h.host_name, h.contact_number || null, h.alt_number || null, h.location || null],
    );
    res.status(201).json({ host: r.rows[0] });
  } catch (e) { next(e); }
});

app.put("/api/hosts/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const h = hostSchema.parse(req.body);
    const r = await query(
      `UPDATE public.hosts SET host_name=$2, contact_number=$3, alt_number=$4, location=$5
       WHERE id=$1 RETURNING *`,
      [req.params.id, h.host_name, h.contact_number || null, h.alt_number || null, h.location || null],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Host not found." });
    res.json({ host: r.rows[0] });
  } catch (e) { next(e); }
});

app.delete("/api/hosts/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM public.hosts WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ========================= DRIVERS ========================= */

app.get("/api/drivers", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT d.*, a.agency_name FROM public.drivers d
       LEFT JOIN public.agencies a ON a.id = d.agency_id
       ORDER BY d.driver_name`,
    );
    res.json({ drivers: r.rows });
  } catch (e) { next(e); }
});

app.post("/api/drivers", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const d = driverSchema.parse(req.body);
    const agencyId = d.driver_type === "agency_driver" ? (d.agency_id || null) : null;
    const r = await query(
      `INSERT INTO public.drivers (driver_name, contact_number, alt_number, license_id, location, driver_type, agency_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [d.driver_name, d.contact_number || null, d.alt_number || null, d.license_id || null,
       d.location || null, d.driver_type, agencyId],
    );
    res.status(201).json({ driver: r.rows[0] });
  } catch (e) { next(e); }
});

app.put("/api/drivers/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const d = driverSchema.parse(req.body);
    const agencyId = d.driver_type === "agency_driver" ? (d.agency_id || null) : null;
    const r = await query(
      `UPDATE public.drivers SET driver_name=$2, contact_number=$3, alt_number=$4,
       license_id=$5, location=$6, driver_type=$7, agency_id=$8
       WHERE id=$1 RETURNING *`,
      [req.params.id, d.driver_name, d.contact_number || null, d.alt_number || null,
       d.license_id || null, d.location || null, d.driver_type, agencyId],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Driver not found." });
    res.json({ driver: r.rows[0] });
  } catch (e) { next(e); }
});

app.delete("/api/drivers/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM public.drivers WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ========================= AGENCIES ========================= */

app.get("/api/agencies", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const r = await query(`SELECT * FROM public.agencies ORDER BY agency_name`);
    res.json({ agencies: r.rows });
  } catch (e) { next(e); }
});

app.post("/api/agencies", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const a = agencySchema.parse(req.body);
    const r = await query(
      `INSERT INTO public.agencies (agency_name, organizer_name, organizer_number, alt_number, location)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [a.agency_name, a.organizer_name || null, a.organizer_number || null, a.alt_number || null, a.location || null],
    );
    res.status(201).json({ agency: r.rows[0] });
  } catch (e) { next(e); }
});

app.put("/api/agencies/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const a = agencySchema.parse(req.body);
    const r = await query(
      `UPDATE public.agencies SET agency_name=$2, organizer_name=$3, organizer_number=$4,
       alt_number=$5, location=$6 WHERE id=$1 RETURNING *`,
      [req.params.id, a.agency_name, a.organizer_name || null, a.organizer_number || null,
       a.alt_number || null, a.location || null],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Agency not found." });
    res.json({ agency: r.rows[0] });
  } catch (e) { next(e); }
});

app.delete("/api/agencies/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM public.agencies WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ========================= VEHICLES ========================= */

app.get("/api/vehicles", authMiddleware, async (req, res, next) => {
  try {
    const r = await query(
      `SELECT v.*, a.agency_name FROM public.vehicles v
       LEFT JOIN public.agencies a ON a.id = v.agency_id
       ORDER BY v.created_at DESC`,
    );
    res.json({ vehicles: r.rows });
  } catch (e) { next(e); }
});

app.post("/api/vehicles", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const v = vehicleSchema.parse(req.body);
    const result = await withTransaction(async (client) => {
      let agencyId = v.agency_id || null;
      if (v.ownership === "agency" && v.agency && !agencyId) {
        const ar = await client.query(
          `INSERT INTO public.agencies (agency_name, organizer_name, organizer_number, alt_number)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [v.agency.agency_name, v.agency.organizer_name || null, v.agency.organizer_number || null, v.agency.alt_number || null],
        );
        agencyId = ar.rows[0].id;
      }
      const ins = await client.query(
        `INSERT INTO public.vehicles
         (owner_name, owner_number, vehicle_name, vehicle_number, vehicle_model, vehicle_type, model_year, location, ownership, agency_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [v.owner_name, v.owner_number || null, v.vehicle_name || v.vehicle_model || "Vehicle",
         v.vehicle_number, v.vehicle_model || "Innova Crysta",
         v.vehicle_type || null, v.model_year || null, v.location || null,
         v.ownership, agencyId],
      );
      return ins.rows[0];
    });
    res.status(201).json({ vehicle: result });
  } catch (e) { next(e); }
});

app.put("/api/vehicles/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const v = vehicleSchema.parse(req.body);
    const r = await query(
      `UPDATE public.vehicles SET owner_name=$2, owner_number=$3, vehicle_name=$4, vehicle_number=$5,
       vehicle_model=$6, vehicle_type=$7, model_year=$8, location=$9, ownership=$10, agency_id=$11
       WHERE id=$1 RETURNING *`,
      [req.params.id, v.owner_name, v.owner_number || null,
       v.vehicle_name || v.vehicle_model || "Vehicle", v.vehicle_number,
       v.vehicle_model || "Innova Crysta", v.vehicle_type || null,
       v.model_year || null, v.location || null, v.ownership, v.agency_id || null],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Vehicle not found." });
    res.json({ vehicle: r.rows[0] });
  } catch (e) { next(e); }
});

app.delete("/api/vehicles/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await query("DELETE FROM public.vehicles WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ========================= EMC ========================= */

app.get("/api/emc", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const r = await query(`SELECT * FROM public.event_management_companies ORDER BY created_at DESC`);
    res.json({ companies: r.rows });
  } catch (e) { next(e); }
});

app.post("/api/emc", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const c = emcSchema.parse(req.body);
    const r = await query(
      `INSERT INTO public.event_management_companies (company_name, organizer_name, mobile, alt_mobile, email, location, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [c.company_name, c.organizer_name || null, c.mobile || null, c.alt_mobile || null,
       c.email || null, c.location || null, c.status || "active"],
    );
    res.status(201).json({ company: r.rows[0] });
  } catch (e) { next(e); }
});

app.put("/api/emc/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const c = emcSchema.parse(req.body);
    const r = await query(
      `UPDATE public.event_management_companies
       SET company_name=$2, organizer_name=$3, mobile=$4, alt_mobile=$5, email=$6, location=$7, status=$8
       WHERE id=$1 RETURNING *`,
      [req.params.id, c.company_name, c.organizer_name || null, c.mobile || null,
       c.alt_mobile || null, c.email || null, c.location || null, c.status || "active"],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Company not found." });
    res.json({ company: r.rows[0] });
  } catch (e) { next(e); }
});

app.delete("/api/emc/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM public.event_management_companies WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ========================= EVENTS ========================= */

app.get("/api/events", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const ev = await query(`
      SELECT e.*,
             h.host_name,
             ec.company_name AS event_company_name
      FROM public.events e
      LEFT JOIN public.hosts h ON h.id = e.host_id
      LEFT JOIN public.event_management_companies ec ON ec.id = e.event_company_id
      ORDER BY e.from_date DESC
    `);
    const evs = await query(`
      SELECT ev.*,
             v.vehicle_number, v.vehicle_model, v.owner_name, v.ownership, v.vehicle_type,
             d.driver_name, d.driver_type
      FROM public.event_vehicles ev
      JOIN public.vehicles v ON v.id = ev.vehicle_id
      LEFT JOIN public.drivers d ON d.id = ev.driver_id
    `);
    const byEvent = {};
    for (const r of evs.rows) {
      (byEvent[r.event_id] ||= []).push(r);
    }
    res.json({ events: ev.rows.map((e) => ({ ...e, vehicles: byEvent[e.id] || [] })) });
  } catch (e) { next(e); }
});

app.post("/api/events", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const e = eventSchema.parse(req.body);
    const result = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO public.events
         (name, from_date, to_date, organizer_name, organizer_number, host_id, event_company_id, location, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [e.name, e.from_date, e.to_date, e.organizer_name || null, e.organizer_number || null,
         e.host_id || null, e.event_company_id || null, e.location || null,
         e.status || "pending", req.user.id],
      );
      const eventRow = ins.rows[0];
      if (e.vehicles?.length) {
        for (const ev of e.vehicles) {
          await client.query(
            `INSERT INTO public.event_vehicles
             (event_id, vehicle_id, day_date, start_time, end_time, driver_id, starting_meter, ending_meter, rate_card, reporting_time)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [eventRow.id, ev.vehicle_id, ev.day_date, ev.start_time || null, ev.end_time || null,
             ev.driver_id || null, ev.starting_meter ?? null, ev.ending_meter ?? null,
             ev.rate_card || null, ev.reporting_time || null],
          );
        }
      }
      return eventRow;
    });
    res.status(201).json({ event: result });
  } catch (e) { next(e); }
});

app.put("/api/events/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const e = eventSchema.parse(req.body);
    const result = await withTransaction(async (client) => {
      const ev = await client.query(
        `UPDATE public.events SET name=$2, from_date=$3, to_date=$4, organizer_name=$5,
         organizer_number=$6, host_id=$7, event_company_id=$8, location=$9, status=$10
         WHERE id=$1 RETURNING *`,
        [req.params.id, e.name, e.from_date, e.to_date, e.organizer_name || null,
         e.organizer_number || null, e.host_id || null, e.event_company_id || null,
         e.location || null, e.status || "pending"],
      );
      if (!ev.rows[0]) return null;
      if (e.vehicles) {
        await client.query(`DELETE FROM public.event_vehicles WHERE event_id=$1`, [req.params.id]);
        for (const v of e.vehicles) {
          await client.query(
            `INSERT INTO public.event_vehicles
             (event_id, vehicle_id, day_date, start_time, end_time, driver_id, starting_meter, ending_meter, rate_card, reporting_time)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [req.params.id, v.vehicle_id, v.day_date, v.start_time || null, v.end_time || null,
             v.driver_id || null, v.starting_meter ?? null, v.ending_meter ?? null,
             v.rate_card || null, v.reporting_time || null],
          );
        }
      }
      return ev.rows[0];
    });
    if (!result) return res.status(404).json({ error: "Event not found." });
    res.json({ event: result });
  } catch (e) { next(e); }
});

app.put("/api/event-vehicles/:id/meter", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { ending_meter } = req.body;
    const r = await query(
      `UPDATE public.event_vehicles SET ending_meter=$2 WHERE id=$1 RETURNING *`,
      [req.params.id, ending_meter ?? null],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Booking not found." });
    res.json({ booking: r.rows[0] });
  } catch (e) { next(e); }
});

app.put("/api/event-vehicles/:id/time", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { start_time, end_time } = req.body;
    const r = await query(
      `UPDATE public.event_vehicles SET start_time=$2, end_time=$3 WHERE id=$1 RETURNING *`,
      [req.params.id, start_time || null, end_time || null],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Booking not found." });
    res.json({ booking: r.rows[0] });
  } catch (e) { next(e); }
});

app.delete("/api/events/:id", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM public.events WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ========================= ANALYTICS ========================= */

app.get("/api/analytics", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const [evStats, vehicleCount, driverCount, hostCount, agencyCount, emcCount] = await Promise.all([
      query(`SELECT status, COUNT(*)::int AS count FROM public.events GROUP BY status`),
      query(`SELECT COUNT(*)::int AS count FROM public.vehicles`),
      query(`SELECT COUNT(*)::int AS count FROM public.drivers`),
      query(`SELECT COUNT(*)::int AS count FROM public.hosts`),
      query(`SELECT COUNT(*)::int AS count FROM public.agencies`),
      query(`SELECT COUNT(*)::int AS count FROM public.event_management_companies`),
    ]);
    const eventStats = {};
    for (const row of evStats.rows) eventStats[row.status] = row.count;
    res.json({
      events: {
        total: Object.values(eventStats).reduce((a, b) => Number(a) + Number(b), 0),
        completed: eventStats.completed || 0,
        pending: eventStats.pending || 0,
        active: eventStats.active || 0,
        cancelled: eventStats.cancelled || 0,
      },
      vehicles: vehicleCount.rows[0]?.count || 0,
      drivers: driverCount.rows[0]?.count || 0,
      hosts: hostCount.rows[0]?.count || 0,
      agencies: agencyCount.rows[0]?.count || 0,
      eventCompanies: emcCount.rows[0]?.count || 0,
    });
  } catch (e) { next(e); }
});

/* ========================= TRIP LOGS ========================= */

app.get("/api/driver-trip-logs", authMiddleware, requireAdmin, async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM public.driver_trip_logs ORDER BY log_date DESC, source_row ASC`,
    );
    res.json({
      tripLogs: result.rows.map((row) => ({
        ...row,
        package_amount: Number(row.package_amount),
        extra_hour_rate: Number(row.extra_hour_rate),
        extra_time_rate: Number(row.extra_time_rate),
      })),
    });
  } catch (e) { next(e); }
});

/* ========================= ERROR HANDLER ========================= */

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
    console.log(`Event Logistics India API listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
