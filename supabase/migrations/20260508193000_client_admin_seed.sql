CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_row, log_date, vehicle_number)
);

ALTER TABLE public.driver_trip_logs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS driver_trip_logs_touch ON public.driver_trip_logs;
CREATE TRIGGER driver_trip_logs_touch
BEFORE UPDATE ON public.driver_trip_logs
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "Authenticated read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins read agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins manage agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins read events" ON public.events;
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
DROP POLICY IF EXISTS "Admins read ev" ON public.event_vehicles;
DROP POLICY IF EXISTS "Admins manage ev" ON public.event_vehicles;
DROP POLICY IF EXISTS "Admins read emc" ON public.event_management_companies;
DROP POLICY IF EXISTS "Admins manage emc" ON public.event_management_companies;

CREATE POLICY "Client manage vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Client manage agencies" ON public.agencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Client manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Client manage event vehicles" ON public.event_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Client manage emc" ON public.event_management_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Client manage trip logs" ON public.driver_trip_logs FOR ALL USING (true) WITH CHECK (true);
