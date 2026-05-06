import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OWNERSHIP, PACKAGES, VEHICLE_TYPES } from './billing';

export interface EntryRow {
  driver_name: string; contact_number: string | null; vehicle_number: string;
  vehicle_model: string; vehicle_type_id: number; package_hours_id: number;
  ownership_id: number; logistics_date: string;
  starting_meter: number; closing_meter: number;
  starting_time: string; closing_time: string;
  total_km: number; total_hours: number; extra_km: number; extra_hours: number;
  total_amount: number;
}

export function exportToExcel(rows: EntryRow[], filename = 'onehmt-logistics-records.xlsx') {
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

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtINR2 = (n: number) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function generateInvoicePDF(rows: EntryRow[], opts?: { from?: string; to?: string }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 14;

  const invoiceNo = `INV-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;
  const today = new Date();
  const dueDate = new Date(today.getTime() + 30 * 86400000);

  // Brand colors
  const ink: [number, number, number] = [20, 20, 30];
  const muted: [number, number, number] = [130, 130, 145];
  const line: [number, number, number] = [225, 228, 235];
  const soft: [number, number, number] = [248, 250, 252];
  const dark: [number, number, number] = [25, 28, 35];

  // ================= HEADER (white) =================
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26);
  doc.text('OneHmt', M, 22);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text('LOGISTICS & TRANSPORT SERVICES', M, 28);

  // INVOICE pill (top right)
  doc.setFillColor(...dark);
  doc.rect(W - M - 22, 14, 22, 6, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('INVOICE', W - M - 11, 18, { align: 'center' });

  doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(`#${invoiceNo}`, W - M, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(`Generated: ${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}   ${today.toLocaleTimeString('en-GB')}`, W - M, 31, { align: 'right' });

  // separator
  doc.setDrawColor(...line); doc.setLineWidth(0.3);
  doc.line(M, 38, W - M, 38);

  // ================= META BAR =================
  let y = 44;
  doc.setFontSize(8); doc.setTextColor(...muted);
  const period = opts?.from && opts?.to ? `${fmtDate(opts.from)} → ${fmtDate(opts.to)}` : 'Full Period Report';
  const driver = rows.length === 1 ? rows[0].driver_name : `${new Set(rows.map(r => r.driver_name)).size} drivers`;
  const vehicle = rows.length === 1 ? rows[0].vehicle_number : `${new Set(rows.map(r => r.vehicle_number)).size} vehicles`;

  const metaItems = [
    { label: '', value: period },
    { label: 'Driver:', value: driver },
    { label: 'Vehicle:', value: vehicle },
    { label: 'Status:', value: 'Due' },
  ];
  let mx = M;
  metaItems.forEach((m, i) => {
    if (i > 0) {
      doc.setDrawColor(...line);
      doc.line(mx, y - 4, mx, y + 1);
      mx += 4;
    }
    if (m.label) {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...muted);
      doc.text(m.label, mx, y);
      const lw = doc.getTextWidth(m.label) + 1.5;
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink);
      doc.text(m.value, mx + lw, y);
      mx += lw + doc.getTextWidth(m.value) + 6;
    } else {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink);
      doc.text(m.value, mx, y);
      mx += doc.getTextWidth(m.value) + 6;
    }
  });

  doc.line(M, y + 3, W - M, y + 3);

  // ================= INVOICE DETAILS + STAT CARDS =================
  y += 11;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...muted);
  doc.text('INVOICE DETAILS', M, y);

  // Stat card labels
  const totals = rows.reduce(
    (a, r) => ({
      hours: a.hours + Number(r.total_hours),
      km: a.km + Number(r.total_km),
      extraHrs: a.extraHrs + Number(r.extra_hours),
      extraKm: a.extraKm + Number(r.extra_km),
      amount: a.amount + Number(r.total_amount),
    }),
    { hours: 0, km: 0, extraHrs: 0, extraKm: 0, amount: 0 }
  );

  const cards = [
    { label: 'TOTAL HRS', value: String(Math.round(totals.hours)), sub: 'hours driven' },
    { label: 'TOTAL KM', value: String(Math.round(totals.km)), sub: 'km covered' },
    { label: 'EXTRA HRS', value: String(Math.round(totals.extraHrs)), sub: 'overtime hrs' },
    { label: 'EXTRA KM', value: String(Math.round(totals.extraKm)), sub: 'additional km' },
  ];
  const cardsAreaX = M + 70;
  const cardsAreaW = W - M - cardsAreaX;
  const cardW = cardsAreaW / 4;
  cards.forEach((c, i) => {
    const cx = cardsAreaX + i * cardW;
    doc.setFontSize(7); doc.setTextColor(...muted); doc.setFont('helvetica', 'normal');
    doc.text(c.label, cx, y);
  });

  // Detail rows
  y += 4;
  const detailRows: [string, string][] = [
    ['Invoice No.', `#${invoiceNo}`],
    ['Date', fmtDate(today.toISOString())],
    ['Due Date', fmtDate(dueDate.toISOString())],
    ['Currency', 'INR'],
    ['GST No.', '36XXXXX0000X1ZX'],
  ];
  doc.setFontSize(8);
  detailRows.forEach((r, i) => {
    const ry = y + i * 5;
    doc.setTextColor(...muted); doc.setFont('helvetica', 'normal');
    doc.text(r[0], M, ry);
    doc.setTextColor(...ink); doc.setFont('helvetica', 'bold');
    doc.text(r[1], M + 28, ry);
  });

  // Big stat values
  cards.forEach((c, i) => {
    const cx = cardsAreaX + i * cardW;
    doc.setFontSize(20); doc.setTextColor(...ink); doc.setFont('helvetica', 'bold');
    doc.text(c.value, cx, y + 6);
    doc.setFontSize(7); doc.setTextColor(...muted); doc.setFont('helvetica', 'normal');
    doc.text(c.sub, cx, y + 12);
  });

  y += 30;
  doc.setDrawColor(...line); doc.line(M, y, W - M, y);

  // ================= SERVICE DETAILS =================
  y += 6;
  doc.setFontSize(7); doc.setTextColor(...muted); doc.setFont('helvetica', 'normal');
  doc.text('SERVICE DETAILS', M, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['DATE', 'DRIVER', 'VEHICLE', 'PACKAGE', 'TOTAL HRS', 'TOTAL KM', 'EXTRA HRS', 'EXTRA KM', 'AMOUNT']],
    body: rows.map((r) => [
      r.logistics_date,
      r.driver_name,
      r.vehicle_number,
      PACKAGES[r.package_hours_id]?.label ?? '',
      `${Number(r.total_hours)}\nhrs`,
      `${Number(r.total_km)}\nkm`,
      `${Number(r.extra_hours)}\nhr`,
      `${Number(r.extra_km)}\nkm`,
      fmtINR2(Number(r.total_amount)).replace('.00', ''),
    ]),
    headStyles: { fillColor: dark, textColor: 255, fontStyle: 'bold', fontSize: 7, cellPadding: 3 },
    styles: { fontSize: 8, cellPadding: 3, textColor: ink, lineColor: line, lineWidth: 0.1 },
    columnStyles: { 8: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: M, right: M },
    theme: 'grid',
  });

  // ================= NOTES + SUMMARY =================
  let endY = (doc as any).lastAutoTable.finalY + 8;
  const colW = (W - 2 * M - 8) / 2;

  // Notes (left, plain)
  doc.setFontSize(7); doc.setTextColor(...muted); doc.setFont('helvetica', 'normal');
  doc.text('NOTES & PAYMENT INFO', M, endY);
  doc.setFontSize(8); doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold'); doc.text('Payment Terms:', M, endY + 6);
  doc.setFont('helvetica', 'normal'); doc.text('Payment due within 30 days of invoice date.', M + 26, endY + 6);
  doc.setFont('helvetica', 'bold'); doc.text('Bank Name:', M, endY + 12);
  doc.setFont('helvetica', 'normal'); doc.text('XXXX Bank', M + 20, endY + 12);
  doc.setFont('helvetica', 'bold'); doc.text('Branch:', M + 42, endY + 12);
  doc.setFont('helvetica', 'normal'); doc.text('Hyderabad', M + 53, endY + 12);

  // Summary (right)
  const sx = M + colW + 8;
  doc.setFontSize(7); doc.setTextColor(...muted); doc.setFont('helvetica', 'normal');
  doc.text('SUMMARY', sx, endY);
  doc.setFontSize(9); doc.setTextColor(...ink);
  const sLines: [string, string][] = [
    ['Subtotal', fmtINR2(totals.amount)],
    ['GST (0%)', fmtINR2(0)],
    ['Discount', fmtINR2(0)],
  ];
  sLines.forEach((l, i) => {
    const ly = endY + 6 + i * 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...muted);
    doc.text(l[0], sx, ly);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink);
    doc.text(l[1], W - M, ly, { align: 'right' });
  });

  // ================= GRAND TOTAL (dark bar) =================
  endY += 26;
  doc.setFillColor(...dark);
  doc.rect(M, endY, W - 2 * M, 14, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255);
  doc.text('GRAND TOTAL', M + 5, endY + 9);
  doc.setFontSize(14);
  doc.text(fmtINR2(totals.amount), W - M - 5, endY + 9, { align: 'right' });

  // ================= FOOTER =================
  endY += 22;
  doc.setFillColor(...soft);
  doc.rect(0, endY - 4, W, 12, 'F');
  doc.setTextColor(...muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Thank you for your business — OneHmt Logistics', M, endY + 3);
  doc.text('onehmt.com  ·  contact@onehmt.com', W - M, endY + 3, { align: 'right' });

  doc.save(`${invoiceNo}_OneHmt.pdf`);
}
