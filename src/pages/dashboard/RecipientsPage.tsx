import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Plus, Edit, Trash2, GraduationCap, User, Loader2 } from 'lucide-react';
import { Recipient } from '@/hooks/useRecipients';

export default function RecipientsPage() {
  const { recipients, recipientsLoading, addRecipient, updateRecipient, deleteRecipient, getOrderCount } = useApp();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [formData, setFormData] = useState({ name: '', class: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  // Fetch order counts for all recipients
  useEffect(() => {
    const fetchOrderCounts = async () => {
      const counts: Record<string, number> = {};
      for (const recipient of recipients) {
        counts[recipient.id] = await getOrderCount(recipient.id);
      }
      setOrderCounts(counts);
    };
    if (recipients.length > 0) {
      fetchOrderCounts();
    }
  }, [recipients, getOrderCount]);

  const handleAdd = async () => {
    if (!formData.name || !formData.class) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await addRecipient({ name: formData.name, class: formData.class });
    setIsSubmitting(false);

    if (result) {
      toast({
        title: 'Berhasil',
        description: 'Penerima baru berhasil ditambahkan',
      });
      setFormData({ name: '', class: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingRecipient || !formData.name || !formData.class) return;

    setIsSubmitting(true);
    const success = await updateRecipient(editingRecipient.id, {
      name: formData.name,
      class: formData.class,
    });
    setIsSubmitting(false);

    if (success) {
      toast({
        title: 'Berhasil',
        description: 'Data penerima berhasil diperbarui',
      });
      setEditingRecipient(null);
      setFormData({ name: '', class: '' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteRecipient(id);
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Penerima berhasil dihapus',
      });
    } else if (result.reason === 'has_orders') {
      toast({
        title: 'Gagal',
        description: 'Penerima tidak bisa dihapus karena memiliki riwayat pesanan',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setFormData({ name: recipient.name, class: recipient.class || '' });
  };

  if (recipientsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Kelola Penerima</h1>
          <p className="text-muted-foreground mt-1">Kelola data anak penerima makanan</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-5 h-5 mr-2" />
              Tambah Penerima
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Penerima Baru</DialogTitle>
              <DialogDescription>
                Masukkan data anak yang akan menerima pesanan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Nama Anak</Label>
                <Input
                  id="add-name"
                  placeholder="Contoh: Ahmad Rizki"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-class">Kelas / Lokasi</Label>
                <Input
                  id="add-class"
                  placeholder="Contoh: Kelas 3A"
                  value={formData.class}
                  onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recipients Grid */}
      {recipients.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipients.map((recipient) => {
            const orderCount = orderCounts[recipient.id] || 0;
            return (
              <Card key={recipient.id} variant="interactive">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
                      <User className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{recipient.name}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm">{recipient.class || '-'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{orderCount} pesanan</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Dialog
                      open={editingRecipient?.id === recipient.id}
                      onOpenChange={(open) => {
                        if (!open) setEditingRecipient(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(recipient)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Penerima</DialogTitle>
                          <DialogDescription>Perbarui data penerima</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nama Anak</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-class">Kelas / Lokasi</Label>
                            <Input
                              id="edit-class"
                              value={formData.class}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, class: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingRecipient(null)}>
                            Batal
                          </Button>
                          <Button onClick={handleUpdate} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Simpan
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={orderCount > 0}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Penerima?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Data penerima "{recipient.name}"
                            akan dihapus permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(recipient.id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Penerima</h3>
            <p className="text-muted-foreground text-center mb-6">
              Tambahkan data anak yang akan menerima pesanan makanan
            </p>
            <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Tambah Penerima Pertama
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
