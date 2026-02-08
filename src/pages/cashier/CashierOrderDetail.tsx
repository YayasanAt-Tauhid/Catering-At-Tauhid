import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isOrderExpired } from "@/utils/orderUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Package,
  User,
  Calendar,
  Eye,
  Printer
} from "lucide-react";

interface OrderItemDetail {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: {
    name: string;
    category: string;
  } | null;
}

interface OrderWithFullDetails {
  id: string;
  order_code: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_date: string | null;
  notes: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  recipient: {
    name: string;
    class: string | null;
    phone: string | null;
  } | null;
  profile: {
    full_name: string | null;
    phone: string | null;
  } | null;
  order_items: OrderItemDetail[];
}

export default function CashierOrderDetail() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithFullDetails | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['cashier-all-orders'],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_code,
          total_amount,
          status,
          created_at,
          delivery_date,
          notes,
          user_id,
          recipient_id,
          guest_name,
          guest_phone,
          guest_class
        `)
        .in('status', ['pending', 'paid', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const ordersWithDetails: OrderWithFullDetails[] = await Promise.all(
        (ordersData || []).map(async (order) => {
          let recipient = null;
          let profile = null;
          let orderItems: OrderItemDetail[] = [];

          if (order.recipient_id) {
            const { data } = await supabase
              .from('recipients')
              .select('name, class, phone')
              .eq('id', order.recipient_id)
              .single();
            recipient = data;
          }

          if (order.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('user_id', order.user_id)
              .single();
            profile = data;
          }

          const { data: items } = await supabase
            .from('order_items')
            .select(`
              id,
              quantity,
              unit_price,
              subtotal,
              menu_item_id
            `)
            .eq('order_id', order.id);

          if (items) {
            orderItems = await Promise.all(
              items.map(async (item) => {
                let menuItem = null;
                if (item.menu_item_id) {
                  const { data } = await supabase
                    .from('menu_items')
                    .select('name, category')
                    .eq('id', item.menu_item_id)
                    .single();
                  menuItem = data;
                }
                return {
                  ...item,
                  menu_item: menuItem,
                };
              })
            );
          }

          return {
            ...order,
            recipient,
            profile,
            order_items: orderItems,
          };
        })
      );

      return ordersWithDetails.filter(
        (o) => !isOrderExpired({ status: o.status, delivery_date: o.delivery_date })
      );
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.order_code?.toLowerCase().includes(searchLower) ||
      order.recipient?.name.toLowerCase().includes(searchLower) ||
      order.profile?.full_name?.toLowerCase().includes(searchLower) ||
      order.guest_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Lunas</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePrintDetail = (order: OrderWithFullDetails) => {
    const itemsList = order.order_items.map((item, i) => 
      `${i + 1}. ${item.menu_item?.name ?? 'Item'}\n   ${item.quantity}x @ ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}`
    ).join('\n');

    const isGuestOrder = !!order.guest_name;
    
    const detailContent = `
====================================
DETAIL PESANAN
====================================
Kode Pesanan: ${order.order_code || order.id.slice(0, 8)}
Tanggal: ${format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: id })}
Tanggal Antar: ${order.delivery_date ? format(new Date(order.delivery_date), "d MMMM yyyy", { locale: id }) : '-'}
Status: ${order.status === 'paid' || order.status === 'confirmed' ? 'LUNAS' : 'PENDING'}
Tipe: ${isGuestOrder ? 'Guest Order' : 'Member Order'}

------------------------------------
${isGuestOrder ? 'DATA PEMESAN' : 'PEMESAN'}
------------------------------------
Nama: ${isGuestOrder ? order.guest_name : (order.profile?.full_name ?? '-')}
Telepon: ${isGuestOrder ? order.guest_phone : (order.profile?.phone ?? '-')}
Kelas: ${isGuestOrder ? order.guest_class : (order.recipient?.class ?? '-')}
${!isGuestOrder ? `
------------------------------------
PENERIMA
------------------------------------
Nama: ${order.recipient?.name ?? '-'}
Kelas: ${order.recipient?.class ?? '-'}
Telepon: ${order.recipient?.phone ?? '-'}` : ''}

------------------------------------
ITEM PESANAN
------------------------------------
${itemsList}

------------------------------------
TOTAL: ${formatCurrency(order.total_amount)}
------------------------------------
${order.notes ? `Catatan: ${order.notes}` : ''}
====================================
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Detail Pesanan</title>
            <style>
              body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
            </style>
          </head>
          <body>${detailContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Detail Pesanan</h1>
        <p className="text-muted-foreground">Lihat detail item dalam setiap pesanan</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan ID pesanan atau nama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !filteredOrders?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada pesanan ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.order_code || order.id.slice(0, 8)}
                      </Badge>
                      {getStatusBadge(order.status)}
                      {order.guest_name && (
                        <Badge variant="secondary" className="text-xs">Guest</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{order.guest_name || order.profile?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {order.delivery_date 
                            ? format(new Date(order.delivery_date), "d MMM yyyy", { locale: id })
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm">
                      <span className="text-muted-foreground">Items:</span>{" "}
                      <span className="font-medium">{order.order_items.length} item</span>
                    </p>

                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono">
                  {selectedOrder.order_code || selectedOrder.id.slice(0, 8)}
                </Badge>
                <div className="flex items-center gap-2">
                  {selectedOrder.guest_name && (
                    <Badge variant="secondary">Guest Order</Badge>
                  )}
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedOrder.guest_name ? (
                  <>
                    <div>
                      <p className="text-muted-foreground">Nama</p>
                      <p className="font-medium">{selectedOrder.guest_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telepon</p>
                      <p className="font-medium">{selectedOrder.guest_phone ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kelas</p>
                      <p className="font-medium">{selectedOrder.guest_class ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tanggal Antar</p>
                      <p className="font-medium">
                        {selectedOrder.delivery_date 
                          ? format(new Date(selectedOrder.delivery_date), "d MMMM yyyy", { locale: id })
                          : '-'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-muted-foreground">Pemesan</p>
                      <p className="font-medium">{selectedOrder.profile?.full_name ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telepon</p>
                      <p className="font-medium">{selectedOrder.profile?.phone ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Penerima</p>
                      <p className="font-medium">{selectedOrder.recipient?.name ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kelas</p>
                      <p className="font-medium">{selectedOrder.recipient?.class ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tanggal Antar</p>
                      <p className="font-medium">
                        {selectedOrder.delivery_date 
                          ? format(new Date(selectedOrder.delivery_date), "d MMMM yyyy", { locale: id })
                          : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Item Pesanan:</p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.menu_item?.name ?? 'Item'} x{item.quantity}
                      </span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-4 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Catatan:</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <Button 
                onClick={() => handlePrintDetail(selectedOrder)}
                className="w-full gap-2"
              >
                <Printer className="h-4 w-4" />
                Cetak Detail
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
