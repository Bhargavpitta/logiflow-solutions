import { apiFetch } from "./api";

export type Ownership = "own" | "rent" | "agency";
export type DriverType = "agency_driver" | "driver_owner";

export interface Host {
  id: string;
  host_name: string;
  contact_number: string | null;
  alt_number: string | null;
  location: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  driver_name: string;
  contact_number: string | null;
  alt_number: string | null;
  license_id: string | null;
  location: string | null;
  driver_type: DriverType;
  agency_id: string | null;
  agency_name: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_name: string;
  owner_number: string | null;
  vehicle_name: string;
  vehicle_number: string;
  vehicle_model: string;
  vehicle_type: string | null;
  model_year: string | null;
  location: string | null;
  ownership: Ownership;
  agency_id: string | null;
  agency_name: string | null;
  status: string;
}

export interface Agency {
  id: string;
  agency_name: string;
  organizer_name: string | null;
  organizer_number: string | null;
  alt_number: string | null;
  location: string | null;
  created_at: string;
}

export interface EMC {
  id: string;
  company_name: string;
  organizer_name: string | null;
  mobile: string | null;
  alt_mobile: string | null;
  email: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

export interface EventVehicleBooking {
  id: string;
  event_id: string;
  vehicle_id: string;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_number: string;
  vehicle_model: string;
  vehicle_type: string | null;
  owner_name: string;
  ownership: Ownership;
  driver_id: string | null;
  driver_name: string | null;
  driver_type: DriverType | null;
  starting_meter: number | null;
  ending_meter: number | null;
  rate_card: string | null;
  reporting_time: string | null;
}

export interface EventRow {
  id: string;
  name: string;
  from_date: string;
  to_date: string;
  organizer_name: string | null;
  organizer_number: string | null;
  host_id: string | null;
  host_name: string | null;
  event_company_id: string | null;
  event_company_name: string | null;
  location: string | null;
  status: string;
  vehicles: EventVehicleBooking[];
}

export interface DriverTripLog {
  id: string;
  source_row: number;
  driver_name: string;
  contact_number: string | null;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_model: string;
  log_date: string;
  starting_meter: number;
  closing_meter: number;
  starting_time: string | null;
  closing_time: string | null;
  package_type: string;
  package_amount: number;
  extra_hour_rate: number;
  extra_time_rate: number;
  ownership_raw: string | null;
  inferred_ownership: Ownership;
}

export interface Analytics {
  events: {
    total: number;
    completed: number;
    pending: number;
    active: number;
    cancelled: number;
  };
  vehicles: number;
  drivers: number;
  hosts: number;
  agencies: number;
  eventCompanies: number;
}

export const adminApi = {
  hosts: {
    list: () => apiFetch<{ hosts: Host[] }>("/hosts").then((r) => r.hosts),
    create: (body: any) =>
      apiFetch<{ host: Host }>("/hosts", { method: "POST", body: JSON.stringify(body) }).then((r) => r.host),
    update: (id: string, body: any) =>
      apiFetch<{ host: Host }>(`/hosts/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.host),
    remove: (id: string) => apiFetch<{ ok: true }>(`/hosts/${id}`, { method: "DELETE" }),
  },
  drivers: {
    list: () => apiFetch<{ drivers: Driver[] }>("/drivers").then((r) => r.drivers),
    create: (body: any) =>
      apiFetch<{ driver: Driver }>("/drivers", { method: "POST", body: JSON.stringify(body) }).then((r) => r.driver),
    update: (id: string, body: any) =>
      apiFetch<{ driver: Driver }>(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.driver),
    remove: (id: string) => apiFetch<{ ok: true }>(`/drivers/${id}`, { method: "DELETE" }),
  },
  vehicles: {
    list: () => apiFetch<{ vehicles: Vehicle[] }>("/vehicles").then((r) => r.vehicles),
    create: (body: any) =>
      apiFetch<{ vehicle: Vehicle }>("/vehicles", { method: "POST", body: JSON.stringify(body) }).then((r) => r.vehicle),
    update: (id: string, body: any) =>
      apiFetch<{ vehicle: Vehicle }>(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.vehicle),
    remove: (id: string) => apiFetch<{ ok: true }>(`/vehicles/${id}`, { method: "DELETE" }),
  },
  agencies: {
    list: () => apiFetch<{ agencies: Agency[] }>("/agencies").then((r) => r.agencies),
    create: (body: any) =>
      apiFetch<{ agency: Agency }>("/agencies", { method: "POST", body: JSON.stringify(body) }).then((r) => r.agency),
    update: (id: string, body: any) =>
      apiFetch<{ agency: Agency }>(`/agencies/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.agency),
    remove: (id: string) => apiFetch<{ ok: true }>(`/agencies/${id}`, { method: "DELETE" }),
  },
  emc: {
    list: () => apiFetch<{ companies: EMC[] }>("/emc").then((r) => r.companies),
    create: (body: any) =>
      apiFetch<{ company: EMC }>("/emc", { method: "POST", body: JSON.stringify(body) }).then((r) => r.company),
    update: (id: string, body: any) =>
      apiFetch<{ company: EMC }>(`/emc/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.company),
    remove: (id: string) => apiFetch<{ ok: true }>(`/emc/${id}`, { method: "DELETE" }),
  },
  events: {
    list: () => apiFetch<{ events: EventRow[] }>("/events").then((r) => r.events),
    create: (body: any) =>
      apiFetch<{ event: EventRow }>("/events", { method: "POST", body: JSON.stringify(body) }).then((r) => r.event),
    update: (id: string, body: any) =>
      apiFetch<{ event: EventRow }>(`/events/${id}`, { method: "PUT", body: JSON.stringify(body) }).then((r) => r.event),
    remove: (id: string) => apiFetch<{ ok: true }>(`/events/${id}`, { method: "DELETE" }),
    setBookingTime: (bookingId: string, start_time: string | null, end_time: string | null) =>
      apiFetch<{ booking: EventVehicleBooking }>(`/event-vehicles/${bookingId}/time`, {
        method: "PUT",
        body: JSON.stringify({ start_time, end_time }),
      }),
    setEndingMeter: (bookingId: string, ending_meter: number | null) =>
      apiFetch<{ booking: EventVehicleBooking }>(`/event-vehicles/${bookingId}/meter`, {
        method: "PUT",
        body: JSON.stringify({ ending_meter }),
      }),
  },
  tripLogs: {
    list: () => apiFetch<{ tripLogs: DriverTripLog[] }>("/driver-trip-logs").then((r) => r.tripLogs),
  },
  analytics: {
    get: () => apiFetch<Analytics>("/analytics"),
  },
};

export const vehicleLabel = (v: Vehicle): string => {
  if (v.ownership === "agency" && v.agency_name) return `Agency — ${v.agency_name}`;
  if (v.ownership === "agency") return "Agency Vehicle";
  return "Independent";
};

export const driverLabel = (d: Driver): string => {
  if (d.driver_type === "agency_driver" && d.agency_name) return `Agency Driver — ${d.agency_name}`;
  return "Driver/Owner";
};

export const ownershipBadge = (o: Ownership) => {
  if (o === "agency") return { label: "Agency Vehicle", cls: "bg-red-100 text-red-700 border-red-200" };
  if (o === "own") return { label: "Driver/Owner Vehicle", cls: "bg-amber-100 text-amber-800 border-amber-200" };
  return { label: "Driver Vehicle", cls: "bg-blue-100 text-blue-700 border-blue-200" };
};

export const LOCATIONS = ["Vijayawada", "Hyderabad"] as const;
export const RATE_CARDS = ["8hrs/80km", "12hrs/120km", "16hrs/160km", "24hrs/200km"] as const;
