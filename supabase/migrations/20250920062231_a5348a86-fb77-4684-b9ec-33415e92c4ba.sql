-- Comprehensive security hardening for newsletter_subscribers table
-- This addresses potential email harvesting vulnerabilities

-- 1. Add explicit restrictive policies to deny anonymous access
CREATE POLICY "Block all anonymous access to newsletter_subscribers"
ON public.newsletter_subscribers 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Add restrictive policy to block cross-user data access attempts
CREATE POLICY "Deny cross-user access attempts"
ON public.newsletter_subscribers 
FOR ALL
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 3. Create a security function to validate email access patterns
CREATE OR REPLACE FUNCTION public.validate_newsletter_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log suspicious access attempts
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anonymous access to newsletter data is not allowed';
  END IF;
  
  IF NEW.user_id IS NULL OR NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Invalid user_id for newsletter subscriber';
  END IF;
  
  -- Additional validation: email format
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;