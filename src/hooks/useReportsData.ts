import { useMemo } from 'react';
import { startOfDay, endOfDay, subDays, isWithinInterval, format, getHours, getDay } from 'date-fns';
import { Order } from '@/hooks/useOrders';

export type PeriodType = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface MenuStat {
  name: string;
  count: number;
  revenue: number;
  category: string;
}

export interface DailyStat {
  date: Date;
  dateStr: string;
  orders: number;
  revenue: number;
}

export interface CategoryStat {
  name: string;
  value: number;
  fill: string;
}

export interface ClassStat {
  className: string;
  orders: number;
  revenue: number;
}

export interface HourlyStat {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

export interface DayOfWeekStat {
  day: number;
  label: string;
  orders: number;
  revenue: number;
}

export interface PaymentMethodStat {
  method: string;
  label: string;
  orders: number;
  revenue: number;
  adminFee: number;
  fill: string;
}

export interface TrendData {
  currentRevenue: number;
  previousRevenue: number;
  currentOrders: number;
  previousOrders: number;
  revenueChange: number;
  ordersChange: number;
}

const CATEGORY_COLORS = [
  'hsl(24, 90%, 55%)',   // primary
  'hsl(145, 45%, 45%)',  // secondary
  'hsl(200, 70%, 50%)',  // accent
  'hsl(45, 93%, 47%)',   // warning
  'hsl(280, 60%, 55%)',  // purple
  'hsl(0, 72%, 51%)',    // destructive
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  manual_transfer: 'TF Manual',
  cash: 'Tunai',
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  bank_transfer: 'Bank Transfer',
  bca_va: 'BCA VA',
  bni_va: 'BNI VA',
  bri_va: 'BRI VA',
  permata_va: 'Permata VA',
  cimb_va: 'CIMB VA',
  credit_card: 'Credit Card',
  midtrans: 'Midtrans',
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: 'hsl(25, 80%, 50%)',       // orange for cash
  qris: 'hsl(280, 60%, 55%)',      // purple
  gopay: 'hsl(145, 70%, 45%)',     // green
  shopeepay: 'hsl(24, 90%, 55%)',  // orange
  bank_transfer: 'hsl(200, 70%, 50%)', // blue
  bca_va: 'hsl(210, 80%, 50%)',    // blue
  bni_va: 'hsl(25, 90%, 50%)',     // orange
  bri_va: 'hsl(210, 70%, 45%)',    // blue
  permata_va: 'hsl(160, 60%, 45%)', // teal
  cimb_va: 'hsl(0, 70%, 50%)',     // red
  credit_card: 'hsl(45, 93%, 47%)', // yellow
  midtrans: 'hsl(200, 60%, 50%)',  // blue
};

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function useReportsData(
  orders: Order[],
  period: PeriodType,
  customRange: DateRange
) {
  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
      case 'month':
        return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
      case 'custom':
        return {
          from: customRange.from ? startOfDay(customRange.from) : startOfDay(subDays(now, 6)),
          to: customRange.to ? endOfDay(customRange.to) : endOfDay(now),
        };
      default:
        return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    }
  }, [period, customRange]);

  // Calculate previous period range for trend comparison
  const previousDateRange = useMemo(() => {
    const { from, to } = dateRange;
    if (!from || !to) return { from: undefined, to: undefined };
    
    const duration = to.getTime() - from.getTime();
    const previousTo = new Date(from.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - duration);
    
    return { from: startOfDay(previousFrom), to: endOfDay(previousTo) };
  }, [dateRange]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [orders, dateRange]);

  // Filter previous period orders
  const previousOrders = useMemo(() => {
    if (!previousDateRange.from || !previousDateRange.to) return [];
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: previousDateRange.from!, end: previousDateRange.to! });
    });
  }, [orders, previousDateRange]);

  // Paid orders for current period
  const paidOrders = useMemo(() => 
    filteredOrders.filter(o => o.status === 'paid' || o.status === 'confirmed'),
  [filteredOrders]);

  // Paid orders for previous period
  const previousPaidOrders = useMemo(() => 
    previousOrders.filter(o => o.status === 'paid' || o.status === 'confirmed'),
  [previousOrders]);

  // Basic stats
  const totalRevenue = useMemo(() => 
    paidOrders.reduce((sum, o) => sum + o.total_amount, 0),
  [paidOrders]);

  const totalOrders = paidOrders.length;

  const averageOrderValue = useMemo(() => 
    totalOrders > 0 ? totalRevenue / totalOrders : 0,
  [totalRevenue, totalOrders]);

  const pendingOrders = useMemo(() => 
    filteredOrders.filter(o => o.status === 'pending').length,
  [filteredOrders]);

  // Trend data
  const trendData: TrendData = useMemo(() => {
    const prevRevenue = previousPaidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const prevOrders = previousPaidOrders.length;
    
    const revenueChange = prevRevenue > 0 
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0;
    
    const ordersChange = prevOrders > 0 
      ? ((totalOrders - prevOrders) / prevOrders) * 100 
      : totalOrders > 0 ? 100 : 0;

    return {
      currentRevenue: totalRevenue,
      previousRevenue: prevRevenue,
      currentOrders: totalOrders,
      previousOrders: prevOrders,
      revenueChange,
      ordersChange,
    };
  }, [totalRevenue, totalOrders, previousPaidOrders]);

  // Menu statistics
  const menuStats: MenuStat[] = useMemo(() => {
    const stats: Record<string, MenuStat> = {};
    
    paidOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const menuName = item.menu_item?.name || 'Unknown';
        if (!stats[menuName]) {
          stats[menuName] = { 
            name: menuName, 
            count: 0, 
            revenue: 0,
            category: 'Makanan'
          };
        }
        stats[menuName].count += item.quantity;
        stats[menuName].revenue += item.unit_price * item.quantity;
      });
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [paidOrders]);

  // Daily statistics
  const dailyStats: DailyStat[] = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    const days: DailyStat[] = [];
    const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < diffDays; i++) {
      const date = new Date(dateRange.from);
      date.setDate(date.getDate() + i);
      
      const dayOrders = paidOrders.filter(o => 
        new Date(o.created_at).toDateString() === date.toDateString()
      );
      
      days.push({
        date,
        dateStr: format(date, 'dd MMM'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
      });
    }
    
    return days;
  }, [paidOrders, dateRange]);

  // Category statistics for pie chart
  const categoryStats: CategoryStat[] = useMemo(() => {
    const stats: Record<string, number> = {};
    
    paidOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const category = 'Makanan'; // Default, ideally from menu_item.category
        stats[category] = (stats[category] || 0) + (item.unit_price * item.quantity);
      });
    });

    return Object.entries(stats).map(([name, value], index) => ({
      name,
      value,
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [paidOrders]);

  // Class statistics
  const classStats: ClassStat[] = useMemo(() => {
    const stats: Record<string, ClassStat> = {};
    
    paidOrders.forEach(order => {
      const className = order.recipient?.class || order.guest_class || 'Tidak Diketahui';
      
      if (!stats[className]) {
        stats[className] = { className, orders: 0, revenue: 0 };
      }
      stats[className].orders += 1;
      stats[className].revenue += order.total_amount;
    });

    return Object.values(stats).sort((a, b) => b.orders - a.orders);
  }, [paidOrders]);

  // Hourly statistics (busy hours)
  const hourlyStats: HourlyStat[] = useMemo(() => {
    const stats: Record<number, HourlyStat> = {};
    
    // Initialize all hours
    for (let h = 0; h < 24; h++) {
      stats[h] = {
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        orders: 0,
        revenue: 0,
      };
    }
    
    paidOrders.forEach(order => {
      const hour = getHours(new Date(order.created_at));
      stats[hour].orders += 1;
      stats[hour].revenue += order.total_amount;
    });

    // Only return hours with activity or business hours (6-22)
    return Object.values(stats).filter(s => s.hour >= 6 && s.hour <= 22);
  }, [paidOrders]);

  // Day of week statistics
  const dayOfWeekStats: DayOfWeekStat[] = useMemo(() => {
    const stats: Record<number, DayOfWeekStat> = {};
    
    // Initialize all days
    for (let d = 0; d < 7; d++) {
      stats[d] = {
        day: d,
        label: DAY_LABELS[d],
        orders: 0,
        revenue: 0,
      };
    }
    
    paidOrders.forEach(order => {
      const day = getDay(new Date(order.created_at));
      stats[day].orders += 1;
      stats[day].revenue += order.total_amount;
    });

    return Object.values(stats);
  }, [paidOrders]);

  // Payment method statistics
  const paymentMethodStats: PaymentMethodStat[] = useMemo(() => {
    const stats: Record<string, PaymentMethodStat> = {};
    
    paidOrders.forEach(order => {
      const method = order.payment_method || 'midtrans';
      
      if (!stats[method]) {
        stats[method] = {
          method,
          label: PAYMENT_METHOD_LABELS[method] || method,
          orders: 0,
          revenue: 0,
          adminFee: 0,
          fill: PAYMENT_METHOD_COLORS[method] || 'hsl(200, 60%, 50%)',
        };
      }
      stats[method].orders += 1;
      stats[method].revenue += order.total_amount;
      stats[method].adminFee += order.admin_fee || 0;
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders]);

  // Total admin fees
  const totalAdminFees = useMemo(() => 
    paidOrders.reduce((sum, o) => sum + (o.admin_fee || 0), 0),
  [paidOrders]);

  return {
    dateRange,
    filteredOrders,
    paidOrders,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    pendingOrders,
    trendData,
    menuStats,
    dailyStats,
    categoryStats,
    classStats,
    hourlyStats,
    dayOfWeekStats,
    paymentMethodStats,
    totalAdminFees,
  };
}
