// Version 6.1 - Auto QRIS/VA selection with admin fee + Reuse existing snap_token
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Payment configuration constants
const PAYMENT_CONFIG = {
  // Threshold: <= 628000 uses QRIS, > 628000 uses VA
  QRIS_MAX_AMOUNT: 628000,

  // QRIS fee: 0.7%
  QRIS_FEE_PERCENTAGE: 0.7,

  // VA fee: flat Rp 4,400
  VA_FEE_FLAT: 4400,
};

// Calculate admin fee based on amount
function calculateAdminFee(baseAmount: number): {
  fee: number;
  method: string;
  feeType: string;
} {
  if (baseAmount <= PAYMENT_CONFIG.QRIS_MAX_AMOUNT) {
    // Use QRIS with 0.7% fee
    const fee = Math.ceil(
      (baseAmount * PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE) / 100,
    );
    return {
      fee,
      method: "qris",
      feeType: `${PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE}%`,
    };
  } else {
    // Use VA with flat fee Rp 4,400
    return {
      fee: PAYMENT_CONFIG.VA_FEE_FLAT,
      method: "bank_transfer",
      feeType: `Rp ${PAYMENT_CONFIG.VA_FEE_FLAT.toLocaleString("id-ID")}`,
    };
  }
}

// Get enabled payment methods based on amount
function getEnabledPayments(baseAmount: number): string[] {
  if (baseAmount <= PAYMENT_CONFIG.QRIS_MAX_AMOUNT) {
    // Only QRIS for amounts <= 628k
    return ["other_qris"];
  } else {
    // Only bank transfer/VA for amounts > 628k
    return ["bank_transfer"];
  }
}

serve(async (req) => {
  console.log("[V6.1] Create payment function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[V6.1] Received body:", JSON.stringify(body));

    // Support both single orderId and multiple orderIds
    let orderIds: string[] = [];
    const isGuestCheckout = body.isGuest === true;
    const forceNewToken = body.forceNewToken === true; // Option to force create new token

    if (body.orderIds && Array.isArray(body.orderIds)) {
      orderIds = body.orderIds;
      console.log("[V6.1] Using orderIds array:", orderIds);
    } else if (body.orderId) {
      orderIds = [body.orderId];
      console.log("[V6.1] Using single orderId:", body.orderId);
    }

    console.log(
      "[V6.1] Final orderIds to process:",
      orderIds,
      "isGuest:",
      isGuestCheckout,
      "forceNewToken:",
      forceNewToken,
    );

    if (orderIds.length === 0) {
      console.log("[V6.1] No order IDs provided");
      throw new Error("Order ID is required");
    }

    // For guest checkout, use service role key to bypass RLS
    // For authenticated users, use the authorization header
    let supabaseClient;

    if (isGuestCheckout) {
      console.log("[V6.1] Guest checkout - using service role");
      supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
    } else {
      console.log("[V6.1] Authenticated checkout - using user token");
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error(
          "Authorization header required for authenticated checkout",
        );
      }
      supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: authHeader },
          },
        },
      );
    }

    // Fetch all orders
    console.log("[V6.1] Fetching orders from database...");
    const { data: orders, error: orderError } = await supabaseClient
      .from("orders")
      .select(
        `
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
      `,
      )
      .in("id", orderIds);

    console.log(
      "[V6.1] Fetched orders count:",
      orders?.length,
      "Error:",
      orderError?.message,
    );

    if (orderError || !orders || orders.length === 0) {
      throw new Error("Orders not found");
    }

    // Validate delivery dates - reject if any order has a past delivery date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const order of orders) {
      if (order.delivery_date) {
        const deliveryDate = new Date(order.delivery_date);
        deliveryDate.setHours(0, 0, 0, 0);

        if (deliveryDate < today) {
          console.log(
            "[V6.1] Rejected - delivery date expired:",
            order.delivery_date,
          );
          throw new Error(
            "Tidak dapat membayar - tanggal penerimaan sudah lewat",
          );
        }
      }
    }

    // Validate guest orders
    if (isGuestCheckout) {
      const hasNonGuestOrder = orders.some(
        (order: any) => order.user_id !== null,
      );
      if (hasNonGuestOrder) {
        throw new Error("Guest checkout can only be used for guest orders");
      }
    }

    // Check if order is already paid
    const hasPaidOrder = orders.some(
      (order: any) => order.status === "paid" || order.status === "confirmed",
    );
    if (hasPaidOrder) {
      throw new Error("Pesanan sudah dibayar");
    }

    // ============================================
    // CHECK FOR EXISTING SNAP TOKEN (REUSE LOGIC)
    // ============================================

    // For single order, check if it already has a valid snap_token
    if (orderIds.length === 1 && !forceNewToken) {
      const existingOrder = orders[0];

      if (existingOrder.snap_token && existingOrder.status === "pending") {
        console.log("[V6.1] Found existing snap_token, reusing it");

        // Calculate payment info for response
        const baseAmount = existingOrder.total_amount;
        const adminFee =
          existingOrder.admin_fee || calculateAdminFee(baseAmount).fee;
        const totalAmount = baseAmount + adminFee;
        const paymentMethod =
          existingOrder.payment_method || calculateAdminFee(baseAmount).method;
        const feeType =
          paymentMethod === "qris"
            ? `${PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE}%`
            : `Rp ${PAYMENT_CONFIG.VA_FEE_FLAT.toLocaleString("id-ID")}`;

        return new Response(
          JSON.stringify({
            success: true,
            snapToken: existingOrder.snap_token,
            redirectUrl: existingOrder.payment_url,
            orderIds: orderIds,
            reused: true,
            paymentInfo: {
              baseAmount,
              adminFee,
              totalAmount,
              paymentMethod,
              feeType,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
    }

    // For multiple orders, check if they all have the same transaction_id and snap_token
    if (orderIds.length > 1 && !forceNewToken) {
      const firstToken = orders[0].snap_token;
      const firstTransactionId = orders[0].transaction_id;

      const allHaveSameToken = orders.every(
        (order: any) =>
          order.snap_token === firstToken &&
          order.transaction_id === firstTransactionId &&
          order.status === "pending" &&
          firstToken !== null,
      );

      if (allHaveSameToken && firstToken) {
        console.log("[V6.1] All orders have same snap_token, reusing it");

        const baseAmount = orders.reduce(
          (sum: number, order: any) => sum + order.total_amount,
          0,
        );
        const adminFee =
          orders[0].admin_fee || calculateAdminFee(baseAmount).fee;
        const totalAmount = baseAmount + adminFee;
        const paymentMethod =
          orders[0].payment_method || calculateAdminFee(baseAmount).method;
        const feeType =
          paymentMethod === "qris"
            ? `${PAYMENT_CONFIG.QRIS_FEE_PERCENTAGE}%`
            : `Rp ${PAYMENT_CONFIG.VA_FEE_FLAT.toLocaleString("id-ID")}`;

        return new Response(
          JSON.stringify({
            success: true,
            snapToken: firstToken,
            redirectUrl: orders[0].payment_url,
            orderIds: orderIds,
            reused: true,
            paymentInfo: {
              baseAmount,
              adminFee,
              totalAmount,
              paymentMethod,
              feeType,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
    }

    // ============================================
    // CREATE NEW SNAP TOKEN
    // ============================================
    console.log("[V6.1] Creating new snap token...");

    // Calculate combined total (base amount without admin fee)
    const baseAmount = orders.reduce(
      (sum: number, order: any) => sum + order.total_amount,
      0,
    );
    console.log("[V6.1] Base amount (before admin fee):", baseAmount);

    // Calculate admin fee based on amount
    const {
      fee: adminFee,
      method: paymentMethod,
      feeType,
    } = calculateAdminFee(baseAmount);
    const totalAmount = baseAmount + adminFee;

    console.log(
      "[V6.1] Admin fee:",
      adminFee,
      "| Payment method:",
      paymentMethod,
      "| Fee type:",
      feeType,
    );
    console.log("[V6.1] Total amount (with admin fee):", totalAmount);

    // Get enabled payment methods
    const enabledPayments = getEnabledPayments(baseAmount);
    console.log("[V6.1] Enabled payments:", enabledPayments);

    // Create combined order ID for Midtrans
    const combinedOrderId =
      orderIds.length > 1
        ? `BULK-${Date.now()}-${orderIds.length}`
        : orders[0].id;

    console.log("[V6.1] Combined order ID:", combinedOrderId);

    // Combine all items from all orders
    const allItems: any[] = [];
    orders.forEach((order: any) => {
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          allItems.push({
            id: item.menu_item_id || `item-${item.id}`,
            price: Math.round(item.unit_price),
            quantity: item.quantity,
            name: item.menu_item?.name || "Menu Item",
          });
        });
      }
    });

    // Add admin fee as a separate line item
    allItems.push({
      id: "admin-fee",
      price: adminFee,
      quantity: 1,
      name: `Biaya Admin (${feeType})`,
    });

    console.log("[V6.1] Total items (including admin fee):", allItems.length);

    // Get customer details - support both guest and authenticated orders
    const firstOrder = orders[0];
    let customerName = "Customer";
    let customerPhone = "";

    if (isGuestCheckout) {
      customerName = firstOrder.guest_name || "Guest";
      customerPhone = firstOrder.guest_phone || "";
    } else if (firstOrder.recipient) {
      customerName = firstOrder.recipient.name || "Customer";
    }

    const transactionDetails = {
      order_id: combinedOrderId,
      gross_amount: Math.round(totalAmount),
    };

    const customerDetails = {
      first_name: customerName,
      phone: customerPhone,
      email: "customer@dapoer-attauhid.com",
    };

    // Build Midtrans payload with restricted payment methods
    const midtransPayload: any = {
      transaction_details: transactionDetails,
      item_details: allItems,
      customer_details: customerDetails,
      enabled_payments: enabledPayments,
    };

    // Add specific configurations based on payment method
    if (paymentMethod === "qris") {
      midtransPayload.qris = {
        acquirer: "gopay",
      };
    }

    console.log("[V6.1] Midtrans payload:", JSON.stringify(midtransPayload));

    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!midtransServerKey) {
      throw new Error("MIDTRANS_SERVER_KEY not configured");
    }

    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    console.log(
      "[V6.1] Calling Midtrans API:",
      midtransUrl,
      "| Production:",
      isProduction,
    );

    const midtransAuth = btoa(midtransServerKey + ":");

    const midtransResponse = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${midtransAuth}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text();
      console.error("[V6.1] Midtrans error:", errorText);
      throw new Error(`Midtrans API error: ${errorText}`);
    }

    const midtransData = await midtransResponse.json();
    console.log("[V6.1] Midtrans success, token:", midtransData.token);

    // Update all orders with snap token, admin fee info, and combined transaction ID
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        snap_token: midtransData.token,
        payment_url: midtransData.redirect_url,
        transaction_id: combinedOrderId,
        admin_fee: adminFee,
        payment_method: paymentMethod,
      })
      .in("id", orderIds);

    if (updateError) {
      console.error("[V6.1] Update error:", updateError);
      console.log(
        "[V6.1] Warning: Failed to update orders with payment data, but payment token created",
      );
    } else {
      console.log("[V6.1] Successfully updated", orderIds.length, "orders");
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapToken: midtransData.token,
        redirectUrl: midtransData.redirect_url,
        orderIds: orderIds,
        reused: false,
        paymentInfo: {
          baseAmount,
          adminFee,
          totalAmount,
          paymentMethod,
          feeType,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[V6.1] Error:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
