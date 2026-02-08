import { useState, useEffect } from 'react';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Search,
  Filter,
  CalendarIcon,
  Download,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { OrderStatus } from '@/hooks/useOrders';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/PaginationControls';
import { isOrderExpired, getOrderStatusBadge } from '@/utils/orderUtils';

export default function AdminOrdersPage() {
  const { orders, isLoading, refetch } = useAdminOrders();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();

  const filteredOrders = orders.filter(order => {
    const recipientName = order.recipient?.name || order.guest_name || '';
    const recipientClass = order.recipient?.class || order.guest_class || '';
    
    const matchesSearch = 
      recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipientClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.guest_phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesDate = !dateFilter || !order.delivery_date ||
      new Date(order.delivery_date).toDateString() === dateFilter.toDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const pagination = usePagination(filteredOrders, { itemsPerPage: 10 });

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery, statusFilter, dateFilter]);

  const handleExport = () => {
    toast({
      title: 'Export Data',
      description: 'Data order sedang diexport ke Excel',
    });
  };

  const handleMarkAsPaid = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status',
        variant: 'destructive',
      });
      return;
    }

    await refetch();
    toast({
      title: 'Status Diperbarui',
      description: 'Order berhasil ditandai sebagai Lunas',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Kelola Order</h1>
          <p className="text-muted-foreground mt-1">Lihat dan kelola semua pesanan</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-5 h-5 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Cari order, penerima, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="failed">Gagal</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, 'd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Order ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Penerima</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Tanggal</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Menu</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-6">
                      <span className="font-mono font-medium">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium">
                          {order.recipient?.name || order.guest_name || 'N/A'}
                          {order.guest_name && !order.recipient && (
                            <Badge variant="outline" className="ml-2 text-xs">Tamu</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.recipient?.class || order.guest_class || ''}
                          {order.guest_phone && !order.recipient && ` • ${order.guest_phone}`}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {order.delivery_date ? (
                        <>
                          <p className="font-medium">
                            {format(new Date(order.delivery_date), 'd MMM yyyy', { locale: id })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.delivery_date), 'EEEE', { locale: id })}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {order.order_items?.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item.menu_item?.name || 'Unknown'} x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const statusBadge = getOrderStatusBadge(order);
                        return (
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-success hover:text-success"
                            onClick={() => handleMarkAsPaid(order.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada order</h3>
              <p className="text-muted-foreground">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          )}
          
          {filteredOrders.length > 0 && (
            <div className="px-6 pb-4">
              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}