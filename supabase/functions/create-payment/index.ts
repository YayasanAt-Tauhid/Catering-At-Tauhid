// Version 6 - Auto QRIS/VA selection with admin fee calculation
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
    return ["qris"];
  } else {
    // Only bank transfer/VA for amounts > 628k
    return ["bank_transfer"];
  }
}

serve(async (req) => {
  console.log("[V6] Create payment function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[V6] Received body:", JSON.stringify(body));

    // Support both single orderId and multiple orderIds
    let orderIds: string[] = [];
    const isGuestCheckout = body.isGuest === true;

    if (body.orderIds && Array.isArray(body.orderIds)) {
      orderIds = body.orderIds;
      console.log("[V6] Using orderIds array:", orderIds);
    } else if (body.orderId) {
      orderIds = [body.orderId];
      console.log("[V6] Using single orderId:", body.orderId);
    }

    console.log(
      "[V6] Final orderIds to process:",
      orderIds,
      "isGuest:",
      isGuestCheckout,
    );

    if (orderIds.length === 0) {
      console.log("[V6] No order IDs provided");
      throw new Error("Order ID is required");
    }

    // For guest checkout, use service role key to bypass RLS
    // For authenticated users, use the authorization header
    let supabaseClient;

    if (isGuestCheckout) {
      console.log("[V6] Guest checkout - using service role");
      supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
    } else {
      console.log("[V6] Authenticated checkout - using user token");
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
    console.log("[V6] Fetching orders from database...");
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
      "[V6] Fetched orders count:",
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
            "[V6] Rejected - delivery date expired:",
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
      const hasNonGuestOrder = orders.some((order) => order.user_id !== null);
      if (hasNonGuestOrder) {
        throw new Error("Guest checkout can only be used for guest orders");
      }
    }

    // Calculate combined total (base amount without admin fee)
    const baseAmount = orders.reduce(
      (sum, order) => sum + order.total_amount,
      0,
    );
    console.log("[V6] Base amount (before admin fee):", baseAmount);

    // Calculate admin fee based on amount
    const {
      fee: adminFee,
      method: paymentMethod,
      feeType,
    } = calculateAdminFee(baseAmount);
    const totalAmount = baseAmount + adminFee;

    console.log(
      "[V6] Admin fee:",
      adminFee,
      "| Payment method:",
      paymentMethod,
      "| Fee type:",
      feeType,
    );
    console.log("[V6] Total amount (with admin fee):", totalAmount);

    // Get enabled payment methods
    const enabledPayments = getEnabledPayments(baseAmount);
    console.log("[V6] Enabled payments:", enabledPayments);

    // Create combined order ID for Midtrans
    const combinedOrderId =
      orderIds.length > 1
        ? `BULK-${Date.now()}-${orderIds.length}`
        : orders[0].id;

    console.log("[V6] Combined order ID:", combinedOrderId);

    // Combine all items from all orders
    const allItems: any[] = [];
    orders.forEach((order) => {
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          allItems.push({
            id: item.menu_item_id,
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

    console.log("[V6] Total items (including admin fee):", allItems.length);

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
      email: "customer@kideats.com",
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
        acquirer: "gopay", // Default QRIS acquirer
      };
    } else if (paymentMethod === "bank_transfer") {
      // Enable multiple VA options
      midtransPayload.enabled_payments = [
        "bca_va",
        "bni_va",
        "bri_va",
        "permata_va",
        "cimb_va",
        "other_va",
      ];
    }

    console.log("[V6] Midtrans payload:", JSON.stringify(midtransPayload));

    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!midtransServerKey) {
      throw new Error("MIDTRANS_SERVER_KEY not configured");
    }

    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    console.log(
      "[V6] Calling Midtrans API:",
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
      console.error("[V6] Midtrans error:", errorText);
      throw new Error(`Midtrans API error: ${errorText}`);
    }

    const midtransData = await midtransResponse.json();
    console.log("[V6] Midtrans success, token:", midtransData.token);

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
      console.error("[V6] Update error:", updateError);
      // Don't throw - payment was created successfully, just failed to update order
      console.log(
        "[V6] Warning: Failed to update orders with payment data, but payment token created",
      );
    } else {
      console.log("[V6] Successfully updated", orderIds.length, "orders");
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapToken: midtransData.token,
        redirectUrl: midtransData.redirect_url,
        orderIds: orderIds,
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
    console.error("[V6] Error:", errorMessage);
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
