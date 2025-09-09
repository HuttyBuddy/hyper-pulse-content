-- Create content_history table for tracking user's generated content
CREATE TABLE public.content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'blog', 'social', 'lifestyle', 'newsletter'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  neighborhood TEXT,
  county TEXT,
  state TEXT,
  report_date DATE,
  template_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- Create policies for content_history
CREATE POLICY "Users can view their own content history" 
ON public.content_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content history" 
ON public.content_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content history" 
ON public.content_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content history" 
ON public.content_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create content_templates table for reusable templates
CREATE TABLE public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'blog', 'social', 'lifestyle'
  template_content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for content_templates
CREATE POLICY "Users can view their own templates and public templates" 
ON public.content_templates 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own templates" 
ON public.content_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.content_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.content_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Create trigger for timestamps on content_history
CREATE TRIGGER update_content_history_updated_at
BEFORE UPDATE ON public.content_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for timestamps on content_templates  
CREATE TRIGGER update_content_templates_updated_at
BEFORE UPDATE ON public.content_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();