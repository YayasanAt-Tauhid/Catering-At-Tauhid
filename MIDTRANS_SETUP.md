# Setup Midtrans Payment Gateway

## Environment Variables

### Frontend (Cloudflare Pages)

Tambahkan environment variables berikut di **Cloudflare Pages Dashboard**:

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih project Pages Anda
3. Pergi ke **Settings** > **Environment variables**
4. Tambahkan variable berikut:

| Variable | Nilai | Keterangan |
|----------|-------|------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL Supabase project |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anon/public key |
| `VITE_MIDTRANS_CLIENT_KEY` | `SB-Mid-client-xxxx` | Midtrans Client Key |

> **Catatan**: Setelah menambah/mengubah environment variables, lakukan **redeploy** agar perubahan berlaku.

### Supabase Edge Functions

Environment variables untuk Edge Functions diatur di **Supabase Dashboard**:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Pergi ke **Settings** > **Edge Functions** > **Secrets**
4. Tambahkan:

| Secret | Nilai | Keterangan |
|--------|-------|------------|
| `MIDTRANS_SERVER_KEY` | `SB-Mid-server-xxxx` | Server Key dari Midtrans |
| `MIDTRANS_IS_PRODUCTION` | `false` | `false` untuk sandbox, `true` untuk production |

## Mendapatkan Kredensial Midtrans

### Sandbox (Testing)

1. Daftar/Login di [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Pergi ke **Settings** > **Access Keys**
3. Salin **Client Key** dan **Server Key**

### Production

1. Daftar/Login di [Midtrans Production Dashboard](https://dashboard.midtrans.com/)
2. Pergi ke **Settings** > **Access Keys**
3. Salin **Client Key** dan **Server Key**

## Konfigurasi Webhook

Webhook diperlukan agar Midtrans dapat mengirim notifikasi status pembayaran.

1. Buka Midtrans Dashboard
2. Pergi ke **Settings** > **Configuration**
3. Pada bagian **Payment Notification URL**, masukkan:
   ```
   https://your-project.supabase.co/functions/v1/payment-webhook
   ```
4. Pastikan **HTTP(S) Notification** diaktifkan
5. Simpan konfigurasi

## Update untuk Production

Ketika beralih dari Sandbox ke Production:

### 1. Update Midtrans Snap URL

Di file `index.html`, ganti URL Snap SDK:

```html
<!-- Sandbox -->
<script
    type="text/javascript"
    src="https://app.sandbox.midtrans.com/snap/snap.js"
    data-client-key="%VITE_MIDTRANS_CLIENT_KEY%"
></script>

<!-- Production -->
<script
    type="text/javascript"
    src="https://app.midtrans.com/snap/snap.js"
    data-client-key="%VITE_MIDTRANS_CLIENT_KEY%"
></script>
```

### 2. Update Environment Variables

**Di Cloudflare Pages:**
- Ganti `VITE_MIDTRANS_CLIENT_KEY` dengan Production Client Key

**Di Supabase Secrets:**
- Ganti `MIDTRANS_SERVER_KEY` dengan Production Server Key
- Set `MIDTRANS_IS_PRODUCTION` = `true`

### 3. Update Webhook URL

Pastikan webhook URL di Midtrans Production Dashboard mengarah ke:
```
https://your-project.supabase.co/functions/v1/payment-webhook
```

## Testing Pembayaran

### Sandbox Test Cards

Untuk testing di Sandbox, gunakan kartu kredit berikut:

| Card Number | CVV | Exp Date | Result |
|-------------|-----|----------|--------|
| 4811 1111 1111 1114 | 123 | Kapan saja (future) | Success |
| 4911 1111 1111 1113 | 123 | Kapan saja (future) | Denied |

### Virtual Account Testing

Untuk VA, gunakan:
- **BCA**: Transfer ke nomor VA yang diberikan
- **BNI**: Transfer ke nomor VA yang diberikan
- Dll.

Di Sandbox, pembayaran otomatis dikonfirmasi setelah beberapa detik.

## Troubleshooting

### Payment popup tidak muncul
- Pastikan `VITE_MIDTRANS_CLIENT_KEY` sudah diset dengan benar
- Pastikan Snap SDK sudah ter-load di halaman
- Cek console browser untuk error

### Webhook tidak diterima
- Pastikan URL webhook benar
- Cek apakah Edge Function sudah di-deploy
- Lihat logs di Supabase Dashboard > Edge Functions > Logs

### Status pembayaran tidak update
- Pastikan `MIDTRANS_SERVER_KEY` sudah diset di Supabase Secrets
- Pastikan webhook URL dikonfigurasi di Midtrans Dashboard
- Cek signature verification di webhook

## Referensi

- [Midtrans Documentation](https://docs.midtrans.com/)
- [Snap Integration Guide](https://docs.midtrans.com/docs/snap-integration-guide)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)