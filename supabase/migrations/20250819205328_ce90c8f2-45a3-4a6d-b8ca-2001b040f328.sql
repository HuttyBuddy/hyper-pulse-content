-- Create table for storing newsletter drafts
CREATE TABLE public.newsletter_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  branding_preferences JSONB DEFAULT '{"appendBranding": true}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own drafts" 
ON public.newsletter_drafts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts" 
ON public.newsletter_drafts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
ON public.newsletter_drafts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" 
ON public.newsletter_drafts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_newsletter_drafts_updated_at
BEFORE UPDATE ON public.newsletter_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();