import { apiFetch } from "./api";

export type Ownership = "own" | "rent" | "agency";

export interface Vehicle {
  id: string;
  owner_name: string;
  owner_number: string | null;
  vehicle_name: string;
  vehicle_number: string;
  vehicle_model: string;
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
}

export interface EMC {
  id: string;
  company_name: string;
  organizer_name: string | null;
  mobile: string | null;
  alt_mobile: string | null;
  email: string | null;
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
  owner_name: string;
  ownership: Ownership;
}

export interface EventRow {
  id: string;
  name: string;
  from_date: string;
  to_date: string;
  organizer_name: string | null;
  organizer_number: string | null;
  status: string;
  vehicles: EventVehicleBooking[];
}

export const adminApi = {
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
  },
};

export const ownershipBadge = (o: Ownership) => {
  if (o === "agency") return { label: "Agency Vehicle", cls: "bg-red-100 text-red-700 border-red-200" };
  if (o === "own") return { label: "Driver/Owner Vehicle", cls: "bg-amber-100 text-amber-800 border-amber-200" };
  return { label: "Driver Vehicle", cls: "bg-blue-100 text-blue-700 border-blue-200" };
};
