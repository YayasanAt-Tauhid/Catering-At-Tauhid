# Setup Environment Variables

## Frontend (.env)

Tambahkan ke file `.env` di root project:

```env
VITE_SUPABASE_PROJECT_ID="cdotfnjrhutepntflkgq"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb3RmbmpyaHV0ZXBudGZsa2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTgwMTksImV4cCI6MjA4MDQzNDAxOX0.dWE-sGOb2JzL6PmIsRizmu83CTf8xzSFSv0ktWC0iuw"
VITE_SUPABASE_URL="https://cdotfnjrhutepntflkgq.supabase.co"

# Midtrans Client Key (dapatkan dari dashboard Midtrans)
# Untuk Sandbox: https://dashboard.sandbox.midtrans.com/
# Untuk Production: https://dashboard.midtrans.com/
VITE_MIDTRANS_CLIENT_KEY="YOUR_MIDTRANS_CLIENT_KEY_HERE"
```

## Update index.html

Ganti `YOUR_CLIENT_KEY_HERE` di `index.html` dengan:
```html
<script type="text/javascript" 
  src="https://app.sandbox.midtrans.com/snap/snap.js" 
  data-client-key="YOUR_MIDTRANS_CLIENT_KEY_HERE">
</script>
```

**Note**: Untuk production, ganti URL menjadi `https://app.midtrans.com/snap/snap.js`

## Supabase Secrets (untuk Edge Functions)

Set secrets di Supabase menggunakan CLI:

```bash
# Midtrans Server Key (dapatkan dari dashboard Midtrans)
supabase secrets set MIDTRANS_SERVER_KEY=your_server_key_here

# Set environment (false untuk sandbox, true untuk production)
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

Atau via Supabase Dashboard:
1. Buka project di https://supabase.com/dashboard
2. Pilih project Anda
3. Pergi ke Settings → Edge Functions → Secrets
4. Tambahkan secrets di atas
