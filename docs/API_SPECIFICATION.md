# API_SPECIFICATION.md

## Overview

Aplikasi menggunakan Supabase sebagai backend dengan kombinasi:
1. **Supabase Client API** - untuk operasi database CRUD
2. **Edge Functions** - untuk integrasi payment Midtrans

---

## 1. Supabase Client API

### Base URL
```
https://<project-ref>.supabase.co
```

### Authentication
Semua request memerlukan header:
```
Authorization: Bearer <access_token>
apikey: <anon_key>
```

---

## 2. Database Operations (via Supabase Client)

### 2.1 Profiles

#### Get Current User Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### Update Profile
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ full_name: 'New Name' })
  .eq('user_id', userId);
```

---

### 2.2 Recipients

#### List Recipients
```typescript
const { data, error } = await supabase
  .from('recipients')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

#### Create Recipient
```typescript
const { data, error } = await supabase
  .from('recipients')
  .insert({
    user_id: userId,
    name: 'Anak 1',
    class: 'Kelas 3A',
    address: 'SD Negeri 1'
  })
  .select()
  .single();
```

#### Update Recipient
```typescript
const { error } = await supabase
  .from('recipients')
  .update({ name: 'Anak Update' })
  .eq('id', recipientId);
```

#### Delete Recipient
```typescript
const { error } = await supabase
  .from('recipients')
  .delete()
  .eq('id', recipientId);
```

---

### 2.3 Menu Items

#### List All Menu Items
```typescript
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .order('category')
  .order('name');
```

#### Create Menu Item (Admin)
```typescript
const { data, error } = await supabase
  .from('menu_items')
  .insert({
    name: 'Nasi Goreng',
    description: 'Nasi goreng spesial',
    price: 15000,
    category: 'Makanan Utama',
    is_available: true
  })
  .select()
  .single();
```

#### Update Menu Item (Admin)
```typescript
const { error } = await supabase
  .from('menu_items')
  .update({ price: 17000, is_available: false })
  .eq('id', menuItemId);
```

#### Delete Menu Item (Admin)
```typescript
const { error } = await supabase
  .from('menu_items')
  .delete()
  .eq('id', menuItemId);
```

---

### 2.4 Orders

#### List User Orders
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    recipient:recipients(name, class),
    order_items(
      id,
      menu_item_id,
      quantity,
      unit_price,
      subtotal,
      menu_item:menu_items(name, image_url)
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

#### Get Single Order
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    recipient:recipients(name, class),
    order_items(
      id,
      menu_item_id,
      quantity,
      unit_price,
      subtotal,
      menu_item:menu_items(name, image_url)
    )
  `)
  .eq('id', orderId)
  .single();
```

#### Create Order
```typescript
// Step 1: Create order
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    recipient_id: recipientId,
    delivery_date: '2024-12-15',
    total_amount: 45000,
    status: 'pending'
  })
  .select()
  .single();

// Step 2: Create order items
const { error: itemsError } = await supabase
  .from('order_items')
  .insert([
    {
      order_id: order.id,
      menu_item_id: 'menu-uuid-1',
      quantity: 2,
      unit_price: 15000,
      subtotal: 30000
    },
    {
      order_id: order.id,
      menu_item_id: 'menu-uuid-2',
      quantity: 1,
      unit_price: 15000,
      subtotal: 15000
    }
  ]);
```

#### Update Order Status (Admin)
```typescript
const { error } = await supabase
  .from('orders')
  .update({ status: 'paid' })
  .eq('id', orderId);
```

---

## 3. Edge Functions

### 3.1 create-payment

**Endpoint**: `POST /functions/v1/create-payment`

**Purpose**: Membuat transaksi pembayaran di Midtrans dan mendapatkan Snap Token

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "snapToken": "66e4fa55-fdac-4ef9-91b5-733b97d5c0c4",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v3/..."
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Order not found"
}
```

**Example cURL**:
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/create-payment' \
  -H 'Authorization: Bearer eyJ...' \
  -H 'Content-Type: application/json' \
  -d '{"orderId": "550e8400-e29b-41d4-a716-446655440000"}'
```

---

### 3.2 payment-webhook

**Endpoint**: `POST /functions/v1/payment-webhook`

**Purpose**: Menerima notifikasi pembayaran dari Midtrans

**Headers**:
```
Content-Type: application/json
```

**Request Body** (from Midtrans):
```json
{
  "transaction_time": "2024-12-11 10:00:00",
  "transaction_status": "settlement",
  "transaction_id": "txn-123",
  "status_code": "200",
  "signature_key": "sha512hash...",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "gross_amount": "45000.00",
  "fraud_status": "accept",
  "payment_type": "bank_transfer"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Notification processed"
}
```

**Error Response** (401):
```json
{
  "error": "Invalid signature"
}
```

**Transaction Status Mapping**:
| Midtrans Status | Order Status |
|-----------------|--------------|
| `capture` (fraud: accept) | `paid` |
| `settlement` | `paid` |
| `pending` | `pending` |
| `cancel`, `deny` | `failed` |
| `expire` | `expired` |

---

## 4. Authentication API

### Sign Up
```typescript
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      phone: '08123456789'
    }
  }
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

## 5. Error Codes

| Code | Description |
|------|-------------|
| `PGRST116` | Row not found |
| `PGRST301` | Request timeout |
| `42501` | RLS policy violation |
| `23505` | Unique constraint violation |
| `23503` | Foreign key violation |

---

## 6. Rate Limits

Supabase default rate limits:
- **Realtime**: 200 connections per project
- **REST API**: 1000 requests per second
- **Edge Functions**: 100 concurrent executions

---

## 7. Webhook Configuration

### Midtrans Webhook URL
```
https://<project-ref>.supabase.co/functions/v1/payment-webhook
```

### Required Settings (Midtrans Dashboard)
1. Enable HTTP Notification
2. Set Finish/Unfinish/Error Redirect URLs
3. Enable all payment notification types
