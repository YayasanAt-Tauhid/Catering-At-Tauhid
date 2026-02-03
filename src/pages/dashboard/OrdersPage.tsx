import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePayment } from '@/hooks/usePayment';
import { Link, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  History,
  CreditCard,
  Calendar,
  User,
  ChevronRight,
  Filter,
  ShoppingCart,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { OrderStatus } from '@/hooks/useOrders';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/PaginationControls';
import { isOrderExpired, getOrderStatusBadge } from '@/utils/orderUtils';

type FilterStatus = OrderStatus | 'all';

export default function OrdersPage() {
  const { orders, ordersLoading, updateOrderStatus, cancelOrder, cart, addToCart, menuItems, refetchOrders } = useApp();
  const { toast } = useToast();
  const { initiateMultiplePayment, openPaymentModal, isProcessing } = usePayment();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const pagination = usePagination(filteredOrders, { itemsPerPage: 10 });

  useEffect(() => {
    pagination.resetPage();
  }, [statusFilter]);

  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending');

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) =>
      checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  };

  const handlePayOrder = async (orderId: string) => {
    // Redirect to order detail page for Midtrans payment
    navigate(`/dashboard/orders/${orderId}`);
  };

  const handlePayMultiple = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'Pilih Order',
        description: 'Pilih minimal satu order untuk dibayar',
        variant: 'destructive',
      });
      return;
    }

    const result = await initiateMultiplePayment(selectedOrders);
    
    if (result?.snapToken) {
      openPaymentModal(
        result.snapToken,
        () => {
          setSelectedOrders([]);
          refetchOrders();
        },
        () => {
          refetchOrders();
        },
        () => {
          refetchOrders();
        }
      );
    }
  };

  const handleReorder = (order: typeof orders[0]) => {
    if (!order.order_items) return;

    order.order_items.forEach((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
      if (menuItem) {
        addToCart(menuItem, item.quantity);
      }
    });
    toast({
      title: 'Item Ditambahkan',
      description: 'Item dari pesanan sebelumnya telah ditambahkan ke keranjang',
    });
    navigate('/dashboard/checkout');
  };


  if (ordersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Riwayat Order</h1>
          <p className="text-muted-foreground mt-1">Kelola semua pesanan Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as FilterStatus)}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="failed">Gagal</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Payment */}
      {pendingOrders.length > 0 && (
        <Card variant="bordered" className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Bayar Beberapa Order Sekaligus</p>
              <p className="text-sm text-muted-foreground">
                Pilih order pending yang ingin dibayar bersamaan
              </p>
            </div>
            <Button
              variant="warning"
              onClick={handlePayMultiple}
              disabled={selectedOrders.length === 0 || isProcessing}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing ? 'Memproses...' : `Bayar ${selectedOrders.length > 0 ? `(${selectedOrders.length})` : ''}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {pagination.paginatedItems.map((order) => {
            const statusInfo = getOrderStatusBadge(order);
            const orderExpired = isOrderExpired(order);
            return (
              <Card key={order.id} variant="interactive">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    {order.status === 'pending' && (
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOrder(order.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            {order.id.slice(0, 8)}...
                          </span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          Rp {order.total_amount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{order.recipient?.name || '-'}</span>
                          <span className="text-muted-foreground">
                            ({order.recipient?.class || '-'})
                          </span>
                        </div>
                        {order.delivery_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {format(new Date(order.delivery_date), 'EEEE, d MMMM yyyy', {
                                locale: id,
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {order.order_items && order.order_items.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
                          {order.order_items.map((item, index) => (
                            <span key={index} className="bg-muted px-2 py-1 rounded">
                              {item.menu_item?.name || 'Menu'} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && !orderExpired && (
                          <>
                            <Button size="sm" onClick={() => handlePayOrder(order.id)}>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Bayar Sekarang
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm('Yakin ingin membatalkan pesanan ini?')) {
                                  cancelOrder(order.id);
                                }
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Batalkan
                            </Button>
                          </>
                        )}
                        {(order.status === 'expired' || order.status === 'failed' || orderExpired) && (
                          <Button size="sm" variant="outline" onClick={() => handleReorder(order)}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Pesan Ulang
                          </Button>
                        )}
                        <Link to={`/dashboard/orders/${order.id}`}>
                          <Button size="sm" variant="ghost">
                            Detail
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <History className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground text-center mb-6">
              {statusFilter === 'all'
                ? 'Anda belum memiliki pesanan apapun'
                : `Tidak ada pesanan dengan status ${statusFilter}`}
            </p>
            <Link to="/dashboard/menu">
              <Button variant="hero">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Mulai Pesan
              </Button>
            </Link>
          </CardContent>
        </Card>
          )}
          
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
          />
        </div>
  );
}
