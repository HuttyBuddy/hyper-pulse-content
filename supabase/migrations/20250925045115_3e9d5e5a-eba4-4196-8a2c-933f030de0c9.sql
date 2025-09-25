-- SECURITY FIX: Fix RLS policy gaps in newsletter_subscribers table
-- The current restrictive policies create conflicts and potential security gaps
-- Replace with clear, strict permissive policies that ensure users only access their own data

-- 1. Drop all existing conflicting policies
DROP POLICY IF EXISTS "newsletter_anonymous_denied" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_delete_own" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_insert_own" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_select_own" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_update_own" ON public.newsletter_subscribers;

-- 2. Create strict permissive policies that only allow access to own data
-- Block all anonymous access completely
CREATE POLICY "Block all anonymous access to newsletter subscribers"
ON public.newsletter_subscribers
FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- Allow authenticated users to view only their own subscribers
CREATE POLICY "Users can view only their own newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert only their own subscribers  
CREATE POLICY "Users can insert only their own newsletter subscribers"
ON public.newsletter_subscribers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update only their own subscribers
CREATE POLICY "Users can update only their own newsletter subscribers"
ON public.newsletter_subscribers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete only their own subscribers
CREATE POLICY "Users can delete only their own newsletter subscribers"
ON public.newsletter_subscribers
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 3. Add validation trigger to ensure data integrity
CREATE OR REPLACE FUNCTION validate_newsletter_subscriber_security()
RETURNS trigger AS $$
BEGIN
  -- Ensure user_id is never null for authenticated operations
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null for newsletter subscribers';
  END IF;
  
  -- Ensure authenticated user can only create/modify their own records
  IF auth.uid() IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Users can only manage their own newsletter subscriber records';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;