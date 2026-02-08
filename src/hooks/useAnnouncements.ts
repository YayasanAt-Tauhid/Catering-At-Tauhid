import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AnnouncementPriority = "low" | "medium" | "high" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("announcements" as any)
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements((data as unknown as Announcement[]) || []);
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      // Table might not exist yet
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createAnnouncement = async (data: CreateAnnouncementData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("announcements" as any)
        .insert({
          ...data,
          created_by: user?.user?.id || null,
        } as any);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Pengumuman berhasil dibuat",
      });
      
      await fetchAnnouncements();
      return true;
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message || "Gagal membuat pengumuman",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateAnnouncement = async (id: string, data: Partial<CreateAnnouncementData>) => {
    try {
      const { error } = await supabase
        .from("announcements" as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Pengumuman berhasil diperbarui",
      });
      
      await fetchAnnouncements();
      return true;
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui pengumuman",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Pengumuman berhasil dihapus",
      });
      
      await fetchAnnouncements();
      return true;
    } catch (error: any) {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menghapus pengumuman",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateAnnouncement(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return {
    announcements,
    isLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleActive,
    refetch: fetchAnnouncements,
  };
}

// Hook for public/active announcements only
export function useActiveAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements" as any)
          .select("*")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Filter based on date range
        const filtered = ((data as unknown as Announcement[]) || []).filter((ann) => {
          const now = new Date();
          if (ann.start_date && new Date(ann.start_date) > now) return false;
          if (ann.end_date && new Date(ann.end_date) < now) return false;
          return true;
        });
        
        setAnnouncements(filtered);
      } catch (error) {
        console.error("Error fetching active announcements:", error);
        setAnnouncements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveAnnouncements();
  }, []);

  return { announcements, isLoading };
}
