-- Complete security hardening by adding validation triggers
-- Create triggers to enforce email security validation

-- 1. Create trigger for INSERT operations
CREATE TRIGGER validate_newsletter_insert
  BEFORE INSERT ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_newsletter_access();

-- 2. Create trigger for UPDATE operations
CREATE TRIGGER validate_newsletter_update
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_newsletter_access();

-- 3. Add audit trail for newsletter access (optional security monitoring)
CREATE TABLE IF NOT EXISTS public.newsletter_access_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL DEFAULT 'newsletter_subscribers',
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.newsletter_access_log ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.newsletter_access_log
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create function to log access attempts
CREATE OR REPLACE FUNCTION public.log_newsletter_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.newsletter_access_log (user_id, action, ip_address)
  VALUES (auth.uid(), TG_OP, inet_client_addr());
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Add logging trigger
CREATE TRIGGER log_newsletter_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_newsletter_access();