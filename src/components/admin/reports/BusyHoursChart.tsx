import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Clock, Calendar } from 'lucide-react';
import type { HourlyStat, DayOfWeekStat } from '@/hooks/useReportsData';

interface BusyHoursChartProps {
  hourlyData: HourlyStat[];
  dayOfWeekData: DayOfWeekStat[];
}

const chartConfig = {
  orders: {
    label: 'Order',
    color: 'hsl(var(--secondary))',
  },
};

export function BusyHoursChart({ hourlyData, dayOfWeekData }: BusyHoursChartProps) {
  // Find peak hour
  const peakHour = hourlyData.reduce((max, curr) => 
    curr.orders > max.orders ? curr : max, 
    { hour: 0, label: '-', orders: 0, revenue: 0 }
  );

  // Find peak day
  const peakDay = dayOfWeekData.reduce((max, curr) => 
    curr.orders > max.orders ? curr : max, 
    { day: 0, label: '-', orders: 0, revenue: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" />
          Analitik Jam Sibuk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Peak Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Jam Tersibuk</span>
            </div>
            <p className="text-2xl font-bold">{peakHour.label}</p>
            <p className="text-sm text-muted-foreground">{peakHour.orders} order</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Hari Tersibuk</span>
            </div>
            <p className="text-2xl font-bold">{peakDay.label}</p>
            <p className="text-sm text-muted-foreground">{peakDay.orders} order</p>
          </div>
        </div>

        {/* Hourly Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Order per Jam</h4>
          {hourlyData.some(h => h.orders > 0) ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  interval={2}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="orders" 
                  fill="hsl(var(--secondary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
            </div>
          )}
        </div>

        {/* Day of Week Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Order per Hari</h4>
          {dayOfWeekData.some(d => d.orders > 0) ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="orders" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
