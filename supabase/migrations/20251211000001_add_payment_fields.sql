-- Add payment-related fields to orders table for Midtrans integration

-- Add columns for Midtrans payment data
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS snap_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Add index on transaction_id for faster lookups from webhook
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders(transaction_id);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.snap_token IS 'Midtrans Snap token for payment';
COMMENT ON COLUMN public.orders.payment_url IS 'Midtrans payment redirect URL';
COMMENT ON COLUMN public.orders.transaction_id IS 'Midtrans transaction ID';
