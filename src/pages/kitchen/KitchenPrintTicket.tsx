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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Printer, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderItemWithStatus {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  category: string;
  order_status: string;
}

interface MenuItemSummary {
  menu_item_id: string;
  menu_item_name: string;
  total_quantity: number;
  category: string;
}

type StatusFilter = "all" | "paid" | "pending";

export default function KitchenPrintTicket() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: dailySummary, isLoading } = useQuery({
    queryKey: ["kitchen-print-summary", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("delivery_date", dateStr)
        .in("status", ["confirmed", "paid", "pending"]);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return {
          items: [],
          categories: [],
          statusCounts: { all: 0, paid: 0, pending: 0 },
        };
      }

      // Calculate status counts
      const statusCounts = {
        all: orders.length,
        paid: orders.filter(
          (o) => o.status === "paid" || o.status === "confirmed",
        ).length,
        pending: orders.filter((o) => o.status === "pending").length,
      };

      const orderIds = orders.map((o) => o.id);
      const orderStatusMap = new Map(orders.map((o) => [o.id, o.status]));

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          quantity,
          menu_item_id,
          order_id,
          menu_items (name, category)
        `,
        )
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Store items with order status
      const itemsWithStatus: OrderItemWithStatus[] = [];
      const categoriesSet = new Set<string>();

      orderItems?.forEach((item) => {
        const menuItem = item.menu_items as {
          name: string;
          category: string;
        } | null;
        if (!menuItem || !item.menu_item_id) return;

        categoriesSet.add(menuItem.category);

        itemsWithStatus.push({
          menu_item_id: item.menu_item_id,
          menu_item_name: menuItem.name,
          quantity: item.quantity,
          category: menuItem.category,
          order_status: orderStatusMap.get(item.order_id) || "pending",
        });
      });

      return {
        items: itemsWithStatus,
        categories: Array.from(categoriesSet).sort(),
        statusCounts,
      };
    },
  });

  // Filter and aggregate items based on status and category
  const { filteredItems, groupedItems } = useMemo(() => {
    const allItems = dailySummary?.items ?? [];

    // Filter by status
    let statusFiltered = allItems;
    if (statusFilter === "paid") {
      statusFiltered = allItems.filter(
        (i) => i.order_status === "paid" || i.order_status === "confirmed",
      );
    } else if (statusFilter === "pending") {
      statusFiltered = allItems.filter((i) => i.order_status === "pending");
    }

    // Aggregate by menu item
    const itemMap = new Map<string, MenuItemSummary>();
    statusFiltered.forEach((item) => {
      const existing = itemMap.get(item.menu_item_id);
      if (existing) {
        existing.total_quantity += item.quantity;
      } else {
        itemMap.set(item.menu_item_id, {
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_item_name,
          total_quantity: item.quantity,
          category: item.category,
        });
      }
    });

    const aggregated = Array.from(itemMap.values()).sort(
      (a, b) => b.total_quantity - a.total_quantity,
    );

    // Filter by category
    const categoryFiltered = aggregated.filter(
      (item) =>
        selectedCategory === "all" || item.category === selectedCategory,
    );

    // Group by category
    const grouped = categoryFiltered.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, MenuItemSummary[]>,
    );

    return { filteredItems: categoryFiltered, groupedItems: grouped };
  }, [dailySummary?.items, statusFilter, selectedCategory]);

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((i) => i.menu_item_id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handlePrint = () => {
    const itemsToPrint = filteredItems.filter((item) =>
      selectedItems.has(item.menu_item_id),
    );

    if (itemsToPrint.length === 0) {
      return;
    }

    const groupedPrint = itemsToPrint.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, MenuItemSummary[]>,
    );

    const ticketContent = `
====================================
TIKET DAPUR
${format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
====================================

${Object.entries(groupedPrint)
  .map(
    ([category, items]) => `
--- ${category.toUpperCase()} ---
${items.map((item) => `[ ] ${item.menu_item_name}: ${item.total_quantity} porsi`).join("\n")}
`,
  )
  .join("\n")}

====================================
Total: ${itemsToPrint.reduce((sum, i) => sum + i.total_quantity, 0)} porsi
Dicetak: ${format(new Date(), "HH:mm", { locale: id })}
====================================
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tiket Dapur</title>
            <style>
              body {
                font-family: monospace;
                padding: 20px;
                white-space: pre-wrap;
                font-size: 14px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${ticketContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const statusCounts = dailySummary?.statusCounts ?? {
    all: 0,
    paid: 0,
    pending: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cetak Tiket Dapur</h1>
          <p className="text-muted-foreground">
            Cetak daftar menu yang harus disiapkan
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "d MMM yyyy", { locale: id })}
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

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {dailySummary?.categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Filter Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {statusFilter !== "all"
                ? `Tidak ada pesanan "${statusFilter}" untuk tanggal ini`
                : "Tidak ada pesanan untuk tanggal ini"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedItems.size === filteredItems.length &&
                  filteredItems.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} dari {filteredItems.length} item dipilih
              </span>
            </div>
            <Button
              onClick={handlePrint}
              disabled={selectedItems.size === 0}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Cetak Tiket
            </Button>
          </div>

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Daftar Menu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3 capitalize">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.menu_item_id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedItems.has(item.menu_item_id)}
                            onCheckedChange={() =>
                              handleSelectItem(item.menu_item_id)
                            }
                          />
                          <span className="flex-1 font-medium">
                            {item.menu_item_name}
                          </span>
                          <Badge variant="secondary" className="text-base px-3">
                            {item.total_quantity} porsi
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
