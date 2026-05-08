
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL,
  organizer_name TEXT,
  organizer_number TEXT,
  alt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name TEXT NOT NULL,
  owner_number TEXT,
  vehicle_name TEXT NOT NULL DEFAULT 'Innova Crysta',
  vehicle_number TEXT NOT NULL,
  vehicle_model TEXT NOT NULL DEFAULT 'Innova Crysta',
  ownership TEXT NOT NULL CHECK (ownership IN ('own','rent','agency')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  organizer_name TEXT,
  organizer_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_management_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  organizer_name TEXT,
  mobile TEXT,
  alt_mobile TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_management_companies ENABLE ROW LEVEL SECURITY;

-- Vehicles: signed-in users can read, only admins write
CREATE POLICY "Authenticated read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Agencies: admin only
CREATE POLICY "Admins read agencies" ON public.agencies FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage agencies" ON public.agencies FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Events: admin only
CREATE POLICY "Admins read events" ON public.events FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins read ev" ON public.event_vehicles FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage ev" ON public.event_vehicles FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- EMC: admin only
CREATE POLICY "Admins read emc" ON public.event_management_companies FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage emc" ON public.event_management_companies FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- updated_at triggers
CREATE TRIGGER agencies_touch BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER vehicles_touch BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER emc_touch BEFORE UPDATE ON public.event_management_companies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
