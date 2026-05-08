import * as XLSX from "xlsx";

export type ImportedOwnership = "own" | "rent" | "agency";

export interface ImportedVehicleSeed {
  owner_name: string;
  owner_number: string | null;
  vehicle_name: string;
  vehicle_number: string;
  vehicle_model: string;
  ownership: ImportedOwnership;
  agency_name: string | null;
  status: string;
}

export interface ImportedTripLogSeed {
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
  inferred_ownership: ImportedOwnership;
}

interface DriverMasterWorkbook {
  vehicleSeed: ImportedVehicleSeed[];
  tripLogSeed: ImportedTripLogSeed[];
}

const DEFAULT_DRIVER_MASTER_PATH = "/drivers_master_data.xlsx";

let workbookPromise: Promise<DriverMasterWorkbook> | null = null;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function parseDate(value: unknown) {
  const match = clean(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function inferOwnership(row: Record<string, unknown>): ImportedOwnership {
  const driverName = clean(row["Driver Name"]);
  const contactNumber = clean(row["Contact Number"]);
  const vehicleNumber = clean(row["Vehicle Number"]);

  if (!driverName || !contactNumber) return "agency";
  if (/^[A-Z]{2,3}\d+/i.test(vehicleNumber)) return "own";
  if (/^\d{4,}$/.test(vehicleNumber)) return "rent";
  return "own";
}

export async function loadDefaultDriverMaster(): Promise<DriverMasterWorkbook> {
  if (workbookPromise) return workbookPromise;

  workbookPromise = (async () => {
    const response = await fetch(DEFAULT_DRIVER_MASTER_PATH);
    if (!response.ok) {
      throw new Error(`Unable to load bundled Excel seed at ${DEFAULT_DRIVER_MASTER_PATH}.`);
    }

    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const tripLogSeed = rows
      .map((row, index) => {
        const inferredOwnership = inferOwnership(row);
        return {
          source_row: index + 2,
          driver_name: clean(row["Driver Name"]) || "Unknown Driver",
          contact_number: clean(row["Contact Number"]) || null,
          vehicle_number: clean(row["Vehicle Number"]),
          vehicle_type: clean(row["Vehicle Type"]) || "SUV",
          vehicle_model: clean(row["Vehicle Model"]) || "Innova Crysta",
          log_date: parseDate(row["Log Date"]),
          starting_meter: Number(row["Starting Metre"] || 0),
          closing_meter: Number(row["Closing Metre"] || 0),
          starting_time: clean(row["Starting Time"]) || null,
          closing_time: clean(row["Closing Time"]) || null,
          package_type: clean(row["Package Type"]) || "8 hrs / 80 km",
          package_amount: row["Package Amount"] === "" ? 3500 : Number(row["Package Amount"]),
          extra_hour_rate: row["Extra Hrs Rate (per hr)"] === "" ? 200 : Number(row["Extra Hrs Rate (per hr)"]),
          extra_time_rate: row["Extra Time Rate (per hr)"] === "" ? 20 : Number(row["Extra Time Rate (per hr)"]),
          ownership_raw: clean(row["Vehicle Ownership"]) || null,
          inferred_ownership: inferredOwnership,
        };
      })
      .filter((row) => row.vehicle_number && row.log_date);

    const vehiclesByNumber = new Map<string, ImportedVehicleSeed>();

    for (const row of tripLogSeed) {
      const key = row.vehicle_number || `${row.driver_name}-${row.contact_number || "na"}`;
      if (vehiclesByNumber.has(key)) continue;

      vehiclesByNumber.set(key, {
        owner_name: row.driver_name,
        owner_number: row.contact_number,
        vehicle_name: row.vehicle_model,
        vehicle_number: row.vehicle_number,
        vehicle_model: row.vehicle_model,
        ownership: row.inferred_ownership,
        agency_name: row.inferred_ownership === "agency" ? "Imported Agency Fleet" : null,
        status: "available",
      });
    }

    return {
      vehicleSeed: [...vehiclesByNumber.values()],
      tripLogSeed,
    };
  })();

  return workbookPromise;
}
