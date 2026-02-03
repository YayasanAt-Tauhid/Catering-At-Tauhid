import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

export default function AdminFinancePage() {
  const { orders, isLoading } = useAdminOrders();
  const [period, setPeriod] = useState('month');

  const paidOrders = orders.filter(o => o.status === 'paid');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const failedOrders = orders.filter(o => o.status === 'failed' || o.status === 'expired');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const failedRevenue = failedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const handleExportTransactions = () => {
    // Export logic here
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Keuangan</h1>
          <p className="text-muted-foreground mt-1">Laporan keuangan dan transaksi</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportTransactions}>
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendapatan Lunas</p>
                <p className="text-2xl font-bold text-success">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {paidOrders.length} transaksi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-7 h-7 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Pembayaran</p>
                <p className="text-2xl font-bold text-warning">
                  Rp {pendingRevenue.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendingOrders.length} transaksi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gagal/Expired</p>
                <p className="text-2xl font-bold text-destructive">
                  Rp {failedRevenue.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {failedOrders.length} transaksi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary" />
            Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Tanggal</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Order ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Penerima</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Jumlah</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-6">
                      <p className="font-medium">
                        {format(new Date(order.created_at), 'd MMM yyyy', { locale: id })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'HH:mm', { locale: id })}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium">{order.recipient?.name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{order.recipient?.class || ''}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          order.status === 'paid' ? 'paid' :
                          order.status === 'pending' ? 'pending' :
                          order.status === 'failed' ? 'failed' : 'expired'
                        }
                      >
                        {order.status === 'paid' ? 'Lunas' :
                         order.status === 'pending' ? 'Pending' :
                         order.status === 'failed' ? 'Gagal' : 'Expired'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada transaksi</h3>
              <p className="text-muted-foreground">
                Transaksi akan muncul di sini
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}