import { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { isOrderExpired } from "@/utils/orderUtils";
import { id } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Search, 
  Wallet,
  User,
  Calendar,
  Receipt,
  X,
  Printer
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CashierReceipt, CashierReceiptHandle } from "@/components/cashier/CashierReceipt";

interface OrderWithDetails {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_date: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  recipient: {
    name: string;
    class: string | null;
  } | null;
  profile: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

interface OrderItemForReceipt {
  id: string;
  order_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: {
    name: string;
  } | null;
}

interface ReceiptOrder {
  id: string;
  total_amount: number;
  delivery_date: string | null;
  recipient?: {
    name: string;
    class: string | null;
  } | null;
  guest_name?: string | null;
  guest_class?: string | null;
  order_items: OrderItemForReceipt[];
}

interface CustomerGroup {
  key: string;
  displayName: string;
  phone: string | null;
  isGuest: boolean;
  userId: string | null;
  orders: OrderWithDetails[];
  totalAmount: number;
}

export default function CashierDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [paidOrders, setPaidOrders] = useState<ReceiptOrder[]>([]);
  const [paidCustomerName, setPaidCustomerName] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<CashierReceiptHandle>(null);
  const queryClient = useQueryClient();

  const { data: pendingOrders, isLoading } = useQuery({
    queryKey: ['cashier-pending-orders'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          delivery_date,
          user_id,
          recipient_id,
          guest_name,
          guest_phone,
          guest_class
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithDetails: OrderWithDetails[] = await Promise.all(
        (orders || []).map(async (order) => {
          let recipient = null;
          let profile = null;

          if (order.recipient_id) {
            const { data } = await supabase
              .from('recipients')
              .select('name, class')
              .eq('id', order.recipient_id)
              .single();
            recipient = data;
          }

          if (order.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('user_id', order.user_id)
              .single();
            profile = data;
          }

          return {
            ...order,
            guest_name: order.guest_name,
            guest_phone: order.guest_phone,
            guest_class: order.guest_class,
            recipient,
            profile,
          };
        })
      );

      return ordersWithDetails.filter(
        (o) => !isOrderExpired({ status: o.status, delivery_date: o.delivery_date })
      );
    },
  });

  // Group orders by customer (unique by user_id for registered, by order id for guest)
  const customerGroups = useMemo(() => {
    if (!pendingOrders) return [];
    
    const groups: Record<string, CustomerGroup> = {};
    
    pendingOrders.forEach(order => {
      if (order.user_id) {
        // Registered customer - group by user_id
        const key = order.user_id;
        if (!groups[key]) {
          groups[key] = {
            key,
            displayName: order.profile?.full_name ?? 'Unknown',
            phone: order.profile?.phone ?? null,
            isGuest: false,
            userId: order.user_id,
            orders: [],
            totalAmount: 0,
          };
        }
        groups[key].orders.push(order);
        groups[key].totalAmount += order.total_amount;
      } else {
        // Guest - keep individual (key by order id)
        const key = `guest-${order.id}`;
        groups[key] = {
          key,
          displayName: order.guest_name ?? 'Tamu',
          phone: order.guest_phone ?? null,
          isGuest: true,
          userId: null,
          orders: [order],
          totalAmount: order.total_amount,
        };
      }
    });
    
    return Object.values(groups);
  }, [pendingOrders]);

