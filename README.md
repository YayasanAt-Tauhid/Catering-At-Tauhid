# Dapoer-Attauhid Catering

Aplikasi pemesanan catering sekolah untuk Dapoer-Attauhid.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Payment**: Midtrans

## Development

### Prerequisites

- Node.js 18+ & npm
- Supabase CLI (untuk edge functions)

### Setup Lokal

```sh
# Clone repository
git clone <YOUR_GIT_URL>

# Masuk ke direktori project
cd Catering-At-Tauhid

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

### Environment Variables (Lokal)

Buat file `.env` di root project:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Midtrans - Pilih Production atau Sandbox
VITE_MIDTRANS_IS_PRODUCTION=false

# Midtrans Client Keys
VITE_MIDTRANS_CLIENT_KEY_SANDBOX=SB-Mid-client-xxxx
VITE_MIDTRANS_CLIENT_KEY_PRODUCTION=Mid-client-xxxx
```

## Deployment di Cloudflare Pages

### 1. Setup Project

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih **Pages** > **Create a project** > **Connect to Git**
3. Pilih repository GitHub Anda
4. Konfigurasi build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### 2. Environment Variables di Cloudflare

Pergi ke **Settings** > **Environment variables** dan tambahkan:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL Supabase project |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anon key |
| `VITE_MIDTRANS_IS_PRODUCTION` | `true` atau `false` | `true` = Production, `false` = Sandbox |
| `VITE_MIDTRANS_CLIENT_KEY_SANDBOX` | `SB-Mid-client-xxxx` | Client Key Sandbox |
| `VITE_MIDTRANS_CLIENT_KEY_PRODUCTION` | `Mid-client-xxxx` | Client Key Production |

> **Penting**: Setelah menambah/mengubah environment variables, Anda perlu melakukan **redeploy** agar perubahan berlaku.

### 3. Supabase Edge Functions Secrets

Environment variables untuk Supabase Edge Functions harus diatur di **Supabase Dashboard**, bukan di Cloudflare:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Pergi ke **Settings** > **Edge Functions** > **Secrets**
4. Tambahkan:

| Secret | Value | Keterangan |
|--------|-------|------------|
| `MIDTRANS_SERVER_KEY` | `SB-Mid-server-xxxx` atau `Mid-server-xxxx` | Server key sesuai mode |
| `MIDTRANS_IS_PRODUCTION` | `true` atau `false` | Harus sama dengan frontend |

## Konfigurasi Midtrans

### Mode Sandbox (Testing)

Untuk testing, set:
- `VITE_MIDTRANS_IS_PRODUCTION=false` di Cloudflare
- `MIDTRANS_IS_PRODUCTION=false` di Supabase Secrets
- Gunakan credentials dari [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)

### Mode Production (Live)

Untuk production, set:
- `VITE_MIDTRANS_IS_PRODUCTION=true` di Cloudflare
- `MIDTRANS_IS_PRODUCTION=true` di Supabase Secrets
- Gunakan credentials dari [Midtrans Production Dashboard](https://dashboard.midtrans.com/)

### Mendapatkan Credentials

1. Login ke Midtrans Dashboard (Sandbox atau Production)
2. Pergi ke **Settings** > **Access Keys**
3. Copy:
   - **Client Key** (untuk frontend)
   - **Server Key** (untuk Supabase Edge Functions)

### Konfigurasi Webhook

Webhook diperlukan untuk update status pembayaran:

1. Buka Midtrans Dashboard
2. Pergi ke **Settings** > **Configuration**
3. Pada **Payment Notification URL**, masukkan:
   ```
   https://your-project.supabase.co/functions/v1/payment-webhook
   ```
4. Pastikan **HTTP(S) Notification** diaktifkan
5. Simpan

## Production Checklist

- [ ] Set `VITE_MIDTRANS_IS_PRODUCTION=true` di Cloudflare
- [ ] Set `MIDTRANS_IS_PRODUCTION=true` di Supabase Secrets
- [ ] Masukkan Production Client Key di `VITE_MIDTRANS_CLIENT_KEY_PRODUCTION`
- [ ] Masukkan Production Server Key di `MIDTRANS_SERVER_KEY` (Supabase)
- [ ] Konfigurasi webhook URL di Midtrans Production Dashboard
- [ ] Test pembayaran dengan nominal kecil

## Struktur Project

```
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── config/         # Configuration files (Midtrans, etc.)
│   ├── context/        # React context providers
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Supabase client & types
│   ├── lib/            # Utility functions
│   └── pages/          # Page components
├── supabase/
│   └── functions/      # Edge functions (payment, webhook)
└── index.html
```

## Testing Pembayaran (Sandbox)

### Test Cards

| Card Number | CVV | Exp Date | Result |
|-------------|-----|----------|--------|
| 4811 1111 1111 1114 | 123 | Kapan saja (future) | Success |
| 4911 1111 1111 1113 | 123 | Kapan saja (future) | Denied |

### Virtual Account

Di Sandbox, pembayaran VA akan otomatis dikonfirmasi setelah beberapa detik.

## Troubleshooting

### Payment popup tidak muncul
- Cek console browser untuk error
- Pastikan `VITE_MIDTRANS_CLIENT_KEY_*` sudah diset sesuai mode
- Refresh halaman dan coba lagi

### Error "MIDTRANS_SERVER_KEY not configured"
- Pastikan secret sudah diset di Supabase Dashboard
- Cek apakah nama secret benar: `MIDTRANS_SERVER_KEY`

### Status pembayaran tidak update
- Pastikan webhook URL sudah dikonfigurasi di Midtrans Dashboard
- Cek logs di Supabase Dashboard > Edge Functions > Logs
- Pastikan `MIDTRANS_IS_PRODUCTION` sama di frontend dan backend

## Support

Untuk pertanyaan atau bantuan, hubungi tim Dapoer-Attauhid.