-- Create content_analytics table to track performance metrics
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NULL, -- references content_history or social_media_posts
  content_type TEXT NOT NULL, -- 'newsletter', 'blog', 'social_post', 'market_report'
  event_type TEXT NOT NULL, -- 'view', 'click', 'download', 'share', 'email_open', 'email_click', 'lead_generated'
  event_data JSONB NULL DEFAULT '{}', -- additional event metadata
  user_agent TEXT NULL,
  ip_address INET NULL,
  referrer TEXT NULL,
  utm_source TEXT NULL,
  utm_medium TEXT NULL,
  utm_campaign TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_capture_forms table for embedded forms
CREATE TABLE public.lead_capture_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_name TEXT NOT NULL,
  form_type TEXT NOT NULL, -- 'property_valuation', 'market_report', 'newsletter_signup', 'consultation_request'
  form_config JSONB NOT NULL DEFAULT '{}', -- form fields and settings
  embed_code TEXT NOT NULL, -- HTML/JS embed code
  landing_page_url TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_submissions table to store form submissions
CREATE TABLE public.lead_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_id UUID NOT NULL REFERENCES public.lead_capture_forms(id) ON DELETE CASCADE,
  lead_data JSONB NOT NULL DEFAULT '{}', -- submitted form data (name, email, phone, etc.)
  source_url TEXT NULL,
  utm_source TEXT NULL,
  utm_medium TEXT NULL,
  utm_campaign TEXT NULL,
  lead_score INTEGER NULL DEFAULT 0, -- calculated lead quality score
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'closed'
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_campaigns table to track newsletter sends
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  content_id UUID NULL, -- references content_history or newsletter_drafts
  subject_line TEXT NOT NULL,
  preview_text TEXT NULL,
  sender_name TEXT NULL,
  sender_email TEXT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduled_at TIMESTAMP WITH TIME ZONE NULL,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  open_rate DECIMAL(5,2) NULL DEFAULT 0.00,
  click_rate DECIMAL(5,2) NULL DEFAULT 0.00,
  bounce_rate DECIMAL(5,2) NULL DEFAULT 0.00,
  unsubscribe_rate DECIMAL(5,2) NULL DEFAULT 0.00,
  campaign_settings JSONB NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_recipients table for tracking individual email interactions
CREATE TABLE public.email_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'bounced', 'failed'
  opened_at TIMESTAMP WITH TIME ZONE NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NULL,
  bounce_reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversion_tracking table for ROI measurement
CREATE TABLE public.conversion_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NULL REFERENCES public.lead_submissions(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL, -- 'listing_signed', 'buyer_consultation', 'property_sold', 'referral'
  conversion_value DECIMAL(12,2) NULL, -- dollar value of the conversion
  attribution_source TEXT NULL, -- which content/campaign generated this
  attribution_data JSONB NULL DEFAULT '{}',
  conversion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_capture_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_analytics
CREATE POLICY "Users can view their own analytics"
ON public.content_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics"
ON public.content_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for lead_capture_forms
CREATE POLICY "Users can view their own forms"
ON public.lead_capture_forms FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms"
ON public.lead_capture_forms FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
ON public.lead_capture_forms FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
ON public.lead_capture_forms FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for lead_submissions
CREATE POLICY "Users can view their own lead submissions"
ON public.lead_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create lead submissions"
ON public.lead_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead submissions"
ON public.lead_submissions FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for email_campaigns
CREATE POLICY "Users can view their own campaigns"
ON public.email_campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
ON public.email_campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
ON public.email_campaigns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
ON public.email_campaigns FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for email_recipients
CREATE POLICY "Users can view their own email recipients"
ON public.email_recipients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email recipients"
ON public.email_recipients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email recipients"
ON public.email_recipients FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for conversion_tracking
CREATE POLICY "Users can view their own conversions"
ON public.conversion_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversions"
ON public.conversion_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions"
ON public.conversion_tracking FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversions"
ON public.conversion_tracking FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_content_analytics_user_id ON public.content_analytics(user_id);
CREATE INDEX idx_content_analytics_content_id ON public.content_analytics(content_id);
CREATE INDEX idx_content_analytics_event_type ON public.content_analytics(event_type);
CREATE INDEX idx_content_analytics_created_at ON public.content_analytics(created_at);

CREATE INDEX idx_lead_capture_forms_user_id ON public.lead_capture_forms(user_id);
CREATE INDEX idx_lead_capture_forms_form_type ON public.lead_capture_forms(form_type);

CREATE INDEX idx_lead_submissions_user_id ON public.lead_submissions(user_id);
CREATE INDEX idx_lead_submissions_form_id ON public.lead_submissions(form_id);
CREATE INDEX idx_lead_submissions_status ON public.lead_submissions(status);
CREATE INDEX idx_lead_submissions_created_at ON public.lead_submissions(created_at);

CREATE INDEX idx_email_campaigns_user_id ON public.email_campaigns(user_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_sent_at ON public.email_campaigns(sent_at);

CREATE INDEX idx_email_recipients_campaign_id ON public.email_recipients(campaign_id);
CREATE INDEX idx_email_recipients_user_id ON public.email_recipients(user_id);
CREATE INDEX idx_email_recipients_delivery_status ON public.email_recipients(delivery_status);

CREATE INDEX idx_conversion_tracking_user_id ON public.conversion_tracking(user_id);
CREATE INDEX idx_conversion_tracking_lead_id ON public.conversion_tracking(lead_id);
CREATE INDEX idx_conversion_tracking_conversion_date ON public.conversion_tracking(conversion_date);

-- Create triggers for updated_at columns
CREATE TRIGGER update_lead_capture_forms_updated_at
BEFORE UPDATE ON public.lead_capture_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_submissions_updated_at
BEFORE UPDATE ON public.lead_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_recipients_updated_at
BEFORE UPDATE ON public.email_recipients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversion_tracking_updated_at
BEFORE UPDATE ON public.conversion_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();