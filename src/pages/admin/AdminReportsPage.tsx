import { useAdminOrders } from '@/hooks/useAdminOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Download, DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useReportsData, type PeriodType, type DateRange } from '@/hooks/useReportsData';
import { ReportDateFilter } from '@/components/admin/reports/ReportDateFilter';
import { ReportStatCard } from '@/components/admin/reports/ReportStatCard';
import { RevenueChart } from '@/components/admin/reports/RevenueChart';
import { CategoryPieChart } from '@/components/admin/reports/CategoryPieChart';
import { TopMenuList } from '@/components/admin/reports/TopMenuList';
import { ClassDistribution } from '@/components/admin/reports/ClassDistribution';
import { BusyHoursChart } from '@/components/admin/reports/BusyHoursChart';
import { PaymentMethodChart } from '@/components/admin/reports/PaymentMethodChart';
import { generateReportPdf } from '@/utils/generateReportPdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PaymentMethodFilter = 'all' | 'cash' | 'midtrans';

export default function AdminReportsPage() {
  const { orders, isLoading } = useAdminOrders();
  const [period, setPeriod] = useState<PeriodType>('week');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
  const [customRange, setCustomRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Filter orders by payment method
  const filteredOrders = useMemo(() => {
    if (paymentMethodFilter === 'all') return orders;
    if (paymentMethodFilter === 'cash') {
      return orders.filter(o => o.payment_method === 'cash');
    }
    // midtrans = semua selain cash (qris, bank_transfer, dll)
    return orders.filter(o => o.payment_method !== 'cash');
  }, [orders, paymentMethodFilter]);

  const {
    dateRange,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    pendingOrders,
    trendData,
    menuStats,
    dailyStats,
    classStats,
    hourlyStats,
    dayOfWeekStats,
    paymentMethodStats,
    totalAdminFees,
  } = useReportsData(filteredOrders, period, customRange);

  const handleExport = () => {
    generateReportPdf({
      dateRange,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      pendingOrders,
      trendData,
      menuStats,
      dailyStats,
      classStats,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground mt-1">Analisis performa penjualan</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={paymentMethodFilter} onValueChange={(v) => setPaymentMethodFilter(v as PaymentMethodFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Metode Bayar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="cash">Tunai</SelectItem>
              <SelectItem value="midtrans">Online</SelectItem>
            </SelectContent>
          </Select>
          <ReportDateFilter
            period={period}
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
          <Button onClick={handleExport}>
            <Download className="w-5 h-5 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportStatCard
          title="Total Pendapatan"
          value={`Rp ${totalRevenue.toLocaleString('id-ID')}`}
          icon={DollarSign}
          iconBgClass="bg-success/10"
          iconColorClass="text-success"
          trend={trendData.revenueChange}
        />
        <ReportStatCard
          title="Total Order"
          value={totalOrders.toString()}
          icon={ShoppingBag}
          iconBgClass="bg-primary/10"
          iconColorClass="text-primary"
          trend={trendData.ordersChange}
        />
        <ReportStatCard
          title="Rata-rata Order"
          value={`Rp ${averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          iconBgClass="bg-secondary/10"
          iconColorClass="text-secondary"
          showTrend={false}
        />
        <ReportStatCard
          title="Pending Order"
          value={pendingOrders.toString()}
          icon={Users}
          iconBgClass="bg-warning/10"
          iconColorClass="text-warning"
          showTrend={false}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart data={dailyStats} />
        <CategoryPieChart data={menuStats} />
      </div>

      {/* Charts Row 2 - Payment Methods & Top Menu */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PaymentMethodChart data={paymentMethodStats} totalAdminFees={totalAdminFees} />
        <TopMenuList data={menuStats} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ClassDistribution data={classStats} />
        <BusyHoursChart hourlyData={hourlyStats} dayOfWeekData={dayOfWeekStats} />
      </div>
    </div>
  );
}
