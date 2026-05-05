import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OWNERSHIP, PACKAGES, VEHICLE_TYPES, formatINR } from './billing';

export interface EntryRow {
  driver_name: string; contact_number: string | null; vehicle_number: string;
  vehicle_model: string; vehicle_type_id: number; package_hours_id: number;
  ownership_id: number; logistics_date: string;
  starting_meter: number; closing_meter: number;
  starting_time: string; closing_time: string;
  total_km: number; total_hours: number; extra_km: number; extra_hours: number;
  total_amount: number;
}

export function exportToExcel(rows: EntryRow[], filename = 'logistics-records.xlsx') {
  const data = rows.map((r) => ({
    Date: r.logistics_date,
    Driver: r.driver_name,
    Contact: r.contact_number ?? '',
    'Vehicle No.': r.vehicle_number,
    Model: r.vehicle_model,
    Type: VEHICLE_TYPES[r.vehicle_type_id] ?? '',
    Package: PACKAGES[r.package_hours_id]?.label ?? '',
    Ownership: OWNERSHIP[r.ownership_id] ?? '',
    'Start Meter': r.starting_meter,
    'Close Meter': r.closing_meter,
    'Start Time': r.starting_time,
    'Close Time': r.closing_time,
    'Total Hrs': r.total_hours,
    'Total KM': r.total_km,
    'Extra Hrs': r.extra_hours,
    'Extra KM': r.extra_km,
    'Total Amount (INR)': r.total_amount,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logistics');
  XLSX.writeFile(wb, filename);
}

export function generateInvoicePDF(rows: EntryRow[], opts?: { from?: string; to?: string }) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('LogiTrack Pro', 14, 17);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Logistics Invoice', doc.internal.pageSize.getWidth() - 14, 17, { align: 'right' });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  const range = opts?.from && opts?.to ? `Period: ${opts.from} → ${opts.to}` : 'Full Period';
  doc.text(range, 14, 36);
  doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 14, 36, { align: 'right' });

  const grandTotal = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  autoTable(doc, {
    startY: 42,
    head: [['Date', 'Driver', 'Vehicle', 'Package', 'Total Hrs', 'Total KM', 'Extra Hrs', 'Extra KM', 'Amount (INR)']],
    body: rows.map((r) => [
      r.logistics_date, r.driver_name, r.vehicle_number,
      PACKAGES[r.package_hours_id]?.label ?? '',
      r.total_hours, r.total_km, r.extra_hours, r.extra_km,
      formatINR(r.total_amount),
    ]),
    foot: [['', '', '', '', '', '', '', 'Grand Total', formatINR(grandTotal)]],
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [34, 211, 165], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });

  doc.save(`invoice-${Date.now()}.pdf`);
}
