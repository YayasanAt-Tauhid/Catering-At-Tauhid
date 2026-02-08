import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Recipient {
  id: string;
  user_id: string;
  name: string;
  class: string | null;
  address: string;
  phone: string | null;
  notes: string | null;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useRecipients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipients = useCallback(async () => {
    if (!user) {
      setRecipients([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data penerima',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const addRecipient = async (data: { name: string; class: string }) => {
    if (!user) return null;

    try {
      const { data: newRecipient, error } = await supabase
        .from('recipients')
        .insert({
          user_id: user.id,
          name: data.name,
          class: data.class,
          address: data.class, // Using class as address for now
        })
        .select()
        .single();

      if (error) throw error;

      setRecipients(prev => [newRecipient, ...prev]);
      return newRecipient;
    } catch (error: any) {
      console.error('Error adding recipient:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambah penerima',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateRecipient = async (id: string, data: { name?: string; class?: string }) => {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.class) {
        updateData.class = data.class;
        updateData.address = data.class;
      }

      const { error } = await supabase
        .from('recipients')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev =>
        prev.map(r => (r.id === id ? { ...r, ...updateData } : r))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating recipient:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui penerima',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteRecipient = async (id: string) => {
    try {
      // Check if recipient has orders
      const { data: orders, error: checkError } = await supabase
        .from('orders')
        .select('id')
        .eq('recipient_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (orders && orders.length > 0) {
        return { success: false, reason: 'has_orders' };
      }

      const { error } = await supabase
        .from('recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev => prev.filter(r => r.id !== id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting recipient:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus penerima',
        variant: 'destructive',
      });
      return { success: false, reason: 'error' };
    }
  };

  const getOrderCount = async (recipientId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', recipientId);

      if (error) throw error;
      return count || 0;
    } catch {
      return 0;
    }
  };

  return {
    recipients,
    isLoading,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    getOrderCount,
    refetch: fetchRecipients,
  };
}