  const confirmPaymentMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      // First update the orders to paid with cash payment method
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          payment_method: 'cash',
          admin_fee: 0
        })
        .in('id', orderIds);

      if (error) throw error;

      // Fetch order items for receipt
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          quantity,
          unit_price,
          subtotal,
          menu_item:menu_items(name)
        `)
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      return orderItems;
    },
    onSuccess: (orderItems) => {
      const count = selectedOrderIds.size;
      toast.success(`${count} pesanan berhasil dikonfirmasi!`);
      queryClient.invalidateQueries({ queryKey: ['cashier-pending-orders'] });
      setConfirmingPayment(false);
      
      // Prepare receipt data
      if (selectedGroup) {
        const selectedOrders = selectedGroup.orders.filter(o => selectedOrderIds.has(o.id));
        const receiptOrders: ReceiptOrder[] = selectedOrders.map(order => ({
          id: order.id,
          total_amount: order.total_amount,
          delivery_date: order.delivery_date,
          recipient: order.recipient,
          guest_name: order.guest_name,
          guest_class: order.guest_class,
          order_items: (orderItems || [])
            .filter(item => item.order_id === order.id)
            .map(item => ({
              id: item.id,
              order_id: item.order_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              menu_item: item.menu_item as { name: string } | null
            }))
        }));
        
        setPaidOrders(receiptOrders);
        setPaidCustomerName(selectedGroup.displayName);
        setPaidTotal(selectedTotal);
        setShowPrintDialog(true);
      }
      
      setSelectedGroup(null);
      setSelectedOrderIds(new Set());
      setSearchTerm("");
    },
    onError: (error) => {
      toast.error("Gagal mengkonfirmasi pembayaran: " + (error as Error).message);
    },
  });

  // Autocomplete suggestions (unique customers)
  const suggestions = useMemo(() => {
    if (!searchTerm.trim() || !customerGroups) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return customerGroups.filter((group) => {
      const matchesName = group.displayName.toLowerCase().includes(searchLower);
      const matchesOrderId = group.orders.some(o => o.id.toLowerCase().includes(searchLower));
      const matchesRecipient = group.orders.some(o => o.recipient?.name.toLowerCase().includes(searchLower));
      const matchesPhone = group.orders.some(o => o.guest_phone?.toLowerCase().includes(searchLower));
      
      return matchesName || matchesOrderId || matchesRecipient || matchesPhone;
    }).slice(0, 5);
  }, [searchTerm, customerGroups]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectGroup = (group: CustomerGroup) => {
    setSelectedGroup(group);
    setSearchTerm(group.displayName);
    setShowSuggestions(false);
    // Auto-select all orders for registered customers, single order for guests
    if (group.isGuest) {
      setSelectedOrderIds(new Set([group.orders[0].id]));
    } else {
      setSelectedOrderIds(new Set(group.orders.map(o => o.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedGroup(null);
    setSelectedOrderIds(new Set());
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleToggleOrder = (orderId: string) => {
    if (selectedGroup?.isGuest) return; // Guest orders can't be toggled
    
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const handleSelectAll = () => {
    if (!selectedGroup || selectedGroup.isGuest) return;
    setSelectedOrderIds(new Set(selectedGroup.orders.map(o => o.id)));
  };

  const handleDeselectAll = () => {
    if (!selectedGroup || selectedGroup.isGuest) return;
    setSelectedOrderIds(new Set());
  };

  const selectedTotal = useMemo(() => {
    if (!selectedGroup) return 0;
    return selectedGroup.orders
      .filter(o => selectedOrderIds.has(o.id))
      .reduce((sum, o) => sum + o.total_amount, 0);
  }, [selectedGroup, selectedOrderIds]);

  // Check if any selected order is expired (past 5 AM on delivery date)
  const hasExpiredDeliveryDate = useMemo(() => {
    if (!selectedGroup) return false;
    return selectedGroup.orders
      .filter(o => selectedOrderIds.has(o.id))
      .some(o => isOrderExpired({ status: o.status, delivery_date: o.delivery_date }));
  }, [selectedGroup, selectedOrderIds]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Konfirmasi Pembayaran Tunai</h1>
        <p className="text-muted-foreground">Konfirmasi pesanan yang dibayar tunai</p>
      </div>

      {/* Search with Autocomplete */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          placeholder="Cari berdasarkan nama customer atau ID pesanan..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedGroup(null);
            setSelectedOrderIds(new Set());
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10"
        />
        {selectedGroup && (
          <button
            onClick={handleClearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && !selectedGroup && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {suggestions.map((group) => (
              <button
                key={group.key}
                onClick={() => handleSelectGroup(group)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {group.displayName}
                    </span>
                    {group.isGuest && (
                      <Badge variant="outline" className="text-xs shrink-0">Tamu</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {group.phone && <span>{group.phone}</span>}
                    {group.phone && <span>•</span>}
                    {group.isGuest ? (
                      <span className="font-mono">{group.orders[0].id.slice(0, 8)}...</span>
                    ) : (
                      <span>{group.orders.length} pesanan pending</span>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-primary shrink-0">
                  {formatCurrency(group.totalAmount)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Menunggu Konfirmasi</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingOrders?.length ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            pesanan pending dari {customerGroups.length} customer
          </p>
        </CardContent>
      </Card>

      {/* Selected Customer Orders */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : selectedGroup ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle className="text-lg">{selectedGroup.displayName}</CardTitle>
                {selectedGroup.isGuest && (
                  <Badge variant="outline">Tamu</Badge>
                )}
              </div>
              {!selectedGroup.isGuest && selectedGroup.orders.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Pilih Semua
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                    Batal Pilih
                  </Button>
                </div>
              )}
            </div>
            {/* Customer Identity Info */}
            <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">No. HP:</span>
                <span className="font-medium">{selectedGroup.phone || '-'}</span>
              </div>
              {selectedGroup.isGuest && selectedGroup.orders[0].guest_class && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24">Kelas:</span>
                  <span className="font-medium">{selectedGroup.orders[0].guest_class}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">Total Tagihan:</span>
                <span className="font-semibold text-primary">{formatCurrency(selectedGroup.totalAmount)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedGroup.orders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleToggleOrder(order.id)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedOrderIds.has(order.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                } ${!selectedGroup.isGuest ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {!selectedGroup.isGuest && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedOrderIds.has(order.id) 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {selectedOrderIds.has(order.id) && (
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </Badge>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {order.delivery_date 
                            ? format(new Date(order.delivery_date), "d MMM yyyy", { locale: id })
                            : '-'}
                        </span>
                        {order.recipient && (
                          <>
                            <span>•</span>
                            <span>Penerima: {order.recipient.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            ))}

            {/* Total and Confirm Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedOrderIds.size} pesanan dipilih
                </p>
                <p className="text-xl font-bold text-primary">
                  Total: {formatCurrency(selectedTotal)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {hasExpiredDeliveryDate && (
                  <p className="text-sm text-destructive">
                    Tidak dapat membayar - tanggal penerimaan sudah lewat
                  </p>
                )}
                <Button 
                  onClick={() => setConfirmingPayment(true)}
                  disabled={selectedOrderIds.size === 0 || hasExpiredDeliveryDate}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Konfirmasi Bayar {selectedOrderIds.size > 1 ? `(${selectedOrderIds.size})` : ''}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Ketik dan pilih customer dari daftar autocomplete" : "Cari customer untuk melihat tagihan"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmingPayment} onOpenChange={setConfirmingPayment}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran Tunai</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Anda akan mengkonfirmasi pembayaran tunai untuk:
                <div className="mt-4 p-4 rounded-lg bg-muted space-y-2">
                  <p><strong>Customer:</strong> {selectedGroup?.displayName}</p>
                  <p><strong>Jumlah Pesanan:</strong> {selectedOrderIds.size}</p>
                  <p className="text-lg"><strong>Total:</strong> {formatCurrency(selectedTotal)}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmPaymentMutation.mutate(Array.from(selectedOrderIds))}
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Receipt Dialog */}
      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Cetak Struk Pembayaran
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Pembayaran berhasil dikonfirmasi. Apakah ingin mencetak struk?
                <div className="mt-4 p-4 rounded-lg bg-muted space-y-2">
                  <p><strong>Customer:</strong> {paidCustomerName}</p>
                  <p><strong>Jumlah Pesanan:</strong> {paidOrders.length}</p>
                  <p className="text-lg"><strong>Total:</strong> {formatCurrency(paidTotal)}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPrintDialog(false);
              setPaidOrders([]);
            }}>
              Tidak
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                receiptRef.current?.print();
                setShowPrintDialog(false);
                setPaidOrders([]);
              }}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Cetak Struk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden Receipt for Printing */}
      <CashierReceipt
        ref={receiptRef}
        customerName={paidCustomerName}
        orders={paidOrders}
        totalAmount={paidTotal}
        paymentDate={new Date()}
        isCombined={paidOrders.length > 1}
      />
    </div>
  );
}
