-- Complete the security fix for remaining tables
-- Apply secure RLS policies to lead_submissions and email_recipients

-- Fix lead_submissions policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Authenticated users can insert their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Authenticated users can update their own lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete their own lead submissions" ON public.lead_submissions;

-- Create secure policies for lead_submissions
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

-- Fix email_recipients policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Authenticated users can insert their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Authenticated users can update their own email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Authenticated users can delete their own email recipients" ON public.email_recipients;

-- Create secure policies for email_recipients
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