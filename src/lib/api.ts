export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(/\/$/, "");

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: "admin" | "user";
}

export interface Entry {
  id: string;
  user_id: string;
  driver_name: string;
  contact_number: string | null;
  vehicle_number: string;
  vehicle_model: string;
  vehicle_type_id: number;
  package_hours_id: number;
  ownership_id: number;
  logistics_date: string;
  starting_meter: number;
  closing_meter: number;
  starting_time: string;
  closing_time: string;
  total_km: number;
  total_hours: number;
  extra_km: number;
  extra_hours: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface EntryPayload {
  driver_name: string;
  contact_number: string | null;
  vehicle_number: string;
  vehicle_model: string;
  vehicle_type_id: number;
  package_hours_id: number;
  ownership_id: number;
  logistics_date: string;
  starting_meter: number;
  closing_meter: number;
  starting_time: string;
  closing_time: string;
  total_km: number;
  total_hours: number;
  extra_km: number;
  extra_hours: number;
  total_amount: number;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch (error) {
    throw new Error(
      `Unable to reach the API at ${API_URL}. Check VITE_API_URL, backend health, and FRONTEND_URL CORS settings.`,
    );
  }

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore JSON parse failure and keep the fallback message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
