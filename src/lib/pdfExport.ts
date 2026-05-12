import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkOrder } from '../types';

export const exportWorkOrdersToPDF = (workOrders: WorkOrder[]) => {
  const doc = new jsPDF();

  // Add Title
  doc.setFontSize(18);
  doc.text('eCMMS - Honicel Indonesia', 14, 15);
  doc.setFontSize(12);
  doc.text('Work Order Report', 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

  // Define Table Columns
  const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Title', dataKey: 'title' },
    { header: 'Asset', dataKey: 'asset' },
    { header: 'Priority', dataKey: 'priority' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Created At', dataKey: 'created_at' },
  ];

  // Map Data
  const data = workOrders.map(wo => ({
    id: wo.id.slice(0, 8),
    title: wo.title,
    asset: wo.asset?.name || 'N/A',
    priority: wo.priority.toUpperCase(),
    status: wo.status.toUpperCase(),
    created_at: new Date(wo.created_at).toLocaleDateString(),
  }));

  // Generate Table
  autoTable(doc, {
    startY: 35,
    columns: columns,
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // Blue-600
    alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Save PDF
  doc.save(`WorkOrders_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
