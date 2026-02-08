import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CreditCard, Wallet } from 'lucide-react';
import type { PaymentMethodStat } from '@/hooks/useReportsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentMethodChartProps {
  data: PaymentMethodStat[];
  totalAdminFees: number;
}

const chartConfig = {
  revenue: {
    label: 'Pendapatan',
  },
};

export function PaymentMethodChart({ data, totalAdminFees }: PaymentMethodChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-secondary" />
          Pendapatan per Metode Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="chart">Grafik</TabsTrigger>
              <TabsTrigger value="table">Tabel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="label" 
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    className="text-xs"
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name) => {
                          if (name === 'revenue') {
                            return `Rp ${Number(value).toLocaleString('id-ID')}`;
                          }
                          return value;
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey="revenue" 
                    radius={[0, 4, 4, 0]}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </TabsContent>
            
            <TabsContent value="table">
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {data.map((item) => (
                  <div 
                    key={item.method} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.orders} order • Fee: Rp {item.adminFee.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        Rp {item.revenue.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada data pembayaran</p>
            </div>
          </div>
        )}
        
        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Metode</p>
              <p className="font-semibold">{data.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Order</p>
              <p className="font-semibold">{totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Admin Fee</p>
              <p className="font-semibold text-warning">
                Rp {totalAdminFees.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
