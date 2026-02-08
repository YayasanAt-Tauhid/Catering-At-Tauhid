import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  trend?: number;
  showTrend?: boolean;
}

export function ReportStatCard({
  title,
  value,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  trend = 0,
  showTrend = true,
}: ReportStatCardProps) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  
  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center mb-3", iconBgClass)}>
          <Icon className={cn("w-5 h-5 lg:w-6 lg:h-6", iconColorClass)} />
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl lg:text-2xl font-bold text-foreground">{value}</p>
        
        {showTrend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-sm",
            isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
          )}>
            {isNeutral ? (
              <Minus className="w-4 h-4" />
            ) : isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>
              {isNeutral ? 'Sama' : `${Math.abs(trend).toFixed(1)}%`}
            </span>
            <span className="text-muted-foreground">vs periode lalu</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
