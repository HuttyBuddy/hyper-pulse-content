-- First, verify RLS is enabled on all sensitive tables
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies and recreate with proper restrictions

-- newsletter_subscribers policies
DROP POLICY IF EXISTS "Users can delete their own newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can update their own subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view their own subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Authenticated users can view their own newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own newsletter subscribers"
ON public.newsletter_subscribers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own newsletter subscribers"
ON public.newsletter_subscribers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own newsletter subscribers"
ON public.newsletter_subscribers FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- lead_submissions policies
DROP POLICY IF EXISTS "Users can create lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Users can delete their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Users can update their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Users can view their own lead submissions" ON public.lead_submissions;

CREATE POLICY "Authenticated users can view their own lead submissions"
ON public.lead_submissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own lead submissions"
ON public.lead_submissions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own lead submissions"
ON public.lead_submissions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own lead submissions"
ON public.lead_submissions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- email_recipients policies
DROP POLICY IF EXISTS "Users can create their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Users can delete their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Users can update their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Users can view their own email recipients" ON public.email_recipients;

CREATE POLICY "Authenticated users can view their own email recipients"
ON public.email_recipients FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own email recipients"
ON public.email_recipients FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own email recipients"
ON public.email_recipients FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own email recipients"
ON public.email_recipients FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- campaign_performance policies (add missing DELETE policy)
DROP POLICY IF EXISTS "Users can insert their own campaign performance" ON public.campaign_performance;
DROP POLICY IF EXISTS "Users can update their own campaign performance" ON public.campaign_performance;
DROP POLICY IF EXISTS "Users can view their own campaign performance" ON public.campaign_performance;

CREATE POLICY "Authenticated users can view their own campaign performance"
ON public.campaign_performance FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own campaign performance"
ON public.campaign_performance FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own campaign performance"
ON public.campaign_performance FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Add the missing DELETE policy for campaign_performance
CREATE POLICY "Authenticated users can delete their own campaign performance"
ON public.campaign_performance FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- subscribers policies (keep the existing logic for email-based access)
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "users_can_insert_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "users_can_update_own_subscription" ON public.subscribers;

CREATE POLICY "Authenticated users can view their own subscription"
ON public.subscribers FOR SELECT 
TO authenticated 
USING ((user_id = auth.uid()) OR (email = auth.email()));

CREATE POLICY "Authenticated users can insert their own subscription"
ON public.subscribers FOR INSERT 
TO authenticated 
WITH CHECK ((auth.uid() = user_id) OR (auth.email() = email));

CREATE POLICY "Authenticated users can update their own subscription"
ON public.subscribers FOR UPDATE 
TO authenticated 
USING ((user_id = auth.uid()) OR (email = auth.email())) 
WITH CHECK ((auth.uid() = user_id) OR (auth.email() = email));