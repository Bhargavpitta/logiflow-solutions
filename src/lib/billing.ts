// Innova Crysta pricing model
export const PACKAGES: Record<number, { label: string; hours: number; km: number; basePrice: number }> = {
  1: { label: '8 hrs / 80 km', hours: 8, km: 80, basePrice: 3500 },
  2: { label: '12 hrs / 120 km', hours: 12, km: 120, basePrice: 5000 },
  3: { label: '16 hrs / 160 km', hours: 16, km: 160, basePrice: 6500 },
  4: { label: '24 hrs / 200 km', hours: 24, km: 200, basePrice: 7000 },
};

export const OWNERSHIP: Record<number, string> = { 1: 'Own', 2: 'Rent', 3: 'Agency' };
export const VEHICLE_TYPES: Record<number, string> = { 1: 'SUV', 2: 'Sedan', 3: 'Tempo', 4: 'Mini Bus' };

export const EXTRA_HOUR_RATE = 200;
export const EXTRA_KM_RATE = 20;

export function hoursBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight
  return Math.round((diff / 60) * 100) / 100;
}

export interface BillingInputs {
  packageId: number;
  startingMeter: number;
  closingMeter: number;
  startingTime: string;
  closingTime: string;
}

export interface BillingResult {
  totalKm: number;
  totalHours: number;
  extraKm: number;
  extraHours: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  totalAmount: number;
}

export function calculateBilling(i: BillingInputs): BillingResult {
  const pkg = PACKAGES[i.packageId] ?? PACKAGES[1];
  const totalKm = Math.max(0, (i.closingMeter || 0) - (i.startingMeter || 0));
  const totalHours = hoursBetween(i.startingTime, i.closingTime);
  const extraKm = Math.max(0, totalKm - pkg.km);
  const extraHours = Math.max(0, totalHours - pkg.hours);
  const extraKmCharge = extraKm * EXTRA_KM_RATE;
  const extraHourCharge = extraHours * EXTRA_HOUR_RATE;
  return {
    totalKm: round(totalKm),
    totalHours: round(totalHours),
    extraKm: round(extraKm),
    extraHours: round(extraHours),
    basePrice: pkg.basePrice,
    extraKmCharge: round(extraKmCharge),
    extraHourCharge: round(extraHourCharge),
    totalAmount: round(pkg.basePrice + extraKmCharge + extraHourCharge),
  };
}

function round(n: number) { return Math.round(n * 100) / 100; }

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
