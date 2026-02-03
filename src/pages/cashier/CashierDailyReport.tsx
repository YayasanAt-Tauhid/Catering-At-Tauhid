import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  TrendingUp,
  Receipt,
  Wallet,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CashierDailyReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: dailyReport, isLoading } = useQuery({
    queryKey: ['cashier-daily-report', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Create start and end of selected date in local time, then convert to ISO for query
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get paid orders for selected date
      const { data: paidOrders, error: paidError } = await supabase
        .from('orders')
        .select('id, order_code, total_amount, updated_at, guest_name, guest_phone, guest_class, user_id, recipient_id')
        .in('status', ['paid', 'confirmed'])
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString());

      if (paidError) throw paidError;

      // Get pending orders for selected date
      const { data: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('status', 'pending')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (pendingError) throw pendingError;

      const totalPaid = paidOrders?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0;
      const totalPending = pendingOrders?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

      return {
        paidCount: paidOrders?.length ?? 0,
        pendingCount: pendingOrders?.length ?? 0,
        totalPaid,
        totalPending,
        transactions: paidOrders?.map(o => ({
          id: o.id,
          order_code: o.order_code,
          amount: o.total_amount,
          time: o.updated_at,
          guest_name: o.guest_name,
          guest_class: o.guest_class,
        })) ?? [],
      };
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrintReport = () => {
    const reportContent = `
====================================
LAPORAN HARIAN KASIR
====================================
Tanggal: ${format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}

------------------------------------
RINGKASAN
------------------------------------
Pesanan Dikonfirmasi: ${dailyReport?.paidCount ?? 0}
Pesanan Pending: ${dailyReport?.pendingCount ?? 0}

Total Pembayaran: ${formatCurrency(dailyReport?.totalPaid ?? 0)}
Total Pending: ${formatCurrency(dailyReport?.totalPending ?? 0)}

------------------------------------
DAFTAR TRANSAKSI
------------------------------------
${dailyReport?.transactions.map((t, i) => 
  `${i + 1}. ${t.order_code || t.id.slice(0, 8)} - ${t.guest_name || 'Member'} - ${formatCurrency(t.amount)} (${format(new Date(t.time), "HH:mm", { locale: id })})`
).join('\n') || 'Tidak ada transaksi'}

====================================
Dicetak: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Harian Kasir</title>
            <style>
              body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
            </style>
          </head>
          <body>${reportContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Harian</h1>
          <p className="text-muted-foreground">Ringkasan pembayaran per hari</p>
        </div>
        
        <div className="flex gap-2">
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
          <Button onClick={handlePrintReport} className="gap-2">
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Dikonfirmasi</CardTitle>
                <Receipt className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyReport?.paidCount ?? 0}</div>
                <p className="text-xs text-muted-foreground">pesanan</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Wallet className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyReport?.pendingCount ?? 0}</div>
                <p className="text-xs text-muted-foreground">pesanan</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dailyReport?.totalPaid ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">hari ini</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Wallet className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(dailyReport?.totalPending ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">menunggu</p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              {!dailyReport?.transactions.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada transaksi untuk tanggal ini
                </div>
              ) : (
                <div className="divide-y">
                  {dailyReport.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{transaction.order_code || transaction.id.slice(0, 8)}</p>
                          {transaction.guest_name && (
                            <Badge variant="secondary" className="text-xs">Guest</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {transaction.guest_name || 'Member'} • {format(new Date(transaction.time), "HH:mm", { locale: id })}
                        </p>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
