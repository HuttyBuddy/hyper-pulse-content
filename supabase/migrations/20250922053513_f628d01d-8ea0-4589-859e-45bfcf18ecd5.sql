-- SECURITY FIX: Restrict public access to shared reports to require valid access tokens
-- Remove overly permissive policy that allows access to any active report

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view active shared reports with valid token" ON public.shared_reports;

-- 2. Create a more restrictive policy that requires access via the edge function
-- This policy only allows access through the application layer, not direct database access
CREATE POLICY "Shared reports require application layer access"
ON public.shared_reports
FOR SELECT TO anon, authenticated
USING (false);

-- 3. The existing authenticated user policy remains for report owners
-- "Users can view their own shared reports" already exists and is secure

-- Note: Public access to shared reports should only happen through the 
-- fetch-shareable-analytics edge function which properly validates access tokens
-- This prevents direct database access while maintaining functionality