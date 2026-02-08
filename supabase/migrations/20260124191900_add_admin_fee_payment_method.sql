-- Add admin fee and payment method columns to orders table
-- For tracking payment processing fees (QRIS 0.7% or VA Rp 4,400)

-- Add admin_fee column to store the calculated admin fee
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_fee INTEGER DEFAULT 0;

-- Add payment_method column to store the payment method used (qris, bank_transfer, etc.)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.admin_fee IS 'Payment admin fee: QRIS 0.7% for <= 628k, VA Rp 4,400 for > 628k';
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used: qris, bank_transfer, bca_va, bni_va, etc.';
