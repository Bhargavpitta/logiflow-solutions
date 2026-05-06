import { query } from "./db.js";

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
    CREATE OR REPLACE FUNCTION touch_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await query(`
    DROP TRIGGER IF EXISTS app_users_touch_updated_at ON app_users;
    CREATE TRIGGER app_users_touch_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();
  `);

  await query(`
    DROP TRIGGER IF EXISTS logistics_entries_touch_updated_at ON logistics_entries;
    CREATE TRIGGER logistics_entries_touch_updated_at
    BEFORE UPDATE ON logistics_entries
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();
  `);
}
