-- Create analytics dashboard tables for comprehensive lead tracking and ROI measurement

-- Content performance tracking table
CREATE TABLE public.content_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_history_id UUID REFERENCES public.content_history(id),
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  time_on_page NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  shares INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_performance
CREATE POLICY "Users can view their own content performance" 
ON public.content_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content performance" 
ON public.content_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content performance" 
ON public.content_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Lead generation tracking table  
CREATE TABLE public.lead_generation_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_source TEXT NOT NULL, -- 'newsletter_signup', 'property_valuation', 'consultation_request', 'download'
  lead_medium TEXT, -- 'blog_post', 'social_media', 'email_campaign', 'direct'
  content_id UUID, -- Reference to content that generated the lead
  lead_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  lead_value NUMERIC DEFAULT 0, -- Estimated or actual value of lead
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_generation_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_generation_tracking
CREATE POLICY "Users can view their own leads" 
ON public.lead_generation_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" 
ON public.lead_generation_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.lead_generation_tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Newsletter subscriber management
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Agent who owns this subscriber
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  property_interests TEXT[], -- Array of property types/neighborhoods
  subscription_source TEXT, -- How they subscribed
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_preferences JSONB DEFAULT '{}'::jsonb,
  tags TEXT[], -- For segmentation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Users can view their own subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscribers" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscribers" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Campaign performance tracking
CREATE TABLE public.campaign_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'email', 'social_media', 'content', 'print'
  campaign_id UUID, -- Reference to email_campaigns or social_media_posts
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0, -- Return on Investment
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_performance
CREATE POLICY "Users can view their own campaign performance" 
ON public.campaign_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaign performance" 
ON public.campaign_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaign performance" 
ON public.campaign_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_content_performance_updated_at
BEFORE UPDATE ON public.content_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_generation_tracking_updated_at
BEFORE UPDATE ON public.lead_generation_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_performance_updated_at
BEFORE UPDATE ON public.campaign_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_content_performance_user_date ON public.content_performance(user_id, date_recorded);
CREATE INDEX idx_lead_generation_tracking_user_status ON public.lead_generation_tracking(user_id, status);
CREATE INDEX idx_newsletter_subscribers_user_active ON public.newsletter_subscribers(user_id, is_active);
CREATE INDEX idx_campaign_performance_user_type ON public.campaign_performance(user_id, campaign_type);