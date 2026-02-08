# ARCHITECTURE.md

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Application                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │  Pages   │  │Components│  │  Hooks   │  │ Context  │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Supabase Client SDK                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Auth       │  │  PostgREST   │  │    Edge Functions        │  │
│  │              │  │  (Database)  │  │ ┌────────────────────┐   │  │
│  │ - Sign up    │  │              │  │ │  create-payment    │   │  │
│  │ - Sign in    │  │  - profiles  │  │ └────────────────────┘   │  │
│  │ - Session    │  │  - orders    │  │ ┌────────────────────┐   │  │
│  │              │  │  - menu      │  │ │  payment-webhook   │   │  │
│  └──────────────┘  └──────────────┘  │ └────────────────────┘   │  │
│                                       └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MIDTRANS                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Snap API    │  │  Payment     │  │   Webhook                │  │
│  │  (Token)     │  │  Gateway     │  │   Notification           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Page Hierarchy

```
App
├── Index (Landing Page)
├── Login
├── Register
├── NotFound
│
├── DashboardLayout (Protected)
│   ├── DashboardHome
│   ├── MenuPage
│   ├── CartPage
│   ├── CheckoutPage
│   ├── RecipientsPage
│   ├── OrdersPage
│   ├── OrderDetailPage
│   ├── InvoicesPage
│   └── SettingsPage
│
└── AdminLayout (Protected + Admin Role)
    ├── AdminDashboard
    ├── AdminMenuPage
    ├── AdminOrdersPage
    ├── AdminUsersPage
    ├── AdminReportsPage
    └── AdminFinancePage
```

### 2.2 Context Providers

```
<QueryClientProvider>      ─── TanStack Query
  <AuthProvider>           ─── Authentication state
    <AppProvider>          ─── Application state
      <TooltipProvider>    ─── UI tooltips
        <App />
      </TooltipProvider>
    </AppProvider>
  </AuthProvider>
</QueryClientProvider>
```

---

## 3. State Management

### 3.1 Context Layers

| Context | Purpose | State |
|---------|---------|-------|
| AuthContext | Authentication | user, session, profile |
| AppContext | Business logic | menu, cart, orders, recipients |

### 3.2 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        AppContext                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ useMenuItems│  │ useOrders   │  │ useRecipients       │  │
│  │             │  │             │  │                     │  │
│  │ menuItems[] │  │ orders[]    │  │ recipients[]        │  │
│  │ categories[]│  │ createOrder │  │ addRecipient        │  │
│  │ addMenuItem │  │ updateOrder │  │ updateRecipient     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                      useCart                             │ │
│  │  cart[] (localStorage)                                   │ │
│  │  addToCart, updateQuantity, removeFromCart, clearCart    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Payment Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Checkout │────▶│  Create   │────▶│  Edge     │────▶│ Midtrans  │
│   Page    │     │  Order    │     │ Function  │     │ Snap API  │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                                                             │
                                                             ▼
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Order    │◀────│  Webhook  │◀────│  Midtrans │◀────│  Snap     │
│  Updated  │     │  Handler  │     │  Webhook  │     │  Popup    │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

### Sequence Diagram

```
User          Frontend        Edge Function      Midtrans       Database
 │               │                 │                │               │
 │──Checkout────▶│                 │                │               │
 │               │──Create Order──▶│                │               │
 │               │                 │                │──────────────▶│
 │               │                 │                │   save order  │
 │               │──Call Function─▶│                │               │
 │               │                 │──Request Token▶│               │
 │               │                 │◀──Snap Token───│               │
 │               │                 │                │──────────────▶│
 │               │                 │                │   save token  │
 │               │◀─Snap Token─────│                │               │
 │◀─Show Popup───│                 │                │               │
 │──Pay────────────────────────────────────────────▶│               │
 │               │                 │                │               │
 │               │                 │◀───Webhook─────│               │
 │               │                 │                │──────────────▶│
 │               │                 │                │ update status │
 │               │                 │──────────────────────────────▶│
```

---

## 5. Module Dependencies

### 5.1 Frontend Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   shadcn    │  │  lucide     │  │  tailwind   │             │
│  │   /ui       │  │  -react     │  │   css       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Logic Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   react     │  │  tanstack   │  │  react      │             │
│  │   router    │  │  query      │  │  hook-form  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │  supabase   │  │  midtrans   │                               │
│  │  -js        │  │  snap       │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Build Dependencies

```
Vite
├── TypeScript
├── React
├── Tailwind CSS
├── PostCSS
└── ESLint
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Supabase Auth                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  1. User signs up/in                                    │  │
│  │  2. Supabase returns JWT token                          │  │
│  │  3. Token stored in localStorage                        │  │
│  │  4. Token sent with every API request                   │  │
│  │  5. PostgREST validates token + RLS policies            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Row Level Security

```sql
┌─────────────────────────────────────────────────────────────┐
│                    RLS Policy Chain                          │
│                                                              │
│  Request → auth.uid() → Policy Check → Data Access          │
│                                                              │
│  profiles:    auth.uid() = user_id                          │
│  recipients:  auth.uid() = user_id                          │
│  orders:      auth.uid() = user_id OR role = 'admin'        │
│  menu_items:  SELECT: true, WRITE: role = 'admin'           │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Webhook Security

```
Midtrans Notification
        │
        ▼
┌───────────────────┐
│  Signature Check  │ → SHA512(order_id + status + amount + server_key)
└───────────────────┘
        │
        ▼ (if valid)
┌───────────────────┐
│  UUID Validation  │ → Regex check for valid UUID format
└───────────────────┘
        │
        ▼ (if valid)
┌───────────────────┐
│  Order Lookup     │ → Check if order exists in database
└───────────────────┘
        │
        ▼ (if exists)
┌───────────────────┐
│  Update Status    │ → Use service_role key (bypass RLS)
└───────────────────┘
```

---

## 7. Design Decisions

### 7.1 Why Supabase?

| Requirement | Solution |
|-------------|----------|
| Auth | Built-in Supabase Auth |
| Database | PostgreSQL with RLS |
| Serverless Functions | Edge Functions (Deno) |
| Real-time | Supabase Realtime (future) |
| Easy setup | Managed service |

### 7.2 Why Local Cart?

- Cart adalah temporary state
- Tidak perlu persist ke database sampai checkout
- Mengurangi API calls
- Fast UX (no loading)

### 7.3 Why Context over Redux?

- Simpler setup
- Sufficient for app size
- Native React solution
- Hooks-based API
- No boilerplate

### 7.4 Why shadcn/ui?

- Customizable components
- Copy-paste (not npm dependency)
- Tailwind-native
- Accessible
- Beautiful defaults

---

## 8. Scalability Considerations

### 8.1 Current Limitations

| Area | Limit | Solution |
|------|-------|----------|
| Edge Functions | 100 concurrent | Queue system |
| Database | Supabase tier limits | Upgrade plan |
| File Storage | Not implemented | Add Supabase Storage |

### 8.2 Future Improvements

1. **Real-time Updates** - Supabase Realtime for order status
2. **Push Notifications** - OneSignal or Firebase
3. **Image Upload** - Supabase Storage for menu images
4. **Caching** - TanStack Query stale-while-revalidate
5. **Analytics** - PostHog or Mixpanel

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production                                │
│                                                                  │
│  ┌─────────────────┐      ┌─────────────────────────────────┐  │
│  │   Lovable       │      │        Supabase                  │  │
│  │   Hosting       │ ◀──▶ │  ┌─────────────────────────────┐│  │
│  │                 │      │  │  PostgreSQL                  ││  │
│  │  React App      │      │  │  Auth                        ││  │
│  │  (Static)       │      │  │  Edge Functions              ││  │
│  │                 │      │  │  PostgREST API               ││  │
│  └─────────────────┘      │  └─────────────────────────────┘│  │
│                           └─────────────────────────────────────┘
│                                        │                         │
│                                        ▼                         │
│                           ┌─────────────────────────────────┐   │
│                           │        Midtrans                  │   │
│                           │  (Payment Gateway)               │   │
│                           └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
