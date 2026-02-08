import { useState } from "react";
import { useAnnouncements, type Announcement, type AnnouncementPriority, type CreateAnnouncementData } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Megaphone, AlertCircle, Bell, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

const priorityOptions: { value: AnnouncementPriority; label: string; color: string }[] = [
  { value: "low", label: "Rendah", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Sedang", color: "bg-primary/10 text-primary" },
  { value: "high", label: "Tinggi", color: "bg-warning/10 text-warning" },
  { value: "urgent", label: "Mendesak", color: "bg-destructive/10 text-destructive" },
];

const priorityIcons: Record<AnnouncementPriority, React.ComponentType<{ className?: string }>> = {
  low: Info,
  medium: Bell,
  high: AlertTriangle,
  urgent: AlertCircle,
};

interface AnnouncementFormData {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const initialFormData: AnnouncementFormData = {
  title: "",
  content: "",
  priority: "medium",
  is_active: true,
  start_date: "",
  end_date: "",
};

export default function AdminAnnouncementsPage() {
  const { announcements, isLoading, createAnnouncement, updateAnnouncement, deleteAnnouncement, toggleActive } = useAnnouncements();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      is_active: announcement.is_active,
      start_date: announcement.start_date ? announcement.start_date.split("T")[0] : "",
      end_date: announcement.end_date ? announcement.end_date.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    
    const data: CreateAnnouncementData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
      is_active: formData.is_active,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    let success: boolean;
    if (editingAnnouncement) {
      success = await updateAnnouncement(editingAnnouncement.id, data);
    } else {
      success = await createAnnouncement(data);
    }

    setIsSubmitting(false);
    if (success) {
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingAnnouncement(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteAnnouncement(deletingId);
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await toggleActive(id, !currentStatus);
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    const option = priorityOptions.find((p) => p.value === priority);
    const Icon = priorityIcons[priority];
    return (
      <Badge className={cn("gap-1", option?.color)}>
        <Icon className="w-3 h-3" />
        {option?.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-primary" />
            Pengumuman
          </h1>
          <p className="text-muted-foreground">
            Kelola pengumuman pengambilan pesanan untuk ditampilkan di halaman utama dan dashboard
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Pengumuman
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengumuman</CardTitle>
          <CardDescription>
            Pengumuman akan ditampilkan sesuai prioritas dan tanggal aktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pengumuman</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                Buat Pengumuman Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {announcement.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={announcement.is_active}
                          onCheckedChange={() => handleToggleActive(announcement.id, announcement.is_active)}
                        />
                        <span className="text-sm">
                          {announcement.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {announcement.start_date || announcement.end_date ? (
                          <>
                            {announcement.start_date && (
                              <span>{format(new Date(announcement.start_date), "d MMM yyyy", { locale: localeId })}</span>
                            )}
                            {announcement.start_date && announcement.end_date && " - "}
                            {announcement.end_date && (
                              <span>{format(new Date(announcement.end_date), "d MMM yyyy", { locale: localeId })}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Tanpa batas</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(announcement.created_at), "d MMM yyyy", { locale: localeId })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(announcement)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingId(announcement.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                placeholder="Contoh: Pengambilan Pesanan Hari Ini"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Isi Pengumuman *</Label>
              <Textarea
                id="content"
                placeholder="Contoh: Silakan ambil pesanan di kantin pada jam 10:00 - 12:00"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: AnnouncementPriority) => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => {
                    const Icon = priorityIcons[option.value];
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai (opsional)</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Tanggal Berakhir (opsional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktifkan pengumuman</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAnnouncement ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengumuman yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
