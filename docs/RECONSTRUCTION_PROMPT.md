# RECONSTRUCTION_PROMPT.md

## Deskripsi Umum Aplikasi

**MakanSekolah (KidEats)** adalah aplikasi web untuk pemesanan makanan/katering sekolah. Platform ini memungkinkan orang tua untuk memesan makanan bagi anak-anak mereka di sekolah dengan fitur pembayaran online terintegrasi Midtrans.

---

## 1. Use Cases Utama

### 1.1 Untuk Orang Tua (Customer)
- **Registrasi & Login**: Mendaftar akun baru dan login menggunakan email/password
- **Kelola Penerima (Anak)**: Menambah, mengedit, dan menghapus data anak sebagai penerima makanan
- **Lihat Menu**: Melihat daftar menu makanan yang tersedia berdasarkan kategori
- **Keranjang Belanja**: Menambah menu ke keranjang, mengubah jumlah, dan menghapus item
- **Checkout**: Memilih penerima, tanggal pengiriman, dan melakukan pemesanan
- **Pembayaran**: Membayar pesanan via Midtrans (berbagai metode pembayaran)
- **Riwayat Pesanan**: Melihat status dan detail pesanan yang sudah dibuat
- **Invoice**: Melihat dan mengelola invoice pesanan

### 1.2 Untuk Admin
- **Dashboard**: Melihat ringkasan pesanan hari ini, pendapatan, dan statistik
- **Kelola Menu**: CRUD menu makanan (nama, harga, kategori, gambar, ketersediaan)
- **Kelola Pesanan**: Melihat semua pesanan, filter berdasarkan status/tanggal, update status
- **Kelola User**: Melihat daftar user terdaftar
- **Laporan**: Statistik penjualan, menu terlaris, pendapatan harian
- **Keuangan**: Riwayat transaksi, laporan pendapatan

---

## 2. Alur Bisnis (Business Flow)

### 2.1 Alur Pemesanan
```
1. User login → Dashboard
2. User lihat menu → Tambah ke keranjang
3. User buka keranjang → Review item
4. User checkout → Pilih penerima + tanggal
5. Sistem buat order (status: pending)
6. User bayar via Midtrans
7. Webhook update status → paid/failed/expired
8. Order selesai
```

### 2.2 Aturan Pemesanan
- Batas waktu pemesanan: **05:00 pagi** hari yang sama
- Jika lewat jam 05:00, pesanan minimal untuk **hari berikutnya**
- Maksimal pemesanan: **7 hari ke depan**
- Order tidak bisa diubah setelah pembayaran

---

## 3. Fitur Detail

### 3.1 Autentikasi
- Email/password authentication via Supabase Auth
- Auto-create profile saat signup
- Session persistence dengan localStorage
- Protected routes untuk dashboard

### 3.2 Manajemen Penerima
- Field: nama, kelas, alamat (opsional)
- Validasi: tidak bisa hapus penerima yang sudah punya order
- Relasi: satu user bisa punya banyak penerima

### 3.3 Menu
- Kategori dinamis dari data menu
- Toggle ketersediaan (available/unavailable)
- Gambar menu (URL)
- Harga dalam IDR

### 3.4 Keranjang
- Persist ke localStorage
- Real-time total calculation
- Quantity adjustment

### 3.5 Pembayaran (Midtrans)
- Snap popup payment
- Multiple payment methods (Bank Transfer, E-Wallet, dll)
- Webhook untuk update status otomatis
- Signature verification untuk keamanan

---

## 4. Database Schema

### 4.1 Tables

#### `profiles`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- full_name: TEXT
- phone: TEXT
- role: TEXT ('customer' | 'admin')
- created_at, updated_at: TIMESTAMPTZ
```

#### `recipients`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- name: TEXT
- class: TEXT
- phone: TEXT
- address: TEXT
- notes: TEXT
- is_default: BOOLEAN
- created_at, updated_at: TIMESTAMPTZ
```

#### `menu_items`
```sql
- id: UUID (PK)
- name: TEXT
- description: TEXT
- price: DECIMAL(10,2)
- category: TEXT
- image_url: TEXT
- is_available: BOOLEAN
- created_at, updated_at: TIMESTAMPTZ
```

#### `orders`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- recipient_id: UUID (FK → recipients)
- status: TEXT ('pending' | 'paid' | 'failed' | 'expired' | ...)
- total_amount: DECIMAL(10,2)
- delivery_date: DATE
- notes: TEXT
- snap_token: TEXT (Midtrans)
- payment_url: TEXT (Midtrans)
- transaction_id: TEXT (Midtrans)
- created_at, updated_at: TIMESTAMPTZ
```

#### `order_items`
```sql
- id: UUID (PK)
- order_id: UUID (FK → orders)
- menu_item_id: UUID (FK → menu_items)
- quantity: INTEGER
- unit_price: DECIMAL(10,2)
- subtotal: DECIMAL(10,2)
- created_at: TIMESTAMPTZ
```

---

## 5. API & Edge Functions

### 5.1 create-payment
**Purpose**: Membuat transaksi pembayaran Midtrans

**Input**:
```json
{ "orderId": "uuid" }
```

**Output**:
```json
{
  "success": true,
  "snapToken": "string",
  "redirectUrl": "string"
}
```

### 5.2 payment-webhook
**Purpose**: Menerima notifikasi pembayaran dari Midtrans

**Process**:
1. Verify signature SHA-512
2. Parse transaction status
3. Update order status di database

---

## 6. Struktur Folder

```
src/
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── AdminLayout.tsx
│   └── ui/              # Shadcn components
├── context/
│   ├── AppContext.tsx   # Global state (menu, cart, orders)
│   └── AuthContext.tsx  # Authentication state
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useMenuItems.ts
│   ├── useOrders.ts
│   ├── usePayment.ts
│   └── useRecipients.ts
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── pages/
│   ├── admin/           # Admin pages
│   └── dashboard/       # Customer pages
├── types/
│   └── index.ts
└── App.tsx

supabase/
├── functions/
│   ├── create-payment/
│   └── payment-webhook/
└── migrations/
```

---

## 7. Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + TanStack Query
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod
- **Date Handling**: date-fns

### Backend
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Edge Functions**: Deno (Supabase Functions)
- **Payment**: Midtrans Snap

---

## 8. Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_MIDTRANS_CLIENT_KEY=xxx
```

### Supabase Secrets
```
MIDTRANS_SERVER_KEY=xxx
MIDTRANS_IS_PRODUCTION=false
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 9. Security Considerations

### RLS Policies
- Users hanya bisa akses data milik sendiri
- Admin bisa akses semua data
- Menu items bisa dibaca public

### Webhook Security
- Signature verification dengan SHA-512
- Service role key untuk update database
- UUID validation untuk order ID

---

## 10. Catatan Implementasi Penting

1. **Cart Persistence**: Cart disimpan di localStorage, bukan database
2. **Cutoff Time**: Jam 05:00 untuk batas pemesanan hari yang sama
3. **Profile Auto-Create**: Trigger database saat user signup
4. **Status Flow**: pending → paid/failed/expired (via webhook)
5. **Naming Convention**: Database pakai snake_case, frontend pakai camelCase
6. **Type Safety**: TypeScript strict mode dengan Supabase generated types
