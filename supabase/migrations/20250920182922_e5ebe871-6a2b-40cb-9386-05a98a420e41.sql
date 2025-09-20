-- SECURITY FIX: Clean up conflicting RLS policies on newsletter_subscribers
-- Remove redundant policies that create security gaps

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Block all anonymous access to newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Deny cross-user access attempts" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Secure: Users can delete only their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Secure: Users can insert only their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Secure: Users can update only their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Secure: Users can view only their own newsletter subscribers" ON public.newsletter_subscribers;

-- 2. Create single, comprehensive, non-conflicting policies
-- These policies are more restrictive and eliminate security gaps

-- Block ALL anonymous access completely
CREATE POLICY "newsletter_anonymous_denied"
ON public.newsletter_subscribers
FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- Allow authenticated users to view only their own subscriber data
CREATE POLICY "newsletter_select_own"
ON public.newsletter_subscribers
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Allow authenticated users to insert only their own subscriber data
CREATE POLICY "newsletter_insert_own"
ON public.newsletter_subscribers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Allow authenticated users to update only their own subscriber data
CREATE POLICY "newsletter_update_own"
ON public.newsletter_subscribers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Allow authenticated users to delete only their own subscriber data
CREATE POLICY "newsletter_delete_own"
ON public.newsletter_subscribers
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);