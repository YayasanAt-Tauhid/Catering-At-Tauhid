import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Download, Calendar, User, Check, Package } from 'lucide-react';
import { generateInvoicePdf, generateCombinedInvoicePdf } from '@/utils/generateInvoicePdf';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/PaginationControls';

export default function InvoicesPage() {
  const { orders } = useApp();
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const paidOrders = orders.filter((o) => o.status === 'paid');
  const pagination = usePagination(paidOrders, { itemsPerPage: 10 });

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) => (checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? paidOrders.map((o) => o.id) : []);
  };

  const handleDownloadIndividual = (orderId: string) => {
    const order = paidOrders.find(o => o.id === orderId);
    if (order) {
      generateInvoicePdf(order);
      toast({ title: 'Invoice Diunduh', description: `Invoice untuk ${orderId.slice(0, 8)} sedang dibuka` });
    }
  };

  const handleDownloadCombined = () => {
    if (selectedOrders.length === 0) {
      toast({ title: 'Pilih Invoice', description: 'Pilih minimal satu invoice untuk digabungkan', variant: 'destructive' });
      return;
    }
    const selectedOrderData = paidOrders.filter(o => selectedOrders.includes(o.id));
    generateCombinedInvoicePdf(selectedOrderData);
    toast({ title: 'Invoice Gabungan Diunduh', description: `${selectedOrders.length} invoice sedang digabungkan` });
  };

  const totalSelected = selectedOrders.reduce((sum, id) => {
    const order = paidOrders.find((o) => o.id === id);
    return sum + (order?.total_amount || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Invoice</h1>
          <p className="text-muted-foreground mt-1">Kelola dan unduh invoice pesanan Anda</p>
        </div>
        {paidOrders.length > 0 && (
          <Button variant="hero" onClick={handleDownloadCombined} disabled={selectedOrders.length === 0}>
            <Download className="w-5 h-5 mr-2" />Download Gabungan ({selectedOrders.length})
          </Button>
        )}
      </div>

      {selectedOrders.length > 0 && (
        <Card variant="bordered" className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span className="font-semibold">{selectedOrders.length} invoice dipilih</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-bold text-primary">Total: Rp {totalSelected.toLocaleString('id-ID')}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrders([])}>Batalkan Pilihan</Button>
          </CardContent>
        </Card>
      )}

      {paidOrders.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-4">
              <Checkbox checked={selectedOrders.length === paidOrders.length && paidOrders.length > 0} onCheckedChange={handleSelectAll} />
              <CardTitle className="text-base font-medium">Pilih Semua ({paidOrders.length} invoice)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pagination.paginatedItems.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)} />
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold">{order.id.slice(0, 8)}...</span>
                      <Badge variant="paid">Lunas</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.recipient?.name || '-'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{order.delivery_date ? format(new Date(order.delivery_date), 'd MMM yyyy', { locale: id }) : '-'}</span>
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.order_items?.length || 0} item</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => handleDownloadIndividual(order.id)}>
                      <Download className="w-4 h-4 mr-1" />Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-6 pb-4">
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6"><FileText className="w-10 h-10 text-muted-foreground" /></div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Invoice</h3>
            <p className="text-muted-foreground text-center">Invoice akan muncul setelah Anda memiliki pesanan yang sudah dibayar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
