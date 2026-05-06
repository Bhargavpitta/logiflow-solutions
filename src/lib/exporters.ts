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

  // Invoice meta
  const invoiceNo = `INV-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;
  const today = new Date();
  const dueDate = new Date(today.getTime() + 30 * 86400000);

  // ================= HEADER =================
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text('OneHmt', M, 18);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('Logistics & Transport Services', M, 25);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('Invoice', W - M, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`#${invoiceNo}`, W - M, 25, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`Generated: ${today.toLocaleString('en-GB')}`, W - M, 31, { align: 'right' });

  // ================= META BAR =================
  let y = 46;
  doc.setFillColor(245, 247, 255);
  doc.rect(M, y, W - 2 * M, 9, 'F');
  doc.setTextColor(60, 60, 90); doc.setFontSize(9);
  const period = opts?.from && opts?.to ? `${fmtDate(opts.from)} → ${fmtDate(opts.to)}` : 'Full Period Report';
  const driver = rows.length === 1 ? rows[0].driver_name : `${new Set(rows.map(r => r.driver_name)).size} drivers`;
  const vehicle = rows.length === 1 ? rows[0].vehicle_number : `${new Set(rows.map(r => r.vehicle_number)).size} vehicles`;
  doc.text(`${period}   |   Driver: ${driver}   |   Vehicle: ${vehicle}   |   Status: Due`, M + 3, y + 6);

  // ================= INVOICE DETAILS =================
  y += 16;
  doc.setTextColor(20, 20, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Invoice Details', M, y);
  y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);

  const detailRows: [string, string][] = [
    ['Invoice No.', `#${invoiceNo}`],
    ['Date', fmtDate(today.toISOString())],
    ['Due Date', fmtDate(dueDate.toISOString())],
    ['Currency', 'INR (₹)'],
    ['GST No.', '36XXXXX0000X1ZX'],
  ];
  autoTable(doc, {
    startY: y,
    body: detailRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { textColor: [110, 110, 130], cellWidth: 40 }, 1: { fontStyle: 'bold' } },
    margin: { left: M },
    tableWidth: 80,
  });

  // ================= STAT CARDS =================
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

  const cardsY = y;
  const cardW = 38, cardH = 28, gap = 4;
  const cardsX = W - M - (cardW * 2 + gap);
  const cards = [
    { label: 'Total Hrs', value: totals.hours.toString(), sub: 'hours driven' },
    { label: 'Total KM', value: totals.km.toString(), sub: 'km covered' },
    { label: 'Extra Hrs', value: totals.extraHrs.toString(), sub: 'overtime hrs' },
    { label: 'Extra KM', value: totals.extraKm.toString(), sub: 'additional km' },
  ];
  cards.forEach((c, i) => {
    const cx = cardsX + (i % 2) * (cardW + gap);
    const cy = cardsY + Math.floor(i / 2) * (cardH + gap);
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7); doc.setTextColor(110, 110, 130);
    doc.text(c.label.toUpperCase(), cx + 3, cy + 5);
    doc.setFontSize(16); doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold');
    doc.text(c.value, cx + 3, cy + 15);
    doc.setFontSize(7); doc.setTextColor(140, 140, 155); doc.setFont('helvetica', 'normal');
    doc.text(c.sub, cx + 3, cy + 22);
  });

  // ================= SERVICE DETAILS TABLE =================
  let tableStartY = Math.max((doc as any).lastAutoTable?.finalY ?? y, cardsY + cardH * 2 + gap) + 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(20, 20, 30);
  doc.text('Service Details', M, tableStartY);
  tableStartY += 3;

  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Driver', 'Vehicle', 'Package', 'Total Hrs', 'Total KM', 'Extra Hrs', 'Extra KM', 'Amount']],
    body: rows.map((r) => [
      r.logistics_date,
      r.driver_name,
      r.vehicle_number,
      PACKAGES[r.package_hours_id]?.label ?? '',
      `${r.total_hours} hrs`,
      `${r.total_km} km`,
      `${r.extra_hours} hr`,
      `${r.extra_km} km`,
      fmtINR2(Number(r.total_amount)),
    ]),
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: { 8: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: M, right: M },
  });

  // ================= NOTES + SUMMARY =================
  let endY = (doc as any).lastAutoTable.finalY + 10;
  const colW = (W - 2 * M - 6) / 2;

  // Notes box
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(M, endY, colW, 36, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 30);
  doc.text('Notes & Payment Info', M + 4, endY + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 100);
  doc.text('Payment Terms: Payment due within 30 days of invoice date.', M + 4, endY + 14);
  doc.text('Bank Name: XXXX Bank  ·  Branch: Hyderabad', M + 4, endY + 22);

  // Summary box
  const sx = M + colW + 6;
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(sx, endY, colW, 36, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 30);
  doc.text('Summary', sx + 4, endY + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 100);
  const sLines: [string, string][] = [
    ['Subtotal', fmtINR2(totals.amount)],
    ['GST (0%)', fmtINR2(0)],
    ['Discount', fmtINR2(0)],
  ];
  sLines.forEach((l, i) => {
    doc.text(l[0], sx + 4, endY + 14 + i * 7);
    doc.text(l[1], sx + colW - 4, endY + 14 + i * 7, { align: 'right' });
  });

  // ================= GRAND TOTAL =================
  endY += 42;
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(M, endY, W - 2 * M, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255);
  doc.text('Grand Total', M + 5, endY + 9);
  doc.setFontSize(14);
  doc.text(fmtINR2(totals.amount), W - M - 5, endY + 9, { align: 'right' });

  // ================= FOOTER =================
  endY += 22;
  doc.setTextColor(120, 120, 140); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Thank you for your business — OneHmt Logistics', W / 2, endY, { align: 'center' });
  doc.text('onehmt.com  ·  contact@onehmt.com', W / 2, endY + 5, { align: 'center' });

  doc.save(`${invoiceNo}_OneHmt.pdf`);
}
