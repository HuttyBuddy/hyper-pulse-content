-- CRITICAL SECURITY FIX: Enable RLS on predictive_results table
ALTER TABLE public.predictive_results ENABLE ROW LEVEL SECURITY;

-- Make user_id NOT NULL for security (requires existing data to have user_id)
ALTER TABLE public.predictive_results ALTER COLUMN user_id SET NOT NULL;

-- Create RLS policies for predictive_results
CREATE POLICY "Users can view their own predictive results"
ON public.predictive_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictive results"
ON public.predictive_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictive results"
ON public.predictive_results
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictive results"
ON public.predictive_results
FOR DELETE
USING (auth.uid() = user_id);

-- SECURITY FIX: Update database functions with secure search_path
CREATE OR REPLACE FUNCTION public.increment_report_view_count(report_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.shared_reports 
    SET view_count = view_count + 1 
    WHERE access_token = report_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now());
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_action_url text DEFAULT NULL::text, p_priority text DEFAULT 'normal'::text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO user_notifications (
    user_id, type, title, message, action_url, priority, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_action_url, p_priority, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_source text, lead_medium text, engagement_data jsonb, user_scoring_config jsonb DEFAULT NULL::jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  base_score integer := 0;
  source_weight integer := 0;
  engagement_bonus integer := 0;
  scoring_config jsonb;
BEGIN
  -- Use provided config or default
  scoring_config := COALESCE(user_scoring_config, '{
    "source_weights": {
      "property_valuation": 10,
      "consultation_request": 8,
      "newsletter_signup": 5,
      "download": 3
    },
    "engagement_weights": {
      "multiple_pages": 2,
      "time_on_site": 1,
      "return_visitor": 3
    }
  }'::jsonb);
  
  -- Calculate source weight
  source_weight := COALESCE((scoring_config->'source_weights'->lead_source)::integer, 1);
  
  -- Calculate engagement bonus
  IF engagement_data->>'pages_viewed' IS NOT NULL AND (engagement_data->>'pages_viewed')::integer > 1 THEN
    engagement_bonus := engagement_bonus + COALESCE((scoring_config->'engagement_weights'->>'multiple_pages')::integer, 2);
  END IF;
  
  IF engagement_data->>'time_on_site' IS NOT NULL AND (engagement_data->>'time_on_site')::integer > 120 THEN
    engagement_bonus := engagement_bonus + COALESCE((scoring_config->'engagement_weights'->>'time_on_site')::integer, 1);
  END IF;
  
  IF engagement_data->>'is_return_visitor' = 'true' THEN
    engagement_bonus := engagement_bonus + COALESCE((scoring_config->'engagement_weights'->>'return_visitor')::integer, 3);
  END IF;
  
  base_score := source_weight + engagement_bonus;
  
  -- Ensure score is between 1 and 100
  RETURN GREATEST(1, LEAST(100, base_score));
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  user_config jsonb;
  calculated_score integer;
BEGIN
  -- Get user's scoring configuration
  SELECT lead_scoring_config INTO user_config
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Calculate and update lead score
  calculated_score := calculate_lead_score(
    COALESCE((NEW.lead_data->>'source'), 'unknown'),
    COALESCE(NEW.utm_medium, 'direct'),
    COALESCE(NEW.engagement_data, '{}'),
    user_config
  );
  
  NEW.lead_score := calculated_score;
  NEW.lead_score_details := jsonb_build_object(
    'calculated_at', now(),
    'source_score', COALESCE((user_config->'source_weights'->(NEW.lead_data->>'source'))::integer, 1),
    'engagement_bonus', calculated_score - COALESCE((user_config->'source_weights'->(NEW.lead_data->>'source'))::integer, 1)
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Create notification for new lead
  PERFORM create_user_notification(
    NEW.user_id,
    'lead_captured',
    'New Lead Captured! 🎯',
    'A new ' || COALESCE(NEW.lead_source, 'lead') || ' lead has been captured: ' || 
    COALESCE((NEW.lead_data->>'name'), (NEW.lead_data->>'email'), 'Unknown'),
    '/analytics?tab=leads',
    CASE 
      WHEN NEW.lead_source = 'property_valuation' THEN 'high'
      WHEN NEW.lead_source = 'consultation_request' THEN 'high'
      ELSE 'normal'
    END,
    jsonb_build_object(
      'lead_id', NEW.id,
      'lead_source', NEW.lead_source,
      'lead_score', NEW.lead_score
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_content_generated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Create notification for new content
  PERFORM create_user_notification(
    NEW.user_id,
    'content_generated',
    'Content Generated! ✨',
    'Your ' || NEW.content_type || ' content for ' || 
    COALESCE(NEW.neighborhood, 'your area') || ' is ready to use',
    '/content/' || COALESCE(NEW.neighborhood, 'content'),
    'normal',
    jsonb_build_object(
      'content_id', NEW.id,
      'content_type', NEW.content_type,
      'neighborhood', NEW.neighborhood
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM user_notifications 
  WHERE is_read = true 
    AND created_at < now() - interval '30 days';
    
  -- Delete expired notifications
  DELETE FROM user_notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;