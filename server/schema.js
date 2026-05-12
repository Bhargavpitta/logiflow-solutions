import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const driverMasterPath = path.resolve(__dirname, "../public/drivers_master_data.xlsx");

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseLogDate(value) {
  const match = normalizeText(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function inferOwnership(row) {
  const driverName = normalizeText(row["Driver Name"]);
  const contactNumber = normalizeText(row["Contact Number"]);
  const vehicleNumber = normalizeText(row["Vehicle Number"]);

  if (!driverName || !contactNumber) return "agency";
  if (/^[A-Z]{2,3}\d+/i.test(vehicleNumber)) return "own";
  if (/^\d{4,}$/.test(vehicleNumber)) return "rent";
  return "own";
}

async function ensureDriverMasterSeed() {
  if (!fs.existsSync(driverMasterPath)) return;

  const [{ rows: vehicleRows }, { rows: tripRows }] = await Promise.all([
    query("SELECT COUNT(*)::int AS count FROM public.vehicles"),
    query("SELECT COUNT(*)::int AS count FROM public.driver_trip_logs"),
  ]);

  if ((vehicleRows[0]?.count ?? 0) > 0 && (tripRows[0]?.count ?? 0) > 0) {
    return;
  }

  const workbook = XLSX.readFile(driverMasterPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const tripLogs = rawRows
    .map((row, index) => {
      const inferredOwnership = inferOwnership(row);
      return {
        source_row: index + 2,
        driver_name: normalizeText(row["Driver Name"]) || "Unknown Driver",
        contact_number: normalizeText(row["Contact Number"]) || null,
        vehicle_number: normalizeText(row["Vehicle Number"]),
        vehicle_type: normalizeText(row["Vehicle Type"]) || "SUV",
        vehicle_model: normalizeText(row["Vehicle Model"]) || "Innova Crysta",
        log_date: parseLogDate(row["Log Date"]),
        starting_meter: Number(row["Starting Metre"] || 0),
        closing_meter: Number(row["Closing Metre"] || 0),
        starting_time: normalizeText(row["Starting Time"]) || null,
        closing_time: normalizeText(row["Closing Time"]) || null,
        package_type: normalizeText(row["Package Type"]) || "8 hrs / 80 km",
        package_amount: row["Package Amount"] === "" ? 3500 : Number(row["Package Amount"]),
        extra_hour_rate: row["Extra Hrs Rate (per hr)"] === "" ? 200 : Number(row["Extra Hrs Rate (per hr)"]),
        extra_time_rate: row["Extra Time Rate (per hr)"] === "" ? 20 : Number(row["Extra Time Rate (per hr)"]),
        ownership_raw: normalizeText(row["Vehicle Ownership"]) || null,
        inferred_ownership: inferredOwnership,
      };
    })
    .filter((row) => row.vehicle_number && row.log_date);

  let importedAgencyId = null;

  if ((vehicleRows[0]?.count ?? 0) === 0) {
    const agencyResult = await query(
      `
        INSERT INTO public.agencies (agency_name, organizer_name)
        VALUES ('Imported Agency Fleet', 'Default Excel Import')
        ON CONFLICT (agency_name) DO UPDATE SET agency_name = EXCLUDED.agency_name
        RETURNING id
      `,
    );
    importedAgencyId = agencyResult.rows[0]?.id ?? null;

    const vehiclesByNumber = new Map();
    for (const trip of tripLogs) {
      if (!vehiclesByNumber.has(trip.vehicle_number.toUpperCase())) {
        vehiclesByNumber.set(trip.vehicle_number.toUpperCase(), trip);
      }
    }

    for (const trip of vehiclesByNumber.values()) {
      await query(
        `
          INSERT INTO public.vehicles (
            owner_name, owner_number, vehicle_name, vehicle_number, vehicle_model, ownership, agency_id, status
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,'available')
          ON CONFLICT (vehicle_number) DO NOTHING
        `,
        [
          trip.driver_name,
          trip.contact_number,
          trip.vehicle_model,
          trip.vehicle_number,
          trip.vehicle_model,
          trip.inferred_ownership,
          trip.inferred_ownership === "agency" ? importedAgencyId : null,
        ],
      );
    }
  }

  if ((tripRows[0]?.count ?? 0) === 0) {
    for (const trip of tripLogs) {
      await query(
        `
          INSERT INTO public.driver_trip_logs (
            source_row, driver_name, contact_number, vehicle_number, vehicle_type, vehicle_model, log_date,
            starting_meter, closing_meter, starting_time, closing_time, package_type, package_amount,
            extra_hour_rate, extra_time_rate, ownership_raw, inferred_ownership
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          ON CONFLICT (source_row, log_date, vehicle_number) DO NOTHING
        `,
        [
          trip.source_row,
          trip.driver_name,
          trip.contact_number,
          trip.vehicle_number,
          trip.vehicle_type,
          trip.vehicle_model,
          trip.log_date,
          trip.starting_meter,
          trip.closing_meter,
          trip.starting_time,
          trip.closing_time,
          trip.package_type,
          trip.package_amount,
          trip.extra_hour_rate,
          trip.extra_time_rate,
          trip.ownership_raw,
          trip.inferred_ownership,
        ],
      );
    }
  }
}

export async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_sub TEXT UNIQUE,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, role)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS logistics_entries (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      driver_name TEXT NOT NULL,
      contact_number TEXT,
      vehicle_number TEXT NOT NULL,
      vehicle_model TEXT NOT NULL DEFAULT 'Innova Crysta',
      vehicle_type_id INTEGER NOT NULL DEFAULT 1,
      package_hours_id INTEGER NOT NULL,
      ownership_id INTEGER NOT NULL,
      logistics_date DATE NOT NULL,
      starting_meter INTEGER NOT NULL,
      closing_meter INTEGER NOT NULL,
      starting_time TIME NOT NULL,
      closing_time TIME NOT NULL,
      total_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
      extra_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
      extra_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.agencies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_name TEXT NOT NULL,
      organizer_name TEXT,
      organizer_number TEXT,
      alt_number TEXT,
      location TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.hosts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      host_name TEXT NOT NULL,
      contact_number TEXT,
      alt_number TEXT,
      location TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_name TEXT NOT NULL,
      owner_number TEXT,
      vehicle_name TEXT NOT NULL DEFAULT 'Innova Crysta',
      vehicle_number TEXT NOT NULL,
      vehicle_model TEXT NOT NULL DEFAULT 'Innova Crysta',
      vehicle_type TEXT,
      model_year TEXT,
      location TEXT,
      ownership TEXT NOT NULL CHECK (ownership IN ('own', 'rent', 'agency')),
      agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.event_management_companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name TEXT NOT NULL,
      organizer_name TEXT,
      mobile TEXT,
      alt_mobile TEXT,
      email TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.drivers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      driver_name TEXT NOT NULL,
      contact_number TEXT,
      alt_number TEXT,
      license_id TEXT,
      location TEXT,
      driver_type TEXT NOT NULL DEFAULT 'driver_owner' CHECK (driver_type IN ('agency_driver', 'driver_owner')),
      agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      organizer_name TEXT,
      organizer_number TEXT,
      host_id UUID REFERENCES public.hosts(id) ON DELETE SET NULL,
      event_company_id UUID REFERENCES public.event_management_companies(id) ON DELETE SET NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.event_vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
      day_date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
      starting_meter NUMERIC,
      ending_meter NUMERIC,
      rate_card TEXT,
      reporting_time TIME,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.driver_trip_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_row INTEGER NOT NULL,
      driver_name TEXT NOT NULL,
      contact_number TEXT,
      vehicle_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL DEFAULT 'SUV',
      vehicle_model TEXT NOT NULL DEFAULT 'Innova Crysta',
      log_date DATE NOT NULL,
      starting_meter INTEGER NOT NULL DEFAULT 0,
      closing_meter INTEGER NOT NULL DEFAULT 0,
      starting_time TIME,
      closing_time TIME,
      package_type TEXT NOT NULL DEFAULT '8 hrs / 80 km',
      package_amount NUMERIC(12, 2) NOT NULL DEFAULT 3500,
      extra_hour_rate NUMERIC(12, 2) NOT NULL DEFAULT 200,
      extra_time_rate NUMERIC(12, 2) NOT NULL DEFAULT 20,
      ownership_raw TEXT,
      inferred_ownership TEXT NOT NULL CHECK (inferred_ownership IN ('own', 'rent', 'agency')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Migrate existing tables to add new columns (idempotent)
  await query(`ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS location TEXT`);
  await query(`ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT`);
  await query(`ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS model_year TEXT`);
  await query(`ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS location TEXT`);
  await query(`ALTER TABLE public.event_management_companies ADD COLUMN IF NOT EXISTS location TEXT`);
  await query(`ALTER TABLE public.events ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.hosts(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_company_id UUID REFERENCES public.event_management_companies(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location TEXT`);
  await query(`ALTER TABLE public.event_vehicles ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE public.event_vehicles ADD COLUMN IF NOT EXISTS starting_meter NUMERIC`);
  await query(`ALTER TABLE public.event_vehicles ADD COLUMN IF NOT EXISTS ending_meter NUMERIC`);
  await query(`ALTER TABLE public.event_vehicles ADD COLUMN IF NOT EXISTS rate_card TEXT`);
  await query(`ALTER TABLE public.event_vehicles ADD COLUMN IF NOT EXISTS reporting_time TIME`);

  await query(`CREATE UNIQUE INDEX IF NOT EXISTS agencies_agency_name_key ON public.agencies (agency_name);`);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vehicle_number_key ON public.vehicles (vehicle_number);`);
  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS driver_trip_logs_source_vehicle_date_key ON public.driver_trip_logs (source_row, log_date, vehicle_number);`,
  );

  await query(`
    CREATE OR REPLACE FUNCTION touch_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  for (const [tbl, trigger] of [
    ["app_users", "app_users_touch_updated_at"],
    ["logistics_entries", "logistics_entries_touch_updated_at"],
    ["public.agencies", "agencies_touch_updated_at"],
    ["public.hosts", "hosts_touch_updated_at"],
    ["public.vehicles", "vehicles_touch_updated_at"],
    ["public.drivers", "drivers_touch_updated_at"],
    ["public.events", "events_touch_updated_at"],
    ["public.event_management_companies", "emc_touch_updated_at"],
    ["public.driver_trip_logs", "driver_trip_logs_touch_updated_at"],
  ]) {
    await query(`
      DROP TRIGGER IF EXISTS ${trigger} ON ${tbl};
      CREATE TRIGGER ${trigger}
      BEFORE UPDATE ON ${tbl}
      FOR EACH ROW
      EXECUTE FUNCTION touch_updated_at();
    `);
  }

  await ensureDriverMasterSeed();
  await ensureAdminUser();
}

async function ensureAdminUser() {
  const { rows } = await query("SELECT id FROM app_users WHERE email = 'admin'");
  if (rows.length > 0) return;

  const passwordHash = await bcrypt.hash("admin@123", 12);
  const adminId = crypto.randomUUID();
  await query(
    "INSERT INTO app_users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)",
    [adminId, "admin", passwordHash, "Admin"],
  );
  await query(
    "INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT (user_id, role) DO NOTHING",
    [crypto.randomUUID(), adminId],
  );
}
