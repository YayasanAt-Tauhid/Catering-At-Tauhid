import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePayment } from '@/hooks/usePayment';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, Calendar, User, CreditCard, RefreshCw, Download, Clock, Package, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Order } from '@/hooks/useOrders';
import { isOrderExpired, getOrderStatusBadge } from '@/utils/orderUtils';

export default function OrderDetailPage() {
  const { id: orderId } = useParams();
  const { orders, updateOrderStatus, menuItems, addToCart, getOrderById } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initiatePayment, openPaymentModal, isProcessing } = usePayment();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      // First check local state
      const localOrder = orders.find((o) => o.id === orderId);
      if (localOrder) {
        setOrder(localOrder);
        setIsLoading(false);
      } else {
        const fetchedOrder = await getOrderById(orderId);
        setOrder(fetchedOrder);
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [orderId, orders, getOrderById]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Pesanan Tidak Ditemukan</h2>
        <Link to="/dashboard/orders"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Riwayat Order</Button></Link>
      </div>
    );
  }

  const handlePay = async () => {
    if (!order) return;

    const paymentData = await initiatePayment(order.id);

    if (paymentData) {
      openPaymentModal(
        paymentData.snapToken,
        () => {
          // On success - refresh order data
          window.location.reload();
        },
        () => {
          // On pending
          toast({
            title: 'Pembayaran Pending',
            description: 'Silakan selesaikan pembayaran Anda',
          });
        },
        () => {
          // On error
          toast({
            title: 'Pembayaran Gagal',
            description: 'Silakan coba lagi',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleReorder = () => {
    if (!order.order_items) return;
    order.order_items.forEach((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
      if (menuItem) addToCart(menuItem, item.quantity);
    });
    toast({ title: 'Item Ditambahkan', description: 'Item dari pesanan sebelumnya telah ditambahkan ke keranjang' });
    navigate('/dashboard/checkout');
  };

  const handleDownloadInvoice = () => {
    toast({ title: 'Invoice Diunduh', description: 'File invoice sedang diproses' });
  };

  const orderExpired = isOrderExpired(order);
  const statusBadge = getOrderStatusBadge(order);
  
  // Override label for detail page (more verbose)
  const statusConfig = {
    ...statusBadge,
    label: statusBadge.variant === 'pending' ? 'Menunggu Pembayaran' : statusBadge.label
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/orders')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold">{order.id.slice(0, 8)}...</h1>
            <Badge variant={statusConfig.variant} className="text-sm">{statusConfig.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Dibuat {format(new Date(order.created_at), 'd MMMM yyyy, HH:mm', { locale: id })}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Informasi Pesanan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><User className="w-6 h-6 text-primary-foreground" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Penerima</p>
                  <p className="font-bold text-lg">{order.recipient?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">{order.recipient?.class || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"><Calendar className="w-6 h-6 text-secondary-foreground" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Penerimaan</p>
                  <p className="font-bold text-lg">{order.delivery_date ? format(new Date(order.delivery_date), 'EEEE, d MMMM yyyy', { locale: id }) : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Daftar Item</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                    <div>
                      <p className="font-semibold">{item.menu_item?.name || 'Menu'}</p>
                      <p className="text-sm text-muted-foreground">Rp {item.unit_price.toLocaleString('id-ID')} x {item.quantity}</p>
                    </div>
                    <span className="font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>Rp {order.total_amount.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><span className={statusConfig.color}>{statusConfig.label}</span></div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">Rp {order.total_amount.toLocaleString('id-ID')}</span></div>
              </div>
              <div className="space-y-2 pt-4">
                {order.status === 'pending' && !orderExpired && (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handlePay}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Bayar Sekarang
                      </>
                    )}
                  </Button>
                )}
                {(order.status === 'expired' || order.status === 'failed' || orderExpired) && <Button variant="default" size="lg" className="w-full" onClick={handleReorder}><RefreshCw className="w-5 h-5 mr-2" />Pesan Ulang</Button>}
                {order.status === 'paid' && <Button variant="outline" size="lg" className="w-full" onClick={handleDownloadInvoice}><Download className="w-5 h-5 mr-2" />Download Invoice</Button>}
              </div>
              {order.status === 'pending' && !orderExpired && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" /><p>Segera lakukan pembayaran sebelum pesanan expired</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
