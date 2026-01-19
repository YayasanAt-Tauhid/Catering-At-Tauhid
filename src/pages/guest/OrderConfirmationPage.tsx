import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { usePayment } from '@/hooks/usePayment';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  CheckCircle,
  Copy,
  Home,
  Search,
  UtensilsCrossed,
  Calendar,
  User,
  Phone,
  School,
  CreditCard,
  Loader2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateGuestInvoicePdf } from '@/utils/generateInvoicePdf';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: {
    name: string;
    image_url: string | null;
  } | null;
}

interface OrderData {
  id: string;
  order_code: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  delivery_date: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  snap_token: string | null;
  payment_url: string | null;
  order_items: OrderItem[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Menunggu Pembayaran', variant: 'secondary' },
  confirmed: { label: 'Dikonfirmasi', variant: 'default' },
  paid: { label: 'Lunas', variant: 'default' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
  expired: { label: 'Kedaluwarsa', variant: 'destructive' },
};

export default function OrderConfirmationPage() {
  const { id: orderId } = useParams();
  const { toast } = useToast();
  const { initiateGuestPayment, openPaymentModal, isProcessing } = usePayment();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_code,
          guest_name,
          guest_phone,
          guest_class,
          delivery_date,
          total_amount,
          status,
          created_at,
          snap_token,
          payment_url,
          order_items(
            id,
            quantity,
            unit_price,
            subtotal,
            menu_item:menu_items(name, image_url)
          )
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const copyOrderCode = () => {
    if (order?.order_code) {
      navigator.clipboard.writeText(order.order_code);
      toast({
        title: 'Disalin!',
        description: 'Kode pesanan berhasil disalin',
      });
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    // If we already have a snap token, use it directly
    if (order.snap_token) {
      openPaymentModal(
        order.snap_token,
        () => {
          // On success
          fetchOrder();
        },
        () => {
          // On pending
          fetchOrder();
        }
      );
      return;
    }

    // Otherwise, initiate a new payment
    const paymentData = await initiateGuestPayment(order.id);
    if (paymentData?.snapToken) {
      openPaymentModal(
        paymentData.snapToken,
        () => {
          // On success
          fetchOrder();
        },
        () => {
          // On pending
          fetchOrder();
        }
      );
    }
  };

  const getStatusInfo = (status: string) => {
    return statusLabels[status] || { label: status, variant: 'secondary' as const };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-warm">
        <header className="container mx-auto px-4 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MakanSekolah</span>
          </Link>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen gradient-warm flex flex-col">
        <header className="container mx-auto px-4 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MakanSekolah</span>
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h2 className="text-2xl font-bold mb-2">Pesanan Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Pesanan yang Anda cari tidak ada</p>
          <Link to="/">
            <Button variant="hero">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isPaid = order.status === 'paid' || order.status === 'confirmed';

  return (
    <div className="min-h-screen gradient-warm">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">MakanSekolah</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Success Header */}
          <div className="text-center animate-fade-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPaid 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-primary/10'
            }`}>
              <CheckCircle className={`w-10 h-10 ${
                isPaid ? 'text-green-600' : 'text-primary'
              }`} />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isPaid ? 'Pembayaran Berhasil!' : 'Pesanan Berhasil Dibuat!'}
            </h1>
            <p className="text-muted-foreground">
              {isPaid 
                ? 'Terima kasih, pesanan Anda sedang diproses' 
                : 'Simpan kode pesanan dan lakukan pembayaran'}
            </p>
          </div>

          {/* Order Code Card */}
          <Card className="border-2 border-primary">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Kode Pesanan Anda</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-bold text-primary font-mono">
                  {order.order_code || '-'}
                </span>
                <Button size="icon" variant="outline" onClick={copyOrderCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Action - Only show if pending */}
          {isPending && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Lakukan Pembayaran</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total: <span className="font-bold text-foreground">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handlePayment}
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
                  
                  {order.payment_url && (
                    <a 
                      href={order.payment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                    >
                      Atau buka halaman pembayaran
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detail Pesanan</CardTitle>
                <Badge variant={getStatusInfo(order.status).variant}>
                  {getStatusInfo(order.status).label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Guest Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Nama:</span>
                  <span className="font-medium">{order.guest_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">No. HP:</span>
                  <span className="font-medium">{order.guest_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <School className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kelas:</span>
                  <span className="font-medium">{order.guest_class}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span className="font-medium">
                    {order.delivery_date
                      ? format(new Date(order.delivery_date), 'EEEE, d MMMM yyyy', { locale: id })
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-2">Item Pesanan:</p>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.menu_item?.name || 'Menu tidak tersedia'} x{item.quantity}
                      </span>
                      <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-primary">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Order Time */}
              <div className="text-sm text-muted-foreground text-center">
                Pesanan dibuat: {format(new Date(order.created_at), 'd MMMM yyyy, HH:mm', { locale: id })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isPaid && (
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={() => generateGuestInvoicePdf(order)}
              >
                <Download className="w-5 h-5 mr-2" />
                Download Invoice PDF
              </Button>
            )}
            <Link to="/track" className="block">
              <Button variant="outline" size="lg" className="w-full">
                <Search className="w-5 h-5 mr-2" />
                Lacak Pesanan
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="ghost" size="lg" className="w-full">
                <Home className="w-5 h-5 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      {/* Midtrans Snap Script */}
      <script
        type="text/javascript"
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="SB-Mid-client-placeholder"
      />
    </div>
  );
}
