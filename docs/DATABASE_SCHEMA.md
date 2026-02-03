# DATABASE_SCHEMA.md

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │    profiles     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───────│ user_id (FK)    │
│ email           │       │ full_name       │
│ ...             │       │ phone           │
└────────┬────────┘       │ role            │
         │                └─────────────────┘
         │
         ├────────────────────────────────────┐
         │                                    │
         ▼                                    ▼
┌─────────────────┐                 ┌─────────────────┐
│   recipients    │                 │     orders      │
├─────────────────┤                 ├─────────────────┤
│ id (PK)         │◄────────────────│ recipient_id    │
│ user_id (FK)    │                 │ user_id (FK)    │
│ name            │                 │ status          │
│ class           │                 │ total_amount    │
│ address         │                 │ delivery_date   │
│ phone           │                 │ snap_token      │
│ is_default      │                 │ payment_url     │
└─────────────────┘                 │ transaction_id  │
                                    └────────┬────────┘
                                             │
                                             │
                                             ▼
┌─────────────────┐                 ┌─────────────────┐
│   menu_items    │◄────────────────│   order_items   │
├─────────────────┤                 ├─────────────────┤
│ id (PK)         │                 │ id (PK)         │
│ name            │                 │ order_id (FK)   │
│ description     │                 │ menu_item_id    │
│ price           │                 │ quantity        │
│ category        │                 │ unit_price      │
│ image_url       │                 │ subtotal        │
│ is_available    │                 └─────────────────┘
└─────────────────┘
```

---

## Table Definitions

### 1. profiles

Menyimpan data profil user tambahan.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' 
    CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | - | FK ke auth.users |
| full_name | TEXT | YES | NULL | Nama lengkap |
| phone | TEXT | YES | NULL | Nomor telepon |
| role | TEXT | NO | 'customer' | Role: customer/admin |
| created_at | TIMESTAMPTZ | NO | now() | Waktu dibuat |
| updated_at | TIMESTAMPTZ | NO | now() | Waktu diupdate |

**Indexes**:
- `profiles_pkey` - Primary key on id
- `profiles_user_id_key` - Unique on user_id

---

### 2. recipients

Menyimpan data penerima/anak.

```sql
CREATE TABLE public.recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  class TEXT,
  notes TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | - | FK ke auth.users |
| name | TEXT | NO | - | Nama penerima |
| class | TEXT | YES | NULL | Kelas (misal: 3A) |
| phone | TEXT | YES | NULL | Nomor telepon |
| address | TEXT | NO | - | Alamat/sekolah |
| notes | TEXT | YES | NULL | Catatan |
| is_default | BOOLEAN | YES | false | Penerima default |
| created_at | TIMESTAMPTZ | NO | now() | Waktu dibuat |
| updated_at | TIMESTAMPTZ | NO | now() | Waktu diupdate |

**Indexes**:
- `recipients_pkey` - Primary key on id
- `recipients_user_id_idx` - Index on user_id

---

### 3. menu_items

Menyimpan data menu makanan.

```sql
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | - | Nama menu |
| description | TEXT | YES | NULL | Deskripsi |
| price | DECIMAL(10,2) | NO | - | Harga (IDR) |
| category | TEXT | NO | - | Kategori |
| image_url | TEXT | YES | NULL | URL gambar |
| is_available | BOOLEAN | YES | true | Status tersedia |
| created_at | TIMESTAMPTZ | NO | now() | Waktu dibuat |
| updated_at | TIMESTAMPTZ | NO | now() | Waktu diupdate |

**Indexes**:
- `menu_items_pkey` - Primary key on id
- `menu_items_category_idx` - Index on category

---

### 4. orders

Menyimpan data pesanan.

```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.recipients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'preparing', 
                      'delivered', 'cancelled', 'paid', 'failed', 'expired')),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_date DATE,
  notes TEXT,
  snap_token TEXT,
  payment_url TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | YES | - | FK ke auth.users |
| recipient_id | UUID | YES | - | FK ke recipients |
| status | TEXT | NO | 'pending' | Status order |
| total_amount | DECIMAL | NO | - | Total harga |
| delivery_date | DATE | YES | NULL | Tanggal kirim |
| notes | TEXT | YES | NULL | Catatan |
| snap_token | TEXT | YES | NULL | Midtrans token |
| payment_url | TEXT | YES | NULL | URL pembayaran |
| transaction_id | TEXT | YES | NULL | Midtrans txn ID |
| created_at | TIMESTAMPTZ | NO | now() | Waktu dibuat |
| updated_at | TIMESTAMPTZ | NO | now() | Waktu diupdate |

**Indexes**:
- `orders_pkey` - Primary key on id
- `orders_user_id_idx` - Index on user_id
- `idx_orders_transaction_id` - Index on transaction_id

---

### 5. order_items

Menyimpan item dalam pesanan.

```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| order_id | UUID | NO | - | FK ke orders |
| menu_item_id | UUID | YES | - | FK ke menu_items |
| quantity | INTEGER | NO | 1 | Jumlah |
| unit_price | DECIMAL | NO | - | Harga satuan |
| subtotal | DECIMAL | NO | - | Subtotal |
| created_at | TIMESTAMPTZ | NO | now() | Waktu dibuat |

**Indexes**:
- `order_items_pkey` - Primary key on id
- `order_items_order_id_idx` - Index on order_id

---

## Row Level Security (RLS) Policies

### profiles
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### recipients
```sql
-- Users can CRUD own recipients
CREATE POLICY "Users can view own recipients" ON recipients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recipients" ON recipients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipients" ON recipients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipients" ON recipients FOR DELETE USING (auth.uid() = user_id);
```

### menu_items
```sql
-- Anyone can view menu
CREATE POLICY "Anyone can view available menu items" 
  ON menu_items FOR SELECT 
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage menu items" 
  ON menu_items FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
```

### orders
```sql
-- Users can view and create own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending orders" ON orders FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
```

---

## Triggers

### Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to: profiles, recipients, menu_items, orders
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create profile on signup
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Sample Queries

### Get all orders with items for a user
```sql
SELECT 
  o.*,
  r.name as recipient_name,
  r.class as recipient_class,
  json_agg(
    json_build_object(
      'id', oi.id,
      'name', mi.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'subtotal', oi.subtotal
    )
  ) as items
FROM orders o
LEFT JOIN recipients r ON o.recipient_id = r.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.user_id = 'user-uuid'
GROUP BY o.id, r.name, r.class
ORDER BY o.created_at DESC;
```

### Get daily revenue report
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(total_amount) as revenue
FROM orders
WHERE status = 'paid'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### Get top selling menu items
```sql
SELECT 
  mi.name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.subtotal) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.status = 'paid'
GROUP BY mi.id, mi.name
ORDER BY total_sold DESC
LIMIT 10;
```
