import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import type { MenuStat } from '@/hooks/useReportsData';

interface CategoryPieChartProps {
  data: MenuStat[];
}

const COLORS = [
  'hsl(24, 90%, 55%)',   // primary
  'hsl(145, 45%, 45%)',  // secondary
  'hsl(200, 70%, 50%)',  // accent
  'hsl(45, 93%, 47%)',   // warning
  'hsl(280, 60%, 55%)',  // purple
  'hsl(0, 72%, 51%)',    // destructive
];

const chartConfig = {
  revenue: {
    label: 'Pendapatan',
  },
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  // Take top 5 items for pie chart
  const topItems = data.slice(0, 5).map((item, index) => ({
    name: item.name,
    value: item.revenue,
    fill: COLORS[index % COLORS.length],
  }));

  const total = topItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-secondary" />
          Distribusi Penjualan Menu
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topItems.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={topItems}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {topItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <PieChartIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada data untuk periode ini</p>
            </div>
          </div>
        )}
        
        {topItems.length > 0 && (
          <div className="mt-4 space-y-2">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="font-medium">
                  Rp {item.value.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
