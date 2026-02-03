import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfDay, isBefore } from "date-fns";
import { loadMidtransScript, midtransConfig } from "@/config/midtrans";

// Helper function to check if delivery date has passed
const isDeliveryDateExpired = (deliveryDate: string | null): boolean => {
  if (!deliveryDate) return false;
  const today = startOfDay(new Date());
  const delivery = startOfDay(new Date(deliveryDate));
  return isBefore(delivery, today);
};

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const initiatePayment = async (orderId: string) => {
    setIsProcessing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("User not authenticated");
      }

      // Check if delivery date has passed
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("delivery_date")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      if (isDeliveryDateExpired(order.delivery_date)) {
        throw new Error(
          "Tidak dapat membayar - tanggal penerimaan sudah lewat",
        );
      }

      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: { orderId, isGuest: false },
        },
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to create payment");
      }

      return {
        snapToken: data.snapToken,
        redirectUrl: data.redirectUrl,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat pembayaran";
      console.error("Payment initiation error:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateGuestPayment = async (orderId: string) => {
    setIsProcessing(true);

    try {
      console.log("Initiating guest payment for order:", orderId);

      // Check if delivery date has passed
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("delivery_date")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      if (isDeliveryDateExpired(order.delivery_date)) {
        throw new Error(
          "Tidak dapat membayar - tanggal penerimaan sudah lewat",
        );
      }

      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: { orderId, isGuest: true },
        },
      );

      console.log("Guest payment response:", data, error);

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to create guest payment");
      }

      return {
        snapToken: data.snapToken,
        redirectUrl: data.redirectUrl,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat pembayaran";
      console.error("Guest payment initiation error:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateMultiplePayment = async (orderIds: string[]) => {
    setIsProcessing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("User not authenticated");
      }

      console.log("Initiating bulk payment for orders:", orderIds);

      // Check if any delivery date has passed
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, delivery_date")
        .in("id", orderIds);

      if (ordersError) throw ordersError;

      const expiredOrders =
        orders?.filter((o) => isDeliveryDateExpired(o.delivery_date)) || [];
      if (expiredOrders.length > 0) {
        throw new Error(
          "Tidak dapat membayar - ada pesanan dengan tanggal penerimaan yang sudah lewat",
        );
      }

      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: { orderIds, isGuest: false },
        },
      );

      console.log("Bulk payment response:", data, error);

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to create bulk payment");
      }

      return {
        snapToken: data.snapToken,
        redirectUrl: data.redirectUrl,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal membuat pembayaran bulk";
      console.error("Bulk payment initiation error:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const openPaymentModal = async (
    snapToken: string,
    onSuccess?: () => void,
    onPending?: () => void,
    onError?: () => void,
  ) => {
    try {
      // Ensure Midtrans script is loaded
      await loadMidtransScript();

      if (!window.snap) {
        throw new Error("Midtrans Snap tidak tersedia");
      }

      console.log(
        `Opening Midtrans payment modal (${midtransConfig.isProduction ? "Production" : "Sandbox"})`,
      );

      window.snap.pay(snapToken, {
        onSuccess: (result: unknown) => {
          console.log("Payment success:", result);
          toast({
            title: "Pembayaran Berhasil",
            description: "Pesanan Anda telah dibayar",
          });
          onSuccess?.();
        },
        onPending: (result: unknown) => {
          console.log("Payment pending:", result);
          toast({
            title: "Pembayaran Pending",
            description: "Menunggu konfirmasi pembayaran",
          });
          onPending?.();
        },
        onError: (result: unknown) => {
          console.log("Payment error:", result);
          toast({
            title: "Pembayaran Gagal",
            description: "Terjadi kesalahan saat memproses pembayaran",
            variant: "destructive",
          });
          onError?.();
        },
        onClose: () => {
          console.log("Payment modal closed");
        },
      });
    } catch (error) {
      console.error("Failed to open payment modal:", error);
      toast({
        title: "Error",
        description:
          "Gagal membuka halaman pembayaran. Silakan refresh halaman dan coba lagi.",
        variant: "destructive",
      });
    }
  };

  return {
    initiatePayment,
    initiateGuestPayment,
    initiateMultiplePayment,
    openPaymentModal,
    isProcessing,
  };
}
