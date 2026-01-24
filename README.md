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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
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

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (Supabase anon key) |
| `VITE_MIDTRANS_CLIENT_KEY` | `SB-Mid-client-xxxx` (Sandbox) atau `Mid-client-xxxx` (Production) |

> **Penting**: Setelah menambah/mengubah environment variables, Anda perlu melakukan **redeploy** agar perubahan berlaku.

### 3. Supabase Edge Functions Secrets

Environment variables untuk Supabase Edge Functions harus diatur di **Supabase Dashboard**, bukan di Cloudflare:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Pergi ke **Settings** > **Edge Functions** > **Secrets**
4. Tambahkan:
   - `MIDTRANS_SERVER_KEY` = Server key dari Midtrans Dashboard
   - `MIDTRANS_IS_PRODUCTION` = `false` (sandbox) atau `true` (production)

## Kredensial yang Dibutuhkan

### Supabase
- **URL**: Dapat dari Supabase Dashboard > Settings > API
- **Anon Key**: Dapat dari Supabase Dashboard > Settings > API

### Midtrans
- **Client Key**: Dapat dari [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/) > Settings > Access Keys
- **Server Key**: Dapat dari Midtrans Dashboard > Settings > Access Keys

> Untuk production, gunakan kredensial dari [Midtrans Production Dashboard](https://dashboard.midtrans.com/)

## Production Checklist

- [ ] Ganti Supabase credentials ke project production
- [ ] Ganti Midtrans credentials dari Sandbox ke Production
- [ ] Update Midtrans Snap URL di `index.html` dari `sandbox` ke production:
  ```html
  <!-- Sandbox -->
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  
  <!-- Production -->
  src="https://app.midtrans.com/snap/snap.js"
  ```
- [ ] Set `MIDTRANS_IS_PRODUCTION=true` di Supabase Secrets
- [ ] Konfigurasi webhook URL di Midtrans Dashboard

## Struktur Project

```
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Supabase client & types
│   ├── lib/            # Utility functions
│   └── pages/          # Page components
├── supabase/
│   └── functions/      # Edge functions (payment, webhook)
└── index.html
```

## Support

Untuk pertanyaan atau bantuan, hubungi tim Dapoer-Attauhid.