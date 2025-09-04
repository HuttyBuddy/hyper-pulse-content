-- Create enhanced images table for image management and enhancement history
CREATE TABLE public.enhanced_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_filename TEXT NOT NULL,
  original_url TEXT NOT NULL,
  enhanced_url TEXT,
  enhancement_preset TEXT,
  enhancement_settings JSONB,
  tags TEXT[],
  category TEXT DEFAULT 'lifestyle',
  file_size INTEGER,
  dimensions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.enhanced_images ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own images" 
ON public.enhanced_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own images" 
ON public.enhanced_images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" 
ON public.enhanced_images 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
ON public.enhanced_images 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_enhanced_images_updated_at
BEFORE UPDATE ON public.enhanced_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create enhanced storage bucket for organized image management
INSERT INTO storage.buckets (id, name, public) VALUES ('enhanced-images', 'enhanced-images', true);

-- Create policies for enhanced images storage
CREATE POLICY "Users can view their own enhanced images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'enhanced-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own enhanced images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'enhanced-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own enhanced images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'enhanced-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own enhanced images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'enhanced-images' AND auth.uid()::text = (storage.foldername(name))[1]);