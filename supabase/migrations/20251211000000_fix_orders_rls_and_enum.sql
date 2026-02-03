-- Fix orders table status constraint and RLS policy

-- Step 1: Drop the existing check constraint on orders.status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add new check constraint with all required statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivered', 'cancelled', 'paid', 'failed', 'expired'));

-- Step 3: Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;

-- Step 4: Create new policy with explicit WITH CHECK clause
-- This allows users to update their own orders that are currently 'pending'
-- The WITH CHECK ensures the user_id remains the same after update
CREATE POLICY "Users can update own pending orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);
