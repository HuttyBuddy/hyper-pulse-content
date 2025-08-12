-- Create market_reports table to store accurate, dated metrics with sources
CREATE TABLE IF NOT EXISTS public.market_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_type text NOT NULL CHECK (location_type IN ('neighborhood','county')),
  neighborhood text,
  neighborhood_slug text,
  county text,
  state text,
  report_date date NOT NULL,
  -- Core metrics
  days_on_market numeric,
  active_listings integer,
  closed_sales integer,
  avg_price_per_sqft numeric,
  median_sale_price numeric,
  new_listings integer,
  months_of_inventory numeric,
  -- Changes and metadata
  mom_change jsonb,
  yoy_change jsonb,
  sources jsonb,              -- e.g. [{"url":"...","label":"MLS","retrieved_at":"..."}]
  retrieved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;

-- Policies: users manage only their own reports
CREATE POLICY IF NOT EXISTS "Users can view their own reports"
ON public.market_reports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own reports"
ON public.market_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own reports"
ON public.market_reports
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own reports"
ON public.market_reports
FOR DELETE
USING (auth.uid() = user_id);

-- Update updated_at automatically
DROP TRIGGER IF EXISTS update_market_reports_updated_at ON public.market_reports;
CREATE TRIGGER update_market_reports_updated_at
BEFORE UPDATE ON public.market_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_market_reports_user_date
  ON public.market_reports(user_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_market_reports_location
  ON public.market_reports(location_type, neighborhood_slug, county, state);

CREATE INDEX IF NOT EXISTS idx_market_reports_user_location_date
  ON public.market_reports(user_id, location_type, neighborhood_slug, county, state, report_date);

-- Prevent duplicates for the same location and date per user
DROP INDEX IF EXISTS uniq_market_report_per_location_date;
CREATE UNIQUE INDEX uniq_market_report_per_location_date
ON public.market_reports(
  user_id,
  location_type,
  coalesce(neighborhood_slug, ''),
  coalesce(county, ''),
  coalesce(state, ''),
  report_date
);
