import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap } from 'lucide-react';
import type { ClassStat } from '@/hooks/useReportsData';

interface ClassDistributionProps {
  data: ClassStat[];
}

export function ClassDistribution({ data }: ClassDistributionProps) {
  const topClasses = data.slice(0, 8);
  const totalOrders = data.reduce((sum, c) => sum + c.orders, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-secondary" />
          Distribusi Order per Kelas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topClasses.length > 0 ? (
          <div className="space-y-3">
            {topClasses.map((item) => {
              const percentage = totalOrders > 0 ? (item.orders / totalOrders) * 100 : 0;
              
              return (
                <div key={item.className} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.className}</span>
                    <span className="text-muted-foreground">
                      {item.orders} order ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: Rp {item.revenue.toLocaleString('id-ID')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada data kelas untuk periode ini</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
