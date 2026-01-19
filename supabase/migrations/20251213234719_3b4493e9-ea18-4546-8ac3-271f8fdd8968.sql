-- Add policy to allow kitchen staff to view recipients from orders
CREATE POLICY "Kitchen can view recipients from orders"
ON public.recipients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'kitchen'
  )
  AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.recipient_id = recipients.id
  )
);

-- Also add policy for admins to view all recipients
CREATE POLICY "Admins can view all recipients"
ON public.recipients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);