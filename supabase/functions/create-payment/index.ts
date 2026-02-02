/**
 * Edge Function: create-payment
 * Version: 7.0 - Production Ready
 * 
 * Creates Midtrans payment transactions for Dapoer At-Tauhid orders.
 * Supports both single and BULK orders with automatic QRIS/VA selection.
 * 
 * Business Rules:
 * - Amount <= 628,000 → QRIS (0.7% fee)
 * - Amount > 628,000 → VA (Rp 4,400 flat fee)
 * - All transaction IDs prefixed with "DAPOER-"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES & ENUMS
// ============================================================================

/** Order status enum */
enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  CONFIRMED = "confirmed",
  FAILED = "failed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

/** Payment method enum */
enum PaymentMethod {
  QRIS = "qris",
  BANK_TRANSFER = "bank_transfer",
  CASH = "cash",
}

/** Order item from database */
interface OrderItem {
  id: string;
  menu_item_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: { name: string } | null;
}

/** Recipient from database */
interface Recipient {
  name: string;
  class: string | null;
}

/** Order from database */
interface Order {
  id: string;
  user_id: string | null;
  recipient_id: string | null;
  status: string;
  total_amount: number;
  admin_fee: number | null;
  payment_method: string | null;
  delivery_date: string | null;
  snap_token: string | null;
  payment_url: string | null;
  transaction_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  recipient: Recipient | null;
  order_items: OrderItem[];
}

/** Payment info response */
interface PaymentInfo {
  baseAmount: number;
  adminFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  feeType: string;
}

/** Midtrans item detail */
interface MidtransItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

/** Request body */
interface CreatePaymentRequest {
  orderId?: string;
  orderIds?: string[];
  isGuest?: boolean;
  forceNewToken?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAPOER_PREFIX = "DAPOER";

const PAYMENT_CONFIG = {
  QRIS_MAX_AMOUNT: 628000,
  QRIS_FEE_PERCENTAGE: 0.7,
  VA_FEE_FLAT: 4400,
} as const;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Logger with timestamp and context */
const log = {
  info: (message: string, data?: unknown) => {
    console.log(`[create-payment] ${message}`, data ? JSON.stringify(data) : "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`[create-payment] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[create-payment] WARN: ${message}`, data ? JSON.stringify(data) : "");
  },
};

/** Generate DAPOER-prefixed transaction ID */
function generateTransactionId(orderIds: string[]): string {
  if (orderIds.length === 1) {
    return `${DAPOER_PREFIX}-${orderIds[0]}`;
  }
  return `${DAPOER_PREFIX}-BULK-${Date.now()}-${orderIds.length}`;
}

/** Calculate admin fee based on amount */
function calculateAdminFee(baseAmount: number): {
  fee: number;
  method: PaymentMethod;
  feeType: string;
} {
  if (baseAmount <= PAYMENT_CONFIG.QRIS_MAX_AMOUNT) {
    const fee = Math.ceil((baseAmount * PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE) / 100);
    return {
      fee,
      method: PaymentMethod.QRIS,
      feeType: `${PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE}%`,
    };
  }
  return {
    fee: PAYMENT_CONFIG.VA_FEE_FLAT,
    method: PaymentMethod.BANK_TRANSFER,
    feeType: `Rp ${PAYMENT_CONFIG.VA_FEE_FLAT.toLocaleString("id-ID")}`,
  };
}

/** Get enabled payment methods for Midtrans */
function getEnabledPayments(baseAmount: number): string[] {
  if (baseAmount <= PAYMENT_CONFIG.QRIS_MAX_AMOUNT) {
    return ["other_qris"];
  }
  return ["bank_transfer"];
}

/** Validate delivery date is not in the past */
function validateDeliveryDate(deliveryDate: string | null): boolean {
  if (!deliveryDate) return true;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  
  return delivery >= today;
}

/** Create Supabase client based on auth context */
function createSupabaseClient(
  isGuest: boolean,
  authHeader: string | null
): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL not configured");
  }

  if (isGuest) {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }
    return createClient(supabaseUrl, serviceRoleKey);
  }

  if (!authHeader) {
    throw new Error("Authorization header required for authenticated checkout");
  }

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!anonKey) {
    throw new Error("SUPABASE_ANON_KEY not configured");
  }

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

