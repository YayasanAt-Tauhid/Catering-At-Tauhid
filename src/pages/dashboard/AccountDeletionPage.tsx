import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Download, Shield, Trash2, XCircle, Loader2,
} from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface DataSummary {
  profile: { name: string | null; phone: string | null } | null;
  email: string;
  orderCount: number;
  recipientCount: number;
}

const STEPS = [
  { title: 'Peringatan', icon: AlertTriangle },
  { title: 'Data Anda', icon: Download },
  { title: 'Alasan', icon: Shield },
  { title: 'Konfirmasi', icon: Trash2 },
];

const REASONS = [
  'Tidak lagi membutuhkan layanan',
  'Kekhawatiran privasi',
  'Beralih ke layanan lain',
  'Terlalu banyak notifikasi',
  'Lainnya',
];

export default function AccountDeletionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [deletionResult, setDeletionResult] = useState<any>(null);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // Check existing request
      const { data: requests } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) {
        setExistingRequest(requests[0]);
      }

      // Get data summary
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'get_data_summary' },
      });
      if (error) throw error;
      setDataSummary(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!passwordInput) {
      toast({ title: 'Error', description: 'Masukkan password untuk konfirmasi', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordInput,
      });
      if (signInError) {
        toast({ title: 'Error', description: 'Password salah', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'request_deletion', reason, reasonDetail },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDeletionResult(data.request);
      setShowFinalDialog(false);
      setStep(4); // success step
      toast({ title: 'Permintaan Diterima', description: 'Permintaan penghapusan akun telah diproses' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!existingRequest) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'cancel_deletion', requestId: existingRequest.id },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setExistingRequest(null);
      toast({ title: 'Dibatalkan', description: 'Permintaan penghapusan akun telah dibatalkan' });
      navigate('/dashboard/settings');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const dataRetentionTable = [
    { type: 'Nama & Email', deleted: true, retention: 'Dihapus segera' },
    { type: 'Nomor Telepon', deleted: true, retention: 'Dihapus segera' },
    { type: 'Alamat Penerima', deleted: true, retention: 'Dihapus segera' },
    { type: 'Preferensi Akun', deleted: true, retention: 'Dihapus segera' },
    { type: 'Riwayat Pesanan', deleted: false, retention: 'Dianonimkan, disimpan 7 tahun (pajak)' },
    { type: 'Data Pembayaran', deleted: false, retention: 'Dianonimkan, disimpan 7 tahun (audit)' },
  ];

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Existing pending request view
  if (existingRequest) {
    const cancelBefore = new Date(existingRequest.cancel_before);
    const canCancel = new Date() < cancelBefore;

    return (
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard/settings')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pengaturan
        </Button>

        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Permintaan Penghapusan Aktif
            </CardTitle>
            <CardDescription>
              Akun Anda dijadwalkan untuk dihapus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold text-warning">Menunggu Penghapusan</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Diminta pada</span>
                <span className="font-medium">{format(new Date(existingRequest.requested_at), 'd MMMM yyyy, HH:mm', { locale: localeId })}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Batas pembatalan</span>
                <span className="font-medium">{format(cancelBefore, 'd MMMM yyyy, HH:mm', { locale: localeId })}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Data dianonimkan</span>
                <span className="font-medium">{format(new Date(existingRequest.anonymize_at), 'd MMMM yyyy', { locale: localeId })}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Akun dihapus permanen</span>
                <span className="font-medium">{format(new Date(existingRequest.delete_at), 'd MMMM yyyy', { locale: localeId })}</span>
              </div>
            </div>

            {canCancel && (
              <Button
                variant="outline"
                onClick={handleCancelDeletion}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Batalkan Penghapusan Akun
              </Button>
            )}

            {!canCancel && (
              <p className="text-sm text-destructive text-center">
                Batas waktu pembatalan telah lewat. Silakan hubungi support untuk bantuan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success view
  if (step === 4 && deletionResult) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold">Permintaan Diterima</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Permintaan penghapusan akun Anda telah diproses. Anda masih bisa membatalkan dalam 72 jam ke depan.
            </p>
            <div className="grid gap-2 text-sm max-w-sm mx-auto">
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">ID Permintaan</span>
                <span className="font-mono text-xs">{deletionResult.id?.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Batas pembatalan</span>
                <span className="font-medium">{format(new Date(deletionResult.cancel_before), 'd MMM yyyy, HH:mm', { locale: localeId })}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                <span className="text-muted-foreground">Akun dihapus</span>
                <span className="font-medium">{format(new Date(deletionResult.delete_at), 'd MMM yyyy', { locale: localeId })}</span>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Button onClick={() => navigate('/dashboard/settings')} className="w-full max-w-xs">
                Kembali ke Pengaturan
              </Button>
              <p className="text-xs text-muted-foreground">
                Butuh bantuan? Hubungi <a href="https://wa.me/6285163566502" className="text-primary underline">WhatsApp Support</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Button variant="ghost" onClick={() => navigate('/dashboard/settings')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Pengaturan
      </Button>

      {/* Step Indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              i === step ? 'bg-primary text-primary-foreground' :
              i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Warnings */}
      {step === 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Peringatan Penghapusan Akun
            </CardTitle>
            <CardDescription>Harap baca dengan seksama sebelum melanjutkan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
              <h4 className="font-semibold text-destructive">Konsekuensi penghapusan akun:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span>Semua data profil, alamat, dan preferensi akan <strong>dihapus permanen</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span>Anda tidak akan bisa login kembali dengan akun ini</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span>Pesanan yang sedang berjalan akan tetap diproses</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-muted space-y-3">
              <h4 className="font-semibold">Proses penghapusan:</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Akun ditandai "menunggu penghapusan" dengan masa tenggang <strong>30 hari</strong></li>
                <li>Anda bisa membatalkan dalam <strong>72 jam pertama</strong></li>
                <li>Setelah 7 hari, data pribadi akan dianonimkan</li>
                <li>Setelah 30 hari, akun dihapus permanen dari sistem</li>
              </ol>
            </div>

            <Button onClick={() => setStep(1)} className="w-full">
              Saya Mengerti, Lanjutkan <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Data Summary */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Ringkasan Data Anda
            </CardTitle>
            <CardDescription>Data yang akan dihapus dan yang dipertahankan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataSummary && (
              <div className="grid gap-2 text-sm mb-4">
                <div className="flex justify-between p-3 rounded-lg bg-muted">
                  <span>Nama</span>
                  <span className="font-medium">{dataSummary.profile?.name || '-'}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted">
                  <span>Email</span>
                  <span className="font-medium">{dataSummary.email}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted">
                  <span>Jumlah Pesanan</span>
                  <span className="font-medium">{dataSummary.orderCount} pesanan</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted">
                  <span>Alamat Penerima</span>
                  <span className="font-medium">{dataSummary.recipientCount} alamat</span>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Data</TableHead>
                  <TableHead className="text-center">Dihapus?</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataRetentionTable.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell className="text-center">
                      {row.deleted ? (
                        <CheckCircle2 className="w-4 h-4 text-destructive mx-auto" />
                      ) : (
                        <Shield className="w-4 h-4 text-warning mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.retention}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Lanjutkan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Reason & Confirmation */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Alasan & Konfirmasi
            </CardTitle>
            <CardDescription>Bantu kami meningkatkan layanan (opsional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan penghapusan (opsional)</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reason === 'Lainnya' && (
              <div className="space-y-2">
                <Label>Detail alasan</Label>
                <Textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="Ceritakan lebih lanjut..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label htmlFor="confirm" className="text-sm cursor-pointer leading-relaxed">
                Saya memahami bahwa akun saya akan dihapus secara permanen setelah 30 hari dan data pribadi saya akan dianonimkan setelah 7 hari.
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!confirmed}
                className="flex-1"
              >
                Lanjutkan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Password Verification */}
      {step === 3 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Konfirmasi Akhir
            </CardTitle>
            <CardDescription>Masukkan password Anda untuk melanjutkan penghapusan akun</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password Anda"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowFinalDialog(true)}
                disabled={!passwordInput}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Akun Saya
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Confirmation Dialog */}
      <Dialog open={showFinalDialog} onOpenChange={setShowFinalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Hapus Akun Anda?
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan setelah 72 jam. Akun Anda akan dihapus permanen dalam 30 hari.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-destructive/5 text-sm space-y-1">
            <p>✓ Data pribadi dihapus dalam 7 hari</p>
            <p>✓ Akun dihapus permanen dalam 30 hari</p>
            <p>✓ Pembatalan bisa dilakukan dalam 72 jam</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowFinalDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleRequestDeletion} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Ya, Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
