import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkOrder } from '../types';

interface FilterSettings {
  assetName?: string;
  startDate?: string;
  endDate?: string;
}

export const exportWorkOrdersToPDF = (workOrders: WorkOrder[], filters?: FilterSettings) => {
  try {
    const doc = new jsPDF();

    // Company Header / Formal Header
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text('eCMMS - HONICEL INDONESIA', 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(191, 219, 254); // Blue-200
    doc.text('Industrial Paper Manufacturing Maintenance Operations Portal', 15, 27);
    doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 15, 33);

    // Filter info block
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('LAPORAN PERBAIKAN PERALATAN (WORK ORDER REPORT)', 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500

    let filterLineY = 58;
    if (filters) {
      if (filters.assetName) {
        doc.text(`Mesin / Asset Terpilih: ${filters.assetName}`, 15, filterLineY);
        filterLineY += 5;
      }
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? new Date(filters.startDate).toLocaleDateString('id-ID') : 'Awal';
        const end = filters.endDate ? new Date(filters.endDate).toLocaleDateString('id-ID') : 'Kini';
        doc.text(`Rentang Tanggal Laporan: ${start} s/d ${end}`, 15, filterLineY);
        filterLineY += 5;
      }
    }
    doc.text(`Total Records: ${workOrders.length} Work Orders`, 15, filterLineY);

    // Define Table Columns
    const columns = [
      { header: 'No. WO', dataKey: 'id' },
      { header: 'Task / Title', dataKey: 'title' },
      { header: 'Machine / Asset', dataKey: 'asset' },
      { header: 'Sparepart', dataKey: 'sparepart' },
      { header: 'Priority', dataKey: 'priority' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Created At', dataKey: 'created_at' },
    ];

    // Map Data
    const data = workOrders.map(wo => ({
      id: wo.id.slice(0, 8).toUpperCase(),
      title: wo.title,
      asset: wo.asset?.name || 'N/A',
      sparepart: wo.replaced_sparepart_name 
        ? `${wo.replaced_sparepart_name} (${wo.replaced_sparepart_qty || 1}x)` 
        : '-',
      priority: wo.priority.toUpperCase(),
      status: wo.status.toUpperCase(),
      created_at: new Date(wo.created_at).toLocaleDateString('id-ID'),
    }));

    // Generate Table
    autoTable(doc, {
      startY: filterLineY + 8,
      columns: columns,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'left', fontStyle: 'bold' }, // Dark Slate
      alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
      styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
      columnStyles: {
        id: { cellWidth: 20 },
        title: { cellWidth: 38 },
        asset: { cellWidth: 30 },
        sparepart: { cellWidth: 32 },
        priority: { cellWidth: 18 },
        status: { cellWidth: 22 },
        created_at: { cellWidth: 24 }
      }
    });

    // Save PDF
    doc.save(`WorkOrders_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err: any) {
    console.error("PDF generation failure:", err);
    alert("Gagal mengunduh laporan PDF: " + (err?.message || "Kesalahan format data."));
  }
};