/** Fetch orders from database */
async function fetchOrders(
  supabase: SupabaseClient,
  orderIds: string[]
): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      recipient:recipients(name, class),
      order_items(
        id,
        menu_item_id,
        quantity,
        unit_price,
        subtotal,
        menu_item:menu_items(name)
      )
    `)
    .in("id", orderIds);

  if (error) {
    log.error("Failed to fetch orders", error);
    throw new Error("Orders not found");
  }

  if (!data || data.length === 0) {
    throw new Error("Orders not found");
  }

  return data as Order[];
}

/** Validate orders for payment */
function validateOrders(orders: Order[], isGuest: boolean): void {
  // Check for paid orders
  const paidStatuses = [OrderStatus.PAID, OrderStatus.CONFIRMED];
  const hasPaidOrder = orders.some((order) => 
    paidStatuses.includes(order.status as OrderStatus)
  );
  
  if (hasPaidOrder) {
    throw new Error("Pesanan sudah dibayar");
  }

  // Validate delivery dates
  for (const order of orders) {
    if (!validateDeliveryDate(order.delivery_date)) {
      log.warn("Delivery date expired", { orderId: order.id, deliveryDate: order.delivery_date });
      throw new Error("Tidak dapat membayar - tanggal penerimaan sudah lewat");
    }
  }

  // Validate guest checkout
  if (isGuest) {
    const hasAuthenticatedOrder = orders.some((order) => order.user_id !== null);
    if (hasAuthenticatedOrder) {
      throw new Error("Guest checkout can only be used for guest orders");
    }
  }
}

/** Check if existing snap token can be reused */
function canReuseToken(orders: Order[]): boolean {
  if (orders.length === 0) return false;

  const firstOrder = orders[0];
  
  // Must have a snap token and be pending
  if (!firstOrder.snap_token || firstOrder.status !== OrderStatus.PENDING) {
    return false;
  }

  // For single order, just check if it has a valid token
  if (orders.length === 1) {
    return true;
  }

  // For multiple orders, all must share the same token and transaction_id
  return orders.every((order) =>
    order.snap_token === firstOrder.snap_token &&
    order.transaction_id === firstOrder.transaction_id &&
    order.status === OrderStatus.PENDING
  );
}

/** Build payment info from orders */
function buildPaymentInfo(orders: Order[], useExisting: boolean): PaymentInfo {
  const baseAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
  
  if (useExisting && orders[0].admin_fee !== null) {
    const adminFee = orders[0].admin_fee;
    const paymentMethod = (orders[0].payment_method as PaymentMethod) || calculateAdminFee(baseAmount).method;
    return {
      baseAmount,
      adminFee,
      totalAmount: baseAmount + adminFee,
      paymentMethod,
      feeType: paymentMethod === PaymentMethod.QRIS
        ? `${PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE}%`
        : `Rp ${PAYMENT_CONFIG.VA_FEE_FLAT.toLocaleString("id-ID")}`,
    };
  }

  const { fee, method, feeType } = calculateAdminFee(baseAmount);
  return {
    baseAmount,
    adminFee: fee,
    totalAmount: baseAmount + fee,
    paymentMethod: method,
    feeType,
  };
}

/** Build Midtrans item details */
function buildItemDetails(orders: Order[], paymentInfo: PaymentInfo): MidtransItem[] {
  const items: MidtransItem[] = [];

  for (const order of orders) {
    for (const item of order.order_items) {
      items.push({
        id: item.menu_item_id || `item-${item.id}`,
        price: Math.round(item.unit_price),
        quantity: item.quantity,
        name: item.menu_item?.name || "Menu Item",
      });
    }
  }

  // Add admin fee as line item
  items.push({
    id: "admin-fee",
    price: paymentInfo.adminFee,
    quantity: 1,
    name: `Biaya Admin (${paymentInfo.feeType})`,
  });

  return items;
}

/** Call Midtrans API to create transaction */
async function createMidtransTransaction(
  transactionId: string,
  totalAmount: number,
  items: MidtransItem[],
  customerName: string,
  customerPhone: string,
  paymentMethod: PaymentMethod
): Promise<{ token: string; redirectUrl: string }> {
  const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY not configured");
  }

  const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
  const baseUrl = isProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";

  const enabledPayments = paymentMethod === PaymentMethod.QRIS
    ? ["other_qris"]
    : ["bank_transfer"];

  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: transactionId,
      gross_amount: Math.round(totalAmount),
    },
    item_details: items,
    customer_details: {
      first_name: customerName,
      phone: customerPhone,
      email: "customer@dapoer-attauhid.com",
    },
    enabled_payments: enabledPayments,
  };

  // Add QRIS acquirer config
  if (paymentMethod === PaymentMethod.QRIS) {
    payload.qris = { acquirer: "gopay" };
  }

  log.info("Calling Midtrans API", { 
    url: `${baseUrl}/snap/v1/transactions`,
    transactionId,
    totalAmount,
    paymentMethod,
    isProduction,
  });

  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(serverKey + ":")}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error("Midtrans API error", { status: response.status, error: errorText });
    throw new Error(`Midtrans API error: ${errorText}`);
  }

  const data = await response.json();
  log.info("Midtrans transaction created", { token: data.token });

  return {
    token: data.token,
    redirectUrl: data.redirect_url,
  };
}

/** Update orders with payment data */
async function updateOrdersWithPayment(
  supabase: SupabaseClient,
  orderIds: string[],
  transactionId: string,
  snapToken: string,
  paymentUrl: string,
  adminFee: number,
  paymentMethod: PaymentMethod
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      snap_token: snapToken,
      payment_url: paymentUrl,
      transaction_id: transactionId,
      admin_fee: adminFee,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .in("id", orderIds);

  if (error) {
    log.warn("Failed to update orders with payment data", error);
  } else {
    log.info("Orders updated successfully", { count: orderIds.length });
  }
}

/** Create JSON response */
function jsonResponse(
  data: Record<string, unknown>,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  log.info("Request received", { method: req.method });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Parse request body
    const body: CreatePaymentRequest = await req.json();
    log.info("Request body", body);

    // Extract order IDs
    let orderIds: string[] = [];
    if (body.orderIds && Array.isArray(body.orderIds)) {
      orderIds = body.orderIds;
    } else if (body.orderId) {
      orderIds = [body.orderId];
    }

    if (orderIds.length === 0) {
      throw new Error("Order ID is required");
    }

    const isGuest = body.isGuest === true;
    const forceNewToken = body.forceNewToken === true;

    log.info("Processing payment", { orderIds, isGuest, forceNewToken });

    // Create Supabase client
    const authHeader = req.headers.get("Authorization");
    const supabase = createSupabaseClient(isGuest, authHeader);

    // Fetch orders
    const orders = await fetchOrders(supabase, orderIds);
    log.info("Orders fetched", { count: orders.length });

    // Validate orders
    validateOrders(orders, isGuest);

    // Check for reusable token
    if (!forceNewToken && canReuseToken(orders)) {
      log.info("Reusing existing snap token");
      
      const paymentInfo = buildPaymentInfo(orders, true);
      
      return jsonResponse({
        success: true,
        snapToken: orders[0].snap_token,
        redirectUrl: orders[0].payment_url,
        orderIds,
        reused: true,
        paymentInfo,
      });
    }

    // Build payment info for new token
    const paymentInfo = buildPaymentInfo(orders, false);
    log.info("Payment info calculated", paymentInfo);

    // Generate transaction ID with DAPOER prefix
    const transactionId = generateTransactionId(orderIds);
    log.info("Transaction ID generated", { transactionId });

    // Build item details
    const items = buildItemDetails(orders, paymentInfo);

    // Get customer details
    const firstOrder = orders[0];
    const customerName = isGuest
      ? (firstOrder.guest_name || "Guest")
      : (firstOrder.recipient?.name || "Customer");
    const customerPhone = isGuest
      ? (firstOrder.guest_phone || "")
      : "";

    // Create Midtrans transaction
    const { token, redirectUrl } = await createMidtransTransaction(
      transactionId,
      paymentInfo.totalAmount,
      items,
      customerName,
      customerPhone,
      paymentInfo.paymentMethod
    );

    // Update orders with payment data
    await updateOrdersWithPayment(
      supabase,
      orderIds,
      transactionId,
      token,
      redirectUrl,
      paymentInfo.adminFee,
      paymentInfo.paymentMethod
    );

    return jsonResponse({
      success: true,
      snapToken: token,
      redirectUrl,
      orderIds,
      reused: false,
      paymentInfo,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error("Request failed", message);
    
    return jsonResponse({ success: false, error: message }, 400);
  }
});
