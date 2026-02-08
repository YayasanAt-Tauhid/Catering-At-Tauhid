import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingBag,
  Users,
  DollarSign,
  ChefHat,
  ArrowRight,
  Clock,
  Calendar,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { orders, isLoading: ordersLoading } = useAdminOrders();
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // Fetch total users count
  useEffect(() => {
    const fetchUserCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(count || 0);
    };
    fetchUserCount();
  }, []);

  const todayOrders = orders.filter(o => {
    if (!o.delivery_date) return false;
    const orderDate = new Date(o.delivery_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // Calculate menu summary for today
  const menuSummary: Record<string, number> = {};
  todayOrders.forEach(order => {
    order.order_items?.forEach(item => {
      const menuName = item.menu_item?.name || 'Unknown';
      menuSummary[menuName] = (menuSummary[menuName] || 0) + item.quantity;
    });
  });

  const stats = [
    {
      title: 'Order Hari Ini',
      value: todayOrders.length,
      icon: ShoppingBag,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Order Pending',
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Total User',
      value: totalUsers.toString(),
      icon: Users,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'Pendapatan',
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];
  if (ordersLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-secondary to-secondary/80 rounded-2xl p-6 lg:p-8 text-secondary-foreground">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Dashboard Admin
        </h1>
        <p className="text-secondary-foreground/80 mb-4">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/orders">
            <Button className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Kelola Order
            </Button>
          </Link>
          <Link to="/admin/menu">
            <Button variant="outline" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
              <ChefHat className="w-5 h-5 mr-2" />
              Kelola Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
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
        {/* Today's Menu Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-secondary" />
              Rekap Menu Hari Ini
            </CardTitle>
            <Badge variant="secondary">{format(new Date(), 'd MMM', { locale: id })}</Badge>
          </CardHeader>
          <CardContent>
            {Object.keys(menuSummary).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(menuSummary).map(([name, qty]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <span className="font-medium">{name}</span>
                    <Badge>{qty} porsi</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada pesanan untuk hari ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-secondary" />
              Order Terbaru
            </CardTitle>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <p className="font-semibold">{order.recipient?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.recipient?.class || ''} • {order.delivery_date ? format(new Date(order.delivery_date), 'd MMM', { locale: id }) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
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
                    <p className="text-sm font-semibold mt-1">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients by Class */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary" />
            Daftar Penerima Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nama</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kelas</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Menu</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 font-medium">{order.recipient?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{order.recipient?.class || ''}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {order.order_items?.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item.menu_item?.name || 'Unknown'} x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={order.status === 'paid' ? 'paid' : 'pending'}
                        >
                          {order.status === 'paid' ? 'Lunas' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada penerima untuk hari ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}