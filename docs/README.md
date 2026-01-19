# MakanSekolah - School Catering Order System

Platform pemesanan makanan sekolah dengan integrasi pembayaran Midtrans.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm atau pnpm
- Supabase CLI (untuk development lokal)
- Akun Midtrans (Sandbox/Production)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd makansekolah

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan kredensial Anda
```

### Environment Variables

Buat file `.env` di root project:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Midtrans (Client Key)
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
```

### Running Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | React Context, TanStack Query |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Payment | Midtrans Snap |

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── layouts/        # Dashboard & Admin layouts
│   │   └── ui/             # Reusable UI components (shadcn)
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase client & types
│   ├── pages/
│   │   ├── admin/          # Admin dashboard pages
│   │   └── dashboard/      # Customer dashboard pages
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
└── public/
```

---

## 🔧 Supabase Setup

### 1. Link Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

### 2. Run Migrations

```bash
supabase db push
```

### 3. Set Secrets

```bash
supabase secrets set MIDTRANS_SERVER_KEY=your-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy create-payment
supabase functions deploy payment-webhook
```

---

## 💳 Midtrans Setup

### 1. Get API Keys

1. Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Go to Settings → Access Keys
3. Copy Client Key dan Server Key

### 2. Configure Webhook

1. Go to Settings → Configuration
2. Set Payment Notification URL:
   ```
   https://your-project.supabase.co/functions/v1/payment-webhook
   ```

### 3. Add Snap.js (index.html)

```html
<script src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key="YOUR_CLIENT_KEY"></script>
```

---

## 🏗 Build & Deploy

### Build for Production

```bash
npm run build
```

Output akan ada di folder `dist/`

### Preview Production Build

```bash
npm run preview
```

---

## 🔑 User Roles

| Role | Access |
|------|--------|
| `customer` | Dashboard, Menu, Cart, Orders |
| `admin` | All customer + Admin Dashboard, Menu Management, Reports |

Untuk membuat admin:
```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'user-uuid';
```

---

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🐛 Troubleshooting

### Midtrans Snap not loading
- Pastikan Client Key sudah benar di `.env` dan `index.html`
- Cek browser console untuk error

### Database connection error
- Pastikan Supabase URL dan Anon Key sudah benar
- Cek RLS policies jika data tidak muncul

### Payment webhook not working
- Pastikan webhook URL sudah diset di Midtrans Dashboard
- Cek Supabase Function logs untuk error

---

## 📄 License

MIT License - lihat file LICENSE untuk detail.
