import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePayment } from "@/hooks/usePayment";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Search,
  UtensilsCrossed,
  Calendar,
  User,
  Phone,
  School,
  Package,
  Loader2,
  AlertCircle,
  CreditCard,
  ExternalLink,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateGuestInvoicePdf } from "@/utils/generateInvoicePdf";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: {
    name: string;
    image_url: string | null;
  } | null;
}

interface OrderData {
  id: string;
  order_code: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  delivery_date: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  snap_token: string | null;
  payment_url: string | null;
  user_id: string | null;
  order_items: OrderItem[];
}

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Menunggu Pembayaran", variant: "secondary" },
  confirmed: { label: "Dikonfirmasi", variant: "default" },
  paid: { label: "Lunas", variant: "default" },
  processing: { label: "Diproses", variant: "default" },
  completed: { label: "Selesai", variant: "default" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "destructive" },
  failed: { label: "Gagal", variant: "destructive" },
};

export default function TrackOrderPage() {
  const { toast } = useToast();
  const { initiateGuestPayment, openPaymentModal, isProcessing } = usePayment();
  const [orderCode, setOrderCode] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!orderCode.trim()) {
      toast({
        title: "Kode Pesanan Kosong",
        description: "Silakan masukkan kode pesanan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          guest_name,
          guest_phone,
          guest_class,
          delivery_date,
          total_amount,
          status,
          created_at,
          snap_token,
          payment_url,
          user_id,
          order_items(
            id,
            quantity,
            unit_price,
            subtotal,
            menu_item:menu_items(name, image_url)
          )
        `,
        )
        .eq("order_code", orderCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error searching order:", error);
      toast({
        title: "Error",
        description: "Gagal mencari pesanan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    // Only allow guest order payment from this page
    if (order.user_id !== null) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membayar pesanan ini",
        variant: "destructive",
      });
      return;
    }

    // If we already have a snap token, use it directly
    if (order.snap_token) {
      openPaymentModal(
        order.snap_token,
        () => {
          // On success - refresh the order
          handleSearch();
        },
        () => {
          // On pending
          handleSearch();
        },
      );
      return;
    }

    // Otherwise, initiate a new payment
    const paymentData = await initiateGuestPayment(order.id);
    if (paymentData?.snapToken) {
      // Update local state with new token
      setOrder((prev) =>
        prev ? { ...prev, snap_token: paymentData.snapToken } : null,
      );

      openPaymentModal(
        paymentData.snapToken,
        () => {
          handleSearch();
        },
        () => {
          handleSearch();
        },
      );
    }
  };

  const getStatusInfo = (status: string) => {
    return (
      statusLabels[status] || { label: status, variant: "secondary" as const }
    );
  };

  const isPending = order?.status === "pending";
  const isPaid = order?.status === "paid" || order?.status === "confirmed";
  const isGuestOrder = order?.user_id === null;

  return (
    <div className="min-h-screen gradient-warm">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Dapoer-Attauhid</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero">Daftar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Search Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Lacak Pesanan
            </h1>
            <p className="text-muted-foreground">
              Masukkan kode pesanan untuk melihat status
            </p>
          </div>

          {/* Search Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Contoh: ORD-ABC12345"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  variant="hero"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && !isLoading && (
            <>
              {order ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Payment Action - Only show for pending guest orders */}
                  {isPending && isGuestOrder && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <CreditCard className="w-5 h-5" />
                            <span className="font-semibold">
                              Lakukan Pembayaran
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total:{" "}
                            <span className="font-bold text-foreground">
                              Rp {order.total_amount.toLocaleString("id-ID")}
                            </span>
                          </p>
                          <Button
                            variant="hero"
                            size="lg"
                            className="w-full"
                            onClick={handlePayment}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Bayar Sekarang
                              </>
                            )}
                          </Button>

                          {order.payment_url && (
                            <a
                              href={order.payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                            >
                              Atau buka halaman pembayaran
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Detail Pesanan
                        </CardTitle>
                        <Badge variant={getStatusInfo(order.status).variant}>
                          {getStatusInfo(order.status).label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Order Code */}
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          Kode Pesanan
                        </p>
                        <p className="text-xl font-bold font-mono text-primary">
                          {order.order_code}
                        </p>
                      </div>

                      {/* Guest Info */}
                      <div className="space-y-2">
                        {order.guest_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Nama:</span>
                            <span className="font-medium">
                              {order.guest_name}
                            </span>
                          </div>
                        )}
                        {order.guest_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              No. HP:
                            </span>
                            <span className="font-medium">
                              {order.guest_phone}
                            </span>
                          </div>
                        )}
                        {order.guest_class && (
                          <div className="flex items-center gap-2 text-sm">
                            <School className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Kelas:
                            </span>
                            <span className="font-medium">
                              {order.guest_class}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Tanggal Pengiriman:
                          </span>
                          <span className="font-medium">
                            {order.delivery_date
                              ? format(
                                  new Date(order.delivery_date),
                                  "EEEE, d MMMM yyyy",
                                  { locale: id },
                                )
                              : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-2">
                          Item Pesanan:
                        </p>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {item.menu_item?.name || "Menu tidak tersedia"}{" "}
                                x{item.quantity}
                              </span>
                              <span>
                                Rp {item.subtotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Pembayaran</span>
                          <span className="text-xl font-bold text-primary">
                            Rp {order.total_amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      {/* Download Invoice Button */}
                      {isPaid && isGuestOrder && (
                        <div className="border-t border-border pt-4">
                          <Button
                            variant="hero"
                            className="w-full"
                            onClick={() => generateGuestInvoicePdf(order)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Invoice PDF
                          </Button>
                        </div>
                      )}

                      {/* Order Time */}
                      <div className="text-sm text-muted-foreground text-center">
                        Pesanan dibuat:{" "}
                        {format(
                          new Date(order.created_at),
                          "d MMMM yyyy, HH:mm",
                          { locale: id },
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="animate-fade-in">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Pesanan Tidak Ditemukan
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Pastikan kode pesanan yang Anda masukkan benar
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Guest Order CTA */}
          <div className="text-center pt-4">
            <p className="text-muted-foreground mb-3">Belum punya pesanan?</p>
            <Link to="/guest/menu">
              <Button variant="outline">Pesan Sekarang</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
