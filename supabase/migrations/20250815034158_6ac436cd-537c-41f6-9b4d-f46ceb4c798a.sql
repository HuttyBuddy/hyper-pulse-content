-- Fix critical security vulnerability in subscribers table RLS policies
-- Current policies allow anyone to INSERT/UPDATE any subscription record

-- Drop the existing dangerous policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure policies that only allow users to manage their own subscriptions
CREATE POLICY "users_can_insert_own_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  auth.email() = email
);

CREATE POLICY "users_can_update_own_subscription" ON public.subscribers
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.email() = email
);

-- Note: Edge functions using service role key will bypass these restrictions
-- This ensures only authenticated users can manage their own subscription data