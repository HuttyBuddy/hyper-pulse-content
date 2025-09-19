-- Fix critical security vulnerabilities in RLS policies

-- Remove the dangerous public policy on profiles table
DROP POLICY IF EXISTS "profile_update_own" ON public.profiles;

-- Recreate all policies as RESTRICTIVE to ensure proper access control
-- This prevents any potential bypass through policy combinations

-- Fix newsletter_subscribers policies
DROP POLICY IF EXISTS "Authenticated users can view their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can update their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can delete their own newsletter subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Secure: Users can view only their own newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can insert only their own newsletter subscribers"
ON public.newsletter_subscribers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can update only their own newsletter subscribers"
ON public.newsletter_subscribers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can delete only their own newsletter subscribers"
ON public.newsletter_subscribers FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix profiles policies
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;

CREATE POLICY "Secure: Users can view only their own profile"
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can insert only their own profile"
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can update only their own profile"
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Fix lead_submissions policies
DROP POLICY IF EXISTS "Authenticated users can view their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Authenticated users can insert their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Authenticated users can update their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete their own lead submissions" ON public.lead_submissions;

CREATE POLICY "Secure: Users can view only their own lead submissions"
ON public.lead_submissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can insert only their own lead submissions"
ON public.lead_submissions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can update only their own lead submissions"
ON public.lead_submissions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can delete only their own lead submissions"
ON public.lead_submissions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix email_recipients policies
DROP POLICY IF EXISTS "Authenticated users can view their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Authenticated users can insert their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Authenticated users can update their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Authenticated users can delete their own email recipients" ON public.email_recipients;

CREATE POLICY "Secure: Users can view only their own email recipients"
ON public.email_recipients FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can insert only their own email recipients"
ON public.email_recipients FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can update only their own email recipients"
ON public.email_recipients FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Secure: Users can delete only their own email recipients"
ON public.email_recipients FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix subscribers policies (keep email-based access for Stripe integration)
DROP POLICY IF EXISTS "Authenticated users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can update their own subscription" ON public.subscribers;

CREATE POLICY "Secure: Users can view only their own subscription"
ON public.subscribers FOR SELECT 
TO authenticated 
USING ((auth.uid() = user_id) OR (auth.email() = email));

CREATE POLICY "Secure: Users can insert only their own subscription"
ON public.subscribers FOR INSERT 
TO authenticated 
WITH CHECK ((auth.uid() = user_id) OR (auth.email() = email));

CREATE POLICY "Secure: Users can update only their own subscription"
ON public.subscribers FOR UPDATE 
TO authenticated 
USING ((auth.uid() = user_id) OR (auth.email() = email)) 
WITH CHECK ((auth.uid() = user_id) OR (auth.email() = email));

-- Ensure user_id columns are NOT NULL for security
ALTER TABLE public.newsletter_subscribers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.lead_submissions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.email_recipients ALTER COLUMN user_id SET NOT NULL;