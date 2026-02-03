// Payment Constants for Dapoer-Attauhid Catering
// Based on Midtrans payment method requirements

// QRIS maximum transaction amount (in IDR)
// Transactions at or below this use QRIS, above use Bank Transfer
export const QRIS_MAX_AMOUNT = 628000;

// Payment method configurations
export const PAYMENT_METHODS = {
  // Tunai (Cash) - no fee
  cash: {
    id: "cash",
    name: "Tunai",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 0,
    maxAmount: null,
  },
  // QRIS / E-Wallet - 0.7% fee
  qris: {
    id: "qris",
    name: "QRIS",
    feeType: "percentage" as const,
    feePercentage: 0.7,
    feeValue: 0,
    maxAmount: 10000000, // 10 juta max for QRIS
  },
  gopay: {
    id: "gopay",
    name: "GoPay",
    feeType: "percentage" as const,
    feePercentage: 2,
    feeValue: 0,
    maxAmount: 10000000,
  },
  shopeepay: {
    id: "shopeepay",
    name: "ShopeePay",
    feeType: "percentage" as const,
    feePercentage: 2,
    feeValue: 0,
    maxAmount: 10000000,
  },
  // Bank Transfer / VA - Fixed fee Rp 4,400
  bank_transfer: {
    id: "bank_transfer",
    name: "Bank Transfer",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 4400,
    maxAmount: null,
  },
  bca_va: {
    id: "bca_va",
    name: "BCA Virtual Account",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 4400,
    maxAmount: null,
  },
  bni_va: {
    id: "bni_va",
    name: "BNI Virtual Account",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 4400,
    maxAmount: null,
  },
  bri_va: {
    id: "bri_va",
    name: "BRI Virtual Account",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 4400,
    maxAmount: null,
  },
  permata_va: {
    id: "permata_va",
    name: "Permata Virtual Account",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 4400,
    maxAmount: null,
  },
  cimb_va: {
    id: "cimb_va",
    name: "CIMB Virtual Account",
    feeType: "fixed" as const,
    feePercentage: 0,
    feeValue: 4400,
    maxAmount: null,
  },
  // Credit Card - 2.9% + Rp 2,000
  credit_card: {
    id: "credit_card",
    name: "Credit Card",
    feeType: "percentage" as const,
    feePercentage: 2.9,
    feeValue: 2000,
    maxAmount: null,
  },
};

// Calculate admin fee based on amount and payment method
export const calculateAdminFee = (
  baseAmount: number,
  paymentType?: string,
): number => {
  // If payment type is specified, calculate based on that
  if (paymentType) {
    const method = PAYMENT_METHODS[paymentType as keyof typeof PAYMENT_METHODS];
    if (method) {
      if (method.feeType === "percentage") {
        return Math.ceil((baseAmount * method.feePercentage) / 100);
      }
      return method.feeValue;
    }
  }

  // Default: QRIS for <= 628k, VA for > 628k
  if (baseAmount <= QRIS_MAX_AMOUNT) {
    // QRIS 0.7%
    return Math.ceil((baseAmount * PAYMENT_METHODS.qris.feePercentage) / 100);
  } else {
    // VA Rp 4,400
    return PAYMENT_METHODS.bank_transfer.feeValue;
  }
};

// Get enabled payment methods based on transaction amount
export const getEnabledPaymentMethods = (
  amount: number,
): {
  enabled_payments: string[];
  recommended: string;
  feeEstimate: number;
} => {
  if (amount <= QRIS_MAX_AMOUNT) {
    // For amounts at or under 628k, use QRIS only
    return {
      enabled_payments: ["qris"],
      recommended: "qris",
      feeEstimate: Math.ceil(
        (amount * PAYMENT_METHODS.qris.feePercentage) / 100,
      ),
    };
  } else {
    // For amounts above 628k, use bank transfer only
    return {
      enabled_payments: [
        "bank_transfer",
        "bca_va",
        "bni_va",
        "bri_va",
        "permata_va",
        "cimb_va",
      ],
      recommended: "bank_transfer",
      feeEstimate: PAYMENT_METHODS.bank_transfer.feeValue,
    };
  }
};

// Get payment method label for display
export const getPaymentMethodLabel = (amount: number): string => {
  if (amount <= QRIS_MAX_AMOUNT) {
    return "QRIS (0.7%)";
  }
  return "Virtual Account (Rp 4.400)";
};

// Get payment method info by ID
export const getPaymentMethodInfo = (
  paymentType: string,
): (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS] | null => {
  return PAYMENT_METHODS[paymentType as keyof typeof PAYMENT_METHODS] || null;
};
