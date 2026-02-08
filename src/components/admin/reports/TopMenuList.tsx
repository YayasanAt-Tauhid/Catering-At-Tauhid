import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { MenuStat } from '@/hooks/useReportsData';

interface TopMenuListProps {
  data: MenuStat[];
}

export function TopMenuList({ data }: TopMenuListProps) {
  const topItems = data.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          Menu Terlaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topItems.length > 0 ? (
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.count} porsi terjual
                    </p>
                  </div>
                </div>
                <span className="font-bold text-success">
                  Rp {item.revenue.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada data penjualan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
