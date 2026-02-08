import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PeriodType, DateRange } from '@/hooks/useReportsData';

interface ReportDateFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
}

export function ReportDateFilter({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: ReportDateFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePeriodChange = (value: string) => {
    onPeriodChange(value as PeriodType);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hari Ini</SelectItem>
          <SelectItem value="week">Minggu Ini</SelectItem>
          <SelectItem value="month">Bulan Ini</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {period === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !customRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange.from ? (
                customRange.to ? (
                  <>
                    {format(customRange.from, "d MMM", { locale: id })} -{" "}
                    {format(customRange.to, "d MMM yyyy", { locale: id })}
                  </>
                ) : (
                  format(customRange.from, "d MMM yyyy", { locale: id })
                )
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange.from}
              selected={{ from: customRange.from, to: customRange.to }}
              onSelect={(range) => {
                onCustomRangeChange({
                  from: range?.from,
                  to: range?.to,
                });
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
