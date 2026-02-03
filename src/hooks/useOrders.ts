import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface OrderItem {
  id: string;
  order_id?: string;
  menu_item_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item?: {
    name: string;
    image_url: string | null;
  };
}

export interface Order {
  id: string;
  user_id: string | null;
  recipient_id: string | null;
  total_amount: number;
  status: string;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  snap_token?: string | null;
  payment_url?: string | null;
  transaction_id?: string | null;
  order_code?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_class?: string | null;
  payment_method?: string | null;
  admin_fee?: number | null;
  recipient?: {
    name: string;
    class: string | null;
  };
  order_items?: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          recipient:recipients(name, class),
          order_items(
            id,
            menu_item_id,
            quantity,
            unit_price,
            subtotal,
            menu_item:menu_items(name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat pesanan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (data: {
    recipientId: string;
    deliveryDate: Date;
    items: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    if (!user) return null;

    try {
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          recipient_id: data.recipientId,
          delivery_date: format(data.deliveryDate, 'yyyy-MM-dd'),
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = data.items.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      await fetchOrders();
      return newOrder;
    } catch (error: unknown) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat pesanan',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status } : o))
      );
      return true;
    } catch (error: unknown) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status pesanan',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      // Only allow cancellation of pending orders
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'pending') {
        toast({
          title: 'Tidak Dapat Dibatalkan',
          description: 'Hanya pesanan dengan status pending yang dapat dibatalkan',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: 'failed' } : o))
      );

      toast({
        title: 'Pesanan Dibatalkan',
        description: 'Pesanan berhasil dibatalkan',
      });
      return true;
    } catch (error: unknown) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membatalkan pesanan',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getOrderById = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          recipient:recipients(name, class),
          order_items(
            id,
            menu_item_id,
            quantity,
            unit_price,
            subtotal,
            menu_item:menu_items(name, image_url)
          )
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      console.error('Error fetching order:', error);
      return null;
    }
  };

  return {
    orders,
    isLoading,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    refetch: fetchOrders,
  };
}
