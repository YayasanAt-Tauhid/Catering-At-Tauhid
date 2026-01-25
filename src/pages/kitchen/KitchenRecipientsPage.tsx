import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarIcon,
  Users,
  Printer,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecipientInfo {
  orderId: string;
  name: string;
  class: string;
  status: string;
  isGuest: boolean;
  items: { name: string; quantity: number }[];
  totalAmount: number;
}

type StatusFilter = "all" | "paid" | "pending";
type SortOption = "name" | "class" | "status";

export default function KitchenRecipientsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("class");
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );

  const { data, isLoading } = useQuery({
    queryKey: ["kitchen-recipients", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Get orders for selected date
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          delivery_date,
          status,
          total_amount,
          recipient_id,
          guest_name,
          guest_class,
          recipients (name, class),
          order_items (
            quantity,
            menu_items (name)
          )
        `,
        )
        .eq("delivery_date", dateStr)
        .in("status", ["confirmed", "paid", "pending"]);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return {
          recipients: [],
          classes: [],
          statusCounts: { all: 0, paid: 0, pending: 0 },
        };
      }

      const classesSet = new Set<string>();
      const statusCounts = {
        all: orders.length,
        paid: orders.filter(
          (o) => o.status === "paid" || o.status === "confirmed",
        ).length,
        pending: orders.filter((o) => o.status === "pending").length,
      };

      const recipients: RecipientInfo[] = orders.map((o) => {
        const recipientData = o.recipients as {
          name: string;
          class: string | null;
        } | null;
        const isGuest = !o.recipient_id && o.guest_name;
        const recipientClass = recipientData?.class ?? o.guest_class ?? "-";

        if (recipientClass && recipientClass !== "-") {
          classesSet.add(recipientClass);
        }

        const items =
          (o.order_items as any[])?.map((item) => ({
            name:
              (item.menu_items as { name: string } | null)?.name ?? "Unknown",
            quantity: item.quantity,
          })) ?? [];

        return {
          orderId: o.id,
          name: recipientData?.name ?? o.guest_name ?? "Unknown",
          class: recipientClass,
          status: o.status,
          isGuest: !!isGuest,
          items,
          totalAmount: o.total_amount,
        };
      });

      // Sort classes naturally (e.g., 1A, 1B, 2A, etc.)
      const sortedClasses = Array.from(classesSet).sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      });

      return { recipients, classes: sortedClasses, statusCounts };
    },
  });

  // Filter and sort recipients
  const filteredAndSortedRecipients = useMemo(() => {
    let recipients = data?.recipients ?? [];

    // Apply class filter
    if (selectedClass !== "all") {
      recipients = recipients.filter((r) => r.class === selectedClass);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      recipients = recipients.filter((r) => {
        if (statusFilter === "paid") {
          return r.status === "paid" || r.status === "confirmed";
        }
        return r.status === statusFilter;
      });
    }

    // Apply sorting
    return [...recipients].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "id");
        case "class":
          const classA = a.class.replace(/[^0-9]/g, "");
          const classB = b.class.replace(/[^0-9]/g, "");
          if (classA && classB) {
            const numDiff = parseInt(classA) - parseInt(classB);
            if (numDiff !== 0) return numDiff;
          }
          return a.class.localeCompare(b.class, "id");
        case "status":
          const statusOrder: Record<string, number> = {
            paid: 0,
            confirmed: 0,
            pending: 1,
          };
          return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
        default:
          return 0;
      }
    });
  }, [data?.recipients, selectedClass, statusFilter, sortBy]);

  const handleSelectAll = () => {
    if (selectedRecipients.size === filteredAndSortedRecipients.length) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(
        new Set(filteredAndSortedRecipients.map((r) => r.orderId)),
      );
    }
  };

  const handleSelectRecipient = (orderId: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedRecipients(newSelected);
  };

  const handlePrint = () => {
    const recipientsToPrint = filteredAndSortedRecipients.filter((r) =>
      selectedRecipients.has(r.orderId),
    );

    if (recipientsToPrint.length === 0) return;

    // Group by class
    const groupedByClass = recipientsToPrint.reduce(
      (acc, r) => {
        const classKey = r.class || "-";
        if (!acc[classKey]) {
          acc[classKey] = [];
        }
        acc[classKey].push(r);
        return acc;
      },
      {} as Record<string, RecipientInfo[]>,
    );

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Daftar Penerima - ${format(selectedDate, "d MMMM yyyy", { locale: id })}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      font-size: 12px;
    }
    h1 {
      text-align: center;
      margin-bottom: 5px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 20px;
    }
    .class-section {
      margin-bottom: 20px;
    }
    .class-header {
      background: #f3f4f6;
      padding: 8px 12px;
      font-weight: bold;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f9fafb;
    }
    .status-paid {
      color: #16a34a;
      font-weight: bold;
    }
    .status-pending {
      color: #ca8a04;
      font-weight: bold;
    }
    .guest-badge {
      background: #e5e7eb;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      margin-left: 4px;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    @media print {
      body { margin: 0; padding: 15px; }
    }
  </style>
</head>
<body>
  <h1>Daftar Penerima</h1>
  <div class="subtitle">
    ${format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
    ${selectedClass !== "all" ? ` - Kelas ${selectedClass}` : ""}
    ${statusFilter !== "all" ? ` - Status: ${statusFilter === "paid" ? "Lunas" : "Pending"}` : ""}
  </div>

  ${Object.entries(groupedByClass)
    .sort(([a], [b]) => {
      const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    })
    .map(
      ([classKey, recipients]) => `
    <div class="class-section">
      <div class="class-header">Kelas ${classKey} (${recipients.length} penerima)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px">No</th>
            <th>Nama</th>
            <th>Menu</th>
            <th style="width: 70px">Status</th>
          </tr>
        </thead>
        <tbody>
          ${recipients
            .map(
              (r, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${r.name}${r.isGuest ? '<span class="guest-badge">Tamu</span>' : ""}</td>
              <td>${r.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}</td>
              <td class="${r.status === "paid" || r.status === "confirmed" ? "status-paid" : "status-pending"}">
                ${r.status === "paid" || r.status === "confirmed" ? "Lunas" : "Pending"}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `,
    )
    .join("")}

  <div class="footer">
    Total: ${recipientsToPrint.length} penerima |
    Dicetak: ${format(new Date(), "dd/MM/yyyy HH:mm")}
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const statusCounts = data?.statusCounts ?? { all: 0, paid: 0, pending: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Daftar Penerima</h1>
            <p className="text-muted-foreground">
              Daftar penerima pesanan berdasarkan tanggal
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })
                  : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {data?.classes.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  Kelas {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Semua ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("paid")}
              className={
                statusFilter === "paid"
                  ? ""
                  : "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              }
            >
              Paid ({statusCounts.paid})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
              className={
                statusFilter === "pending"
                  ? ""
                  : "text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
              }
            >
              Pending ({statusCounts.pending})
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Urutkan:</span>
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="class">Kelas</SelectItem>
              <SelectItem value="name">Nama (A–Z)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Penerima
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAndSortedRecipients.length}
            </div>
            <p className="text-xs text-muted-foreground">
              untuk {format(selectedDate, "d MMMM yyyy", { locale: id })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Sudah Bayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {statusCounts.paid}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {statusCounts.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      {filteredAndSortedRecipients.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedRecipients.size ===
                  filteredAndSortedRecipients.length &&
                filteredAndSortedRecipients.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedRecipients.size} dari{" "}
              {filteredAndSortedRecipients.length} penerima dipilih
            </span>
          </div>
          <Button
            onClick={handlePrint}
            disabled={selectedRecipients.size === 0}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Cetak Daftar
          </Button>
        </div>
      )}

      {/* Recipients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Penerima
            {filteredAndSortedRecipients.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filteredAndSortedRecipients.length} penerima
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedRecipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada penerima untuk kriteria ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRecipients.map((recipient) => (
                  <TableRow key={recipient.orderId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRecipients.has(recipient.orderId)}
                        onCheckedChange={() =>
                          handleSelectRecipient(recipient.orderId)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{recipient.name}</span>
                        {recipient.isGuest && (
                          <Badge variant="outline" className="text-xs">
                            Tamu
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{recipient.class}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-muted-foreground truncate block">
                        {recipient.items
                          .map((i) => `${i.name} (${i.quantity})`)
                          .join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          recipient.status === "confirmed" ||
                          recipient.status === "paid"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          recipient.status === "confirmed" ||
                          recipient.status === "paid"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        }
                      >
                        {recipient.status === "paid" ||
                        recipient.status === "confirmed"
                          ? "Lunas"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
