import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Users,
  History,
  TrendingUp,
  Clock,
  ChefHat,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DashboardHome() {
  const { profile } = useAuth();
  const { recipients, orders, ordersLoading, cart } = useApp();

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const stats = [
    { title: 'Penerima Terdaftar', value: recipients.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Order Pending', value: pendingOrders.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { title: 'Order Sukses', value: paidOrders.length, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { title: 'Total Pembelian', value: `Rp ${totalSpent.toLocaleString('id-ID')}`, icon: History, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  const recentOrders = orders.slice(0, 3);

  if (ordersLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-primary to-primary-glow rounded-2xl p-6 lg:p-8 text-primary-foreground">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Selamat Datang, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-primary-foreground/80 mb-6">Kelola pesanan makanan sekolah untuk anak-anak Anda dengan mudah dan cepat.</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/menu"><Button variant="secondary" size="lg"><ChefHat className="w-5 h-5 mr-2" />Pesan Sekarang</Button></Link>
          {cart.length > 0 && (
            <Link to="/dashboard/cart">
              <Button variant="outline" size="lg" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20">
                <ShoppingCart className="w-5 h-5 mr-2" />Lihat Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} variant="interactive">
              <CardContent className="p-4 lg:p-6">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" />Aksi Cepat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link to="/dashboard/menu" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ChefHat className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-semibold">Pesan Makanan</p><p className="text-sm text-muted-foreground">Pilih menu untuk anak Anda</p></div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/dashboard/recipients" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center"><Users className="w-5 h-5 text-secondary" /></div>
                  <div><p className="font-semibold">Kelola Penerima</p><p className="text-sm text-muted-foreground">Tambah atau edit data anak</p></div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/dashboard/orders" className="block">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><History className="w-5 h-5 text-accent" /></div>
                  <div><p className="font-semibold">Riwayat Order</p><p className="text-sm text-muted-foreground">Lihat semua pesanan Anda</p></div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" />Pesanan Terbaru</CardTitle>
            <Link to="/dashboard/orders"><Button variant="ghost" size="sm">Lihat Semua<ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center"><CalendarDays className="w-5 h-5 text-muted-foreground" /></div>
                      <div>
                        <p className="font-semibold">{order.recipient?.name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_date ? format(new Date(order.delivery_date), 'd MMM yyyy', { locale: id }) : '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={order.status === 'paid' ? 'paid' : order.status === 'pending' ? 'pending' : order.status === 'failed' ? 'failed' : 'expired'}>
                        {order.status === 'paid' ? 'Lunas' : order.status === 'pending' ? 'Pending' : order.status === 'failed' ? 'Gagal' : 'Expired'}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada pesanan</p>
                <Link to="/dashboard/menu"><Button variant="link" className="mt-2">Mulai Pesan <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
