import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface MenuItemSummary {
  menu_item_id: string;
  menu_item_name: string;
  total_quantity: number;
  category: string;
}

interface RecipientInfo {
  orderId: string;
  name: string;
  class: string;
  status: string;
  isGuest: boolean;
}

interface KitchenPdfData {
  date: Date;
  totalOrders: number;
  totalPortions: number;
  items: MenuItemSummary[];
  recipients: RecipientInfo[];
}

export function generateKitchenPdf(data: KitchenPdfData): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = format(data.date, "yyyy-MM-dd");
  const formattedDate = format(data.date, "EEEE, d MMMM yyyy", { locale: id });

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Rekap Dapur Harian", pageWidth / 2, 20, { align: "center" });

  // Date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Tanggal: ${formattedDate}`, pageWidth / 2, 30, { align: "center" });

  // Summary
  doc.setFontSize(11);
  doc.text(`Total Pesanan: ${data.totalOrders}`, 14, 45);
  doc.text(`Total Porsi Menu: ${data.totalPortions}`, 14, 52);

  // Menu items table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Daftar Menu yang Harus Disiapkan", 14, 65);

  // Group items by category
  const groupedItems = data.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItemSummary[]>,
  );

  const menuTableData: (string | number)[][] = [];
  Object.entries(groupedItems).forEach(([category, items]) => {
    // Add category header row
    menuTableData.push([category.toUpperCase(), "", ""]);
    items.forEach((item) => {
      menuTableData.push([
        "",
        item.menu_item_name,
        `${item.total_quantity} porsi`,
      ]);
    });
  });

  let finalY = 70;

  if (menuTableData.length > 0) {
    autoTable(doc, {
      startY: 70,
      head: [["Kategori", "Nama Menu", "Jumlah"]],
      body: menuTableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: 90 },
        2: { cellWidth: 40, halign: "center" },
      },
      didParseCell: (data) => {
        // Style category rows
        if (
          data.section === "body" &&
          data.row.raw[0] !== "" &&
          data.row.raw[1] === ""
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [229, 231, 235];
        }
      },
    });

    finalY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Recipients table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Daftar Pemesan", 14, finalY);

  const recipientTableData = data.recipients.map((r) => [
    r.name + (r.isGuest ? " (Tamu)" : ""),
    r.class,
    r.status === "paid" || r.status === "confirmed"
      ? "Lunas"
      : r.status === "pending"
        ? "Pending"
        : r.status,
  ]);

  if (recipientTableData.length > 0) {
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Nama", "Kelas", "Status"]],
      body: recipientTableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: "center" },
        2: { cellWidth: 40, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const status = data.cell.raw as string;
          if (status === "Lunas") {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else if (status === "Pending") {
            data.cell.styles.textColor = [202, 138, 4];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      14,
      doc.internal.pageSize.getHeight() - 10,
    );
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" },
    );
  }

  // Save
  doc.save(`Rekap-Dapur-${dateStr}.pdf`);
}
