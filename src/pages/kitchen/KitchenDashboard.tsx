import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChefHat, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MenuItemSummary {
  menu_item_id: string;
  menu_item_name: string;
  total_quantity: number;
  category: string;
}

export default function KitchenDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: dailySummary, isLoading } = useQuery({
    queryKey: ['kitchen-daily-summary', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get orders for selected date with confirmed/paid status
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_date,
          status,
          recipient_id,
          guest_name,
          guest_class,
          recipients (name, class)
        `)
        .eq('delivery_date', dateStr)
        .in('status', ['confirmed', 'paid', 'pending']);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return { items: [], totalOrders: 0, recipients: [], categories: [] };
      }

      const orderIds = orders.map(o => o.id);

      // Get order items with menu details
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item_id,
          menu_items (name, category)
        `)
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Aggregate by menu item
      const itemMap = new Map<string, MenuItemSummary>();
      const categoriesSet = new Set<string>();
      
      orderItems?.forEach((item) => {
        const menuItem = item.menu_items as { name: string; category: string } | null;
        if (!menuItem || !item.menu_item_id) return;
        
        categoriesSet.add(menuItem.category);
        
        const existing = itemMap.get(item.menu_item_id);
        if (existing) {
          existing.total_quantity += item.quantity;
        } else {
          itemMap.set(item.menu_item_id, {
            menu_item_id: item.menu_item_id,
            menu_item_name: menuItem.name,
            total_quantity: item.quantity,
            category: menuItem.category,
          });
        }
      });

      // Get recipient details (including guest orders)
      const recipients = orders.map(o => {
        const recipientData = o.recipients as { name: string; class: string | null } | null;
        const isGuest = !o.recipient_id && o.guest_name;
        return {
          orderId: o.id,
          name: recipientData?.name ?? o.guest_name ?? 'Unknown',
          class: recipientData?.class ?? o.guest_class ?? '-',
          status: o.status,
          isGuest,
        };
      });

      return {
        items: Array.from(itemMap.values()).sort((a, b) => b.total_quantity - a.total_quantity),
        totalOrders: orders.length,
        recipients,
        categories: Array.from(categoriesSet).sort(),
      };
    },
  });

  // Filter items by category
  const filteredItems = dailySummary?.items.filter(
    item => selectedCategory === "all" || item.category === selectedCategory
  ) ?? [];

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItemSummary[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rekap Dapur Harian</h1>
          <p className="text-muted-foreground">Daftar menu yang harus disiapkan</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
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
            {dailySummary?.categories.map(cat => (
              <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailySummary?.totalOrders ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              pesanan untuk {format(selectedDate, "d MMMM yyyy", { locale: id })}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Item Menu</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredItems.reduce((sum, item) => sum + item.total_quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              porsi yang harus disiapkan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items to Prepare */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Daftar Menu yang Harus Disiapkan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada pesanan untuk tanggal ini
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg mb-3 capitalize">{category}</h3>
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <div 
                        key={item.menu_item_id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <span className="font-medium">{item.menu_item_name}</span>
                        <Badge variant="secondary" className="text-lg px-4 py-1">
                          {item.total_quantity} porsi
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daftar Penerima
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !dailySummary?.recipients.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada penerima untuk tanggal ini
            </div>
          ) : (
            <div className="divide-y">
              {dailySummary.recipients.map((recipient, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {recipient.name}
                      {recipient.isGuest && (
                        <Badge variant="outline" className="ml-2 text-xs">Tamu</Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Kelas: {recipient.class}</p>
                  </div>
                  <Badge 
                    variant={recipient.status === 'confirmed' || recipient.status === 'paid' ? 'default' : 'secondary'}
                  >
                    {recipient.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
