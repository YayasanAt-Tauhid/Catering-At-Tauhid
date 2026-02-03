import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  recipient_count: number;
  order_count: number;
  total_spent: number;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // For each profile, get their email from auth and stats
      const usersWithStats: AdminUser[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get recipient count
          const { count: recipientCount } = await supabase
            .from('recipients')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          // Get orders stats
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, status')
            .eq('user_id', profile.user_id);

          const paidOrders = orders?.filter(o => o.status === 'paid') || [];
          const totalSpent = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name || 'Unknown',
            email: '', // Will be populated if we have access
            phone: profile.phone,
            role: profile.role || 'user',
            created_at: profile.created_at,
            recipient_count: recipientCount || 0,
            order_count: orders?.length || 0,
            total_spent: totalSpent,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}
