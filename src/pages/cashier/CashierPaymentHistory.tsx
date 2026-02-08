import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  History,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

interface PaidOrderWithDetails {
  id: string;
  order_code: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  recipient: {
    name: string;
    class: string | null;
  } | null;
  profile: {
    full_name: string | null;
  } | null;
}

export default function CashierPaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: paidOrders, isLoading } = useQuery({
    queryKey: ['cashier-paid-orders', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all'],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_code,
          total_amount,
          status,
          created_at,
          updated_at,
          delivery_date,
          user_id,
          recipient_id,
          guest_name,
          guest_phone,
          guest_class
        `)
        .in('status', ['paid', 'confirmed'])
        .order('updated_at', { ascending: false });

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.gte('updated_at', `${dateStr}T00:00:00`)
                     .lt('updated_at', `${dateStr}T23:59:59`);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      const ordersWithDetails: PaidOrderWithDetails[] = await Promise.all(
        (orders || []).map(async (order) => {
          let recipient = null;
          let profile = null;

          if (order.recipient_id) {
            const { data } = await supabase
              .from('recipients')
              .select('name, class')
              .eq('id', order.recipient_id)
              .single();
            recipient = data;
          }

          if (order.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', order.user_id)
              .single();
            profile = data;
          }

          return {
            ...order,
            recipient,
            profile,
          };
        })
      );

      return ordersWithDetails;
    },
  });

  const filteredOrders = paidOrders?.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.order_code?.toLowerCase().includes(searchLower) ||
      order.recipient?.name.toLowerCase().includes(searchLower) ||
      order.profile?.full_name?.toLowerCase().includes(searchLower) ||
      order.guest_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const pagination = usePagination(filteredOrders, { itemsPerPage: 10 });

  useEffect(() => {
    pagination.resetPage();
  }, [searchTerm, selectedDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrintReceipt = (order: PaidOrderWithDetails) => {
    const isGuestOrder = !!order.guest_name;
    const receiptContent = `
      ====================================
      STRUK PEMBAYARAN
      ====================================
      Kode Pesanan: ${order.order_code || order.id.slice(0, 8)}
      Tanggal: ${format(new Date(order.updated_at), "d MMMM yyyy, HH:mm", { locale: id })}
      Tipe: ${isGuestOrder ? 'Guest Order' : 'Member Order'}
      
      ------------------------------------
      DATA PEMESAN
      ------------------------------------
      Nama: ${isGuestOrder ? order.guest_name : (order.profile?.full_name ?? '-')}
      ${isGuestOrder ? `Telepon: ${order.guest_phone ?? '-'}` : ''}
      Kelas: ${isGuestOrder ? order.guest_class : (order.recipient?.class ?? '-')}
      ${!isGuestOrder && order.recipient ? `Penerima: ${order.recipient.name}` : ''}
      
      ------------------------------------
      Total: ${formatCurrency(order.total_amount)}
      ------------------------------------
      Status: LUNAS
      ====================================
      Terima kasih!
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Pembayaran</title>
            <style>
              body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riwayat Pembayaran</h1>
        <p className="text-muted-foreground">Daftar pesanan yang sudah dibayar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan ID pesanan atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[200px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: id }) : "Filter tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {selectedDate && (
          <Button variant="ghost" onClick={() => setSelectedDate(undefined)}>
            Reset
          </Button>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Terkonfirmasi</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredOrders?.length ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            pesanan sudah dibayar
          </p>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !filteredOrders?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada riwayat pembayaran</p>
            </CardContent>
          </Card>
        ) : (
          pagination.paginatedItems.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.order_code || order.id.slice(0, 8)}
                      </Badge>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Lunas
                      </Badge>
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
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {format(new Date(order.updated_at), "d MMM yyyy, HH:mm", { locale: id })}
                        </span>
                      </div>
                    </div>

                    {order.guest_name ? (
                      <p className="text-sm">
                        Kelas: <span className="font-medium">{order.guest_class || '-'}</span>
                        <span className="text-muted-foreground ml-2">({order.guest_phone})</span>
                      </p>
                    ) : order.recipient && (
                      <p className="text-sm">
                        Penerima: <span className="font-medium">{order.recipient.name}</span>
                        {order.recipient.class && (
                          <span className="text-muted-foreground"> (Kelas {order.recipient.class})</span>
                        )}
                      </p>
                    )}

                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => handlePrintReceipt(order)}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Cetak Struk
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {filteredOrders.length > 0 && (
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
          />
        )}
      </div>
    </div>
  );
}
