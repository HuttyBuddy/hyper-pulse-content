-- Create social media posts table for scheduling and tracking
CREATE TABLE public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_history_id UUID,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  post_content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  platform_post_id TEXT,
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for social media posts
CREATE POLICY "Users can view their own social media posts" 
ON public.social_media_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social media posts" 
ON public.social_media_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social media posts" 
ON public.social_media_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social media posts" 
ON public.social_media_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create social media templates table
CREATE TABLE public.social_media_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  template_content TEXT NOT NULL,
  hashtags TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE public.social_media_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for social media templates
CREATE POLICY "Users can view their own templates and public templates" 
ON public.social_media_templates 
FOR SELECT 
USING ((auth.uid() = user_id) OR (is_public = true));

CREATE POLICY "Users can create their own templates" 
ON public.social_media_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.social_media_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.social_media_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create social media analytics table
CREATE TABLE public.social_media_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  social_media_post_id UUID NOT NULL REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analytics
ALTER TABLE public.social_media_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics
CREATE POLICY "Users can view their own analytics" 
ON public.social_media_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
ON public.social_media_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_social_media_posts_updated_at
BEFORE UPDATE ON public.social_media_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_templates_updated_at
BEFORE UPDATE ON public.social_media_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_social_media_posts_user_id ON public.social_media_posts(user_id);
CREATE INDEX idx_social_media_posts_scheduled_at ON public.social_media_posts(scheduled_at);
CREATE INDEX idx_social_media_posts_platform ON public.social_media_posts(platform);
CREATE INDEX idx_social_media_posts_status ON public.social_media_posts(status);
CREATE INDEX idx_social_media_templates_user_id ON public.social_media_templates(user_id);
CREATE INDEX idx_social_media_templates_platform ON public.social_media_templates(platform);
CREATE INDEX idx_social_media_analytics_user_id ON public.social_media_analytics(user_id);
CREATE INDEX idx_social_media_analytics_post_id ON public.social_media_analytics(social_media_post_id);