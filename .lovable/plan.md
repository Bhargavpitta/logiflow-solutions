# LogiManage Admin Dashboard

Build a full enterprise logistics admin experience matching the attached LogiManage screenshots (light theme, blue Signal palette, Inter font). Admins are routed here on login; existing user dashboard for entry remains unchanged.

## Scope

### 1. Design system
- Add LogiManage tokens (Signal Blue `#2563eb`, surface `#faf8ff`, container `#ededf9`, etc.) to `src/index.css` and `tailwind.config.ts` as semantic HSL tokens.
- Force light theme on the new admin layout (no toggle inside admin shell).
- Reusable `AdminLayout` with left sidebar (LogiManage logo, "+ New Event" CTA, nav: Dashboard / Events / EMC / Logistics, Help + Logout footer) and top bar (search, support, notifications, settings, profile).
- Fully responsive: sidebar collapses into a Sheet drawer under `md`.

### 2. Routes (admin only, gated by `useAuth().isAdmin`)
- `/admin` → Analytics Overview (KPI tiles, monthly bar chart via recharts, driver-availability donut).
- `/admin/events` → events table + slide-over **Edit/Create Event** panel (name, from/to dates, vehicles-needed list per day with colored badges + add/remove, organizer, organizer number).
- `/admin/emc` → Event Management Companies table + side detail card + **Add Company** modal (company name, organizer name, mobile, alt mobile, email).
- `/admin/logistics` → dropdown switching three views: Driver/Owner, Driver, Agency Vehicles. Each is a table with edit + **Add** button opening a form. Ownership select on Driver/Owner form; choosing **Agency** reveals agency fields and the record also appears in Agency Vehicles.
- After admin selects a vehicle inside an event, clicking that vehicle opens a small dialog to set start/end time which then displays as extra columns in the event-vehicles table.

### 3. Database (new tables, RLS: admin full, user read-where-relevant)

```text
events(id, name, from_date, to_date, organizer_name, organizer_number, status, created_by, created_at, updated_at)
event_vehicles(id, event_id, vehicle_id, day_date, start_time, end_time)
event_management_companies(id, company_name, organizer_name, mobile, alt_mobile, email, status, created_at)
vehicles(id, owner_kind enum['driver_owner','driver','agency'],
         owner_name, owner_number,
         vehicle_name, vehicle_number, vehicle_model,
         ownership enum['own','rent','agency'],
         agency_id nullable, status, created_at, updated_at)
agencies(id, agency_name, organizer_name, organizer_number, alt_number, created_at)
```

- Triggers for `updated_at`.
- RLS: `has_role(auth.uid(),'admin')` on all writes/reads; authenticated users can `select` vehicles list (needed by entry form).

### 4. Master data seed
Parse `user-uploads://drivers_master_data.xlsx`, infer `ownership` (own → driver_owner, rent → driver, agency → agency) heuristically from columns; insert into `vehicles` (+ `agencies` rows where applicable). Done via a one-shot migration `INSERT`.

### 5. Routing & auth
- After login: admin → `/admin`, user → existing `/dashboard`.
- `AdminRoute` wrapper: redirect non-admins.

### 6. Out of scope (kept as-is)
- Marketing landing, user entry form/dashboard, invoice template, hero, public auth pages.

## Technical notes
- All Supabase reads/writes via the existing `@/integrations/supabase/client` (the `server/` Express layer is bypassed for the new admin module to keep things simple and consistent with RLS).
- Forms: `react-hook-form` + `zod`.
- Tables: shadcn `Table` + `DropdownMenu` actions.
- Chart: `recharts` (already installed).
- Badges: red = agency, amber = driver/owner, blue = driver.

## File plan
- new: `src/layouts/AdminLayout.tsx`, `src/components/admin/{Sidebar,Topbar,KpiCard,VehicleBadge}.tsx`
- new: `src/pages/admin/{Dashboard,Events,EMC,Logistics}.tsx` + form components
- new: `src/lib/admin-api.ts` (typed Supabase queries)
- edit: `src/App.tsx` (routes), `src/pages/Auth.tsx` (post-login redirect), `src/index.css`, `tailwind.config.ts`
- migration: create 5 tables + RLS + seed from xlsx

## Confirmation needed
This is a large build (≈ 15+ new files, 5 tables, data seed). Approving will execute the migration first, then code.