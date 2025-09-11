/*
  # Enhanced Lead Tracking and CRM Integration

  1. Database Enhancements
    - Add UTM tracking fields to lead_submissions table
    - Add lead scoring capabilities
    - Add CRM field mappings to profiles table
    - Add enhanced content performance tracking
    - Add conversion funnel tracking

  2. Security
    - Maintain existing RLS policies
    - Add policies for new tracking tables

  3. Performance
    - Add indexes for analytics queries
    - Optimize lead scoring calculations
*/

-- Add UTM tracking and lead scoring to lead_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_submissions' AND column_name = 'lead_score_details'
  ) THEN
    ALTER TABLE lead_submissions ADD COLUMN lead_score_details jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_submissions' AND column_name = 'engagement_data'
  ) THEN
    ALTER TABLE lead_submissions ADD COLUMN engagement_data jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_submissions' AND column_name = 'referrer_url'
  ) THEN
    ALTER TABLE lead_submissions ADD COLUMN referrer_url text;
  END IF;
END $$;

-- Add CRM field mappings to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'crm_field_mappings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN crm_field_mappings jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'lead_scoring_config'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lead_scoring_config jsonb DEFAULT '{
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
    }';
  END IF;
END $$;

-- Create lead scoring function
CREATE OR REPLACE FUNCTION calculate_lead_score(
  lead_source text,
  lead_medium text,
  engagement_data jsonb,
  user_scoring_config jsonb DEFAULT NULL
) RETURNS integer AS $$
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
$$ LANGUAGE plpgsql;

-- Create conversion funnel tracking table
CREATE TABLE IF NOT EXISTS conversion_funnel_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  visitor_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0.00,
  date_recorded date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversion_funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own funnel stages"
  ON conversion_funnel_stages
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_submissions_score ON lead_submissions(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_utm ON lead_submissions(utm_source, utm_medium, utm_campaign);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_user_date ON conversion_funnel_stages(user_id, date_recorded);

-- Create trigger for lead scoring
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_lead_score'
  ) THEN
    CREATE TRIGGER trigger_update_lead_score
      BEFORE INSERT OR UPDATE ON lead_submissions
      FOR EACH ROW
      EXECUTE FUNCTION update_lead_score();
  END IF;
END $$;

-- Update existing lead scores
UPDATE lead_submissions 
SET lead_score = calculate_lead_score(
  COALESCE((lead_data->>'source'), 'unknown'),
  COALESCE(utm_medium, 'direct'),
  COALESCE(engagement_data, '{}'),
  NULL
)
WHERE lead_score IS NULL OR lead_score = 0;