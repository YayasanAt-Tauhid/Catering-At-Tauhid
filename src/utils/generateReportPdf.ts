import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { MenuStat, DailyStat, ClassStat, TrendData, DateRange } from '@/hooks/useReportsData';

interface ReportData {
  dateRange: DateRange;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  trendData: TrendData;
  menuStats: MenuStat[];
  dailyStats: DailyStat[];
  classStats: ClassStat[];
}

export function generateReportPdf(data: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Penjualan', pageWidth / 2, 20, { align: 'center' });
  
  // Period
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const periodText = data.dateRange.from && data.dateRange.to
    ? `Periode: ${format(data.dateRange.from, 'd MMMM yyyy', { locale: id })} - ${format(data.dateRange.to, 'd MMMM yyyy', { locale: id })}`
    : 'Periode: -';
  doc.text(periodText, pageWidth / 2, 30, { align: 'center' });
  
  // Generated date
  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(`Dibuat: ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: id })}`, pageWidth / 2, 38, { align: 'center' });
  doc.setTextColor(0);

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 14, 52);
  
  const summaryData = [
    ['Total Pendapatan', `Rp ${data.totalRevenue.toLocaleString('id-ID')}`],
    ['Total Order', data.totalOrders.toString()],
    ['Rata-rata Order', `Rp ${data.averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`],
    ['Order Pending', data.pendingOrders.toString()],
    ['Perubahan Pendapatan', `${data.trendData.revenueChange >= 0 ? '+' : ''}${data.trendData.revenueChange.toFixed(1)}%`],
    ['Perubahan Order', `${data.trendData.ordersChange >= 0 ? '+' : ''}${data.trendData.ordersChange.toFixed(1)}%`],
  ];

  autoTable(doc, {
    startY: 56,
    head: [['Metrik', 'Nilai']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 14, right: 14 },
  });

  // Top Menu Section
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Menu Terlaris', 14, currentY);
  
  const topMenuData = data.menuStats.slice(0, 10).map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.count.toString(),
    `Rp ${item.revenue.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['#', 'Menu', 'Qty', 'Pendapatan']],
    body: topMenuData,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 14, right: 14 },
  });

  // Check if need new page
  currentY = (doc as any).lastAutoTable.finalY + 15;
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // Daily Stats Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pendapatan Harian', 14, currentY);
  
  const dailyData = data.dailyStats.map(item => [
    format(item.date, 'EEEE, d MMM yyyy', { locale: id }),
    item.orders.toString(),
    `Rp ${item.revenue.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Tanggal', 'Order', 'Pendapatan']],
    body: dailyData,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 14, right: 14 },
  });

  // Check if need new page
  currentY = (doc as any).lastAutoTable.finalY + 15;
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // Class Distribution Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribusi per Kelas', 14, currentY);
  
  const classData = data.classStats.slice(0, 10).map(item => [
    item.className,
    item.orders.toString(),
    `Rp ${item.revenue.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Kelas', 'Order', 'Pendapatan']],
    body: classData,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `Laporan_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(fileName);
}
