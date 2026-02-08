
# Rencana: Perbaikan Payment Method untuk Pembayaran Kasir

## Ringkasan Masalah
Saat ini, ketika kasir mengkonfirmasi pembayaran tunai, field `payment_method` di database tidak diupdate. Akibatnya, pesanan yang dibayar tunai tetap tercatat sebagai `'midtrans'` (nilai default).

## Langkah Implementasi

### 1. Update Mutation di CashierDashboard.tsx
Ubah query update agar juga mengubah `payment_method` menjadi `'cash'` dan `admin_fee` menjadi `0` (karena pembayaran tunai tidak ada biaya admin).

**File:** `src/pages/cashier/CashierDashboard.tsx`

```typescript
// Sebelum (Line 209-212):
const { error } = await supabase
  .from('orders')
  .update({ status: 'paid' })
  .in('id', orderIds);

// Sesudah:
const { error } = await supabase
  .from('orders')
  .update({ 
    status: 'paid',
    payment_method: 'cash',
    admin_fee: 0
  })
  .in('id', orderIds);
```

### 2. Tambahkan Label untuk Payment Method 'cash' di Reports
Update label dan warna untuk metode pembayaran `'cash'` di halaman laporan.

**File:** `src/hooks/useReportsData.ts`

```typescript
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',        // Tambahkan ini
  qris: 'QRIS',
  // ... existing labels
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: 'hsl(25, 80%, 50%)',  // Warna oranye untuk tunai
  qris: 'hsl(280, 60%, 55%)',
  // ... existing colors
};
```

### 3. Tambahkan Konstanta di payment-constants.ts (Opsional)
Untuk konsistensi, tambahkan definisi untuk metode pembayaran tunai.

**File:** `src/lib/payment-constants.ts`

```typescript
export const PAYMENT_METHODS = {
  // Tambahkan metode tunai
  cash: {
    id: "cash",
    name: "Tunai",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 0,
    maxAmount: null,
  },
  // ... existing methods
};
```

## Dampak Perubahan
1. Pesanan yang dikonfirmasi kasir akan memiliki `payment_method: 'cash'`
2. Biaya admin akan di-set ke `0` (tidak ada biaya untuk pembayaran tunai)
3. Laporan akan menampilkan label "Tunai" dengan warna yang berbeda
4. Tidak ada perubahan pada database schema (hanya perubahan data)

## Detail Teknis
- **File yang diubah:** 3 file
  - `src/pages/cashier/CashierDashboard.tsx`
  - `src/hooks/useReportsData.ts`
  - `src/lib/payment-constants.ts`
- **Backward compatible:** Ya, pesanan lama tetap berfungsi
- **Perlu migrasi data:** Opsional (untuk memperbaiki data lama yang salah)
