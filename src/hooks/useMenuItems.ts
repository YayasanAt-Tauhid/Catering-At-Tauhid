import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_available: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useMenuItems() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenuItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat menu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const addMenuItem = async (data: {
    name: string;
    description: string;
    price: number;
    category: string;
    image_url?: string;
  }) => {
    try {
      const { data: newItem, error } = await supabase
        .from('menu_items')
        .insert({
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          image_url: data.image_url || null,
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems(prev => [...prev, newItem]);
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil ditambahkan',
      });
      return newItem;
    } catch (error: any) {
      console.error('Error adding menu item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan menu',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateMenuItem = async (id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    image_url?: string;
    is_available?: boolean;
  }) => {
    try {
      const { data: updatedItem, error } = await supabase
        .from('menu_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMenuItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil diupdate',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengupdate menu',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil dihapus',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus menu',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const item = menuItems.find(m => m.id === id);
      if (!item) return false;

      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', id);

      if (error) throw error;

      setMenuItems(prev => prev.map(m =>
        m.id === id ? { ...m, is_available: !m.is_available } : m
      ));

      toast({
        title: 'Berhasil',
        description: `Menu ${!item.is_available ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      return true;
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status menu',
        variant: 'destructive',
      });
      return false;
    }
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  return {
    menuItems,
    categories,
    isLoading,
    refetch: fetchMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
  };
}
