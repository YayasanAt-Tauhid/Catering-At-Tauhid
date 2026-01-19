import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, CalendarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/PaginationControls';

interface Holiday {
  id: string;
  date: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function AdminHolidaysPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [holidayName, setHolidayName] = useState('');
  const [description, setDescription] = useState('');

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
  });

  const addHolidayMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !holidayName.trim()) {
        throw new Error('Tanggal dan nama libur harus diisi');
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { error } = await supabase.from('holidays').insert({
        date: dateStr,
        name: holidayName.trim(),
        description: description.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({ title: 'Berhasil', description: 'Tanggal libur berhasil ditambahkan' });
      setIsDialogOpen(false);
      setSelectedDate(undefined);
      setHolidayName('');
      setDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate')
          ? 'Tanggal ini sudah ditandai sebagai libur'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({ title: 'Berhasil', description: 'Tanggal libur berhasil dihapus' });
    },
    onError: () => {
      toast({ title: 'Gagal', description: 'Gagal menghapus tanggal libur', variant: 'destructive' });
    },
  });

  const upcomingHolidays = holidays.filter(
    (h) => new Date(h.date) >= new Date(new Date().toDateString())
  );
  const pastHolidays = holidays.filter(
    (h) => new Date(h.date) < new Date(new Date().toDateString())
  );

  const upcomingPagination = usePagination(upcomingHolidays, { itemsPerPage: 10 });
  const pastPagination = usePagination(pastHolidays, { itemsPerPage: 10 });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Kelola Hari Libur</h1>
          <p className="text-muted-foreground mt-1">
            Tambahkan tanggal yang tidak tersedia untuk pengiriman
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Libur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Tanggal Libur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })
                        : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Libur</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Hari Raya Idul Fitri"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Keterangan (Opsional)</Label>
                <Input
                  id="description"
                  placeholder="Keterangan tambahan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => addHolidayMutation.mutate()}
                disabled={!selectedDate || !holidayName.trim() || addHolidayMutation.isPending}
              >
                {addHolidayMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Holidays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-destructive" />
            Hari Libur Mendatang ({upcomingHolidays.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Memuat...</p>
          ) : upcomingHolidays.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada tanggal libur yang ditambahkan
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPagination.paginatedItems.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        {format(new Date(holiday.date), 'EEEE, d MMMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {holiday.description || '-'}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Tanggal Libur?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tanggal ini akan tersedia kembali untuk pemesanan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={upcomingPagination.currentPage}
                totalPages={upcomingPagination.totalPages}
                onPageChange={upcomingPagination.goToPage}
                totalItems={upcomingPagination.totalItems}
                startIndex={upcomingPagination.startIndex}
                endIndex={upcomingPagination.endIndex}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Past Holidays */}
      {pastHolidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Hari Libur Sebelumnya ({pastHolidays.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastPagination.paginatedItems.map((holiday) => (
                  <TableRow key={holiday.id} className="opacity-60">
                    <TableCell>
                      {format(new Date(holiday.date), 'd MMMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pastHolidays.length > 0 && (
              <PaginationControls
                currentPage={pastPagination.currentPage}
                totalPages={pastPagination.totalPages}
                onPageChange={pastPagination.goToPage}
                totalItems={pastPagination.totalItems}
                startIndex={pastPagination.startIndex}
                endIndex={pastPagination.endIndex}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
