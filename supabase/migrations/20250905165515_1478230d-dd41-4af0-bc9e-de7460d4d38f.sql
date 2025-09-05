-- Fix missing DELETE policies for sensitive data tables
CREATE POLICY "Users can delete their own newsletter subscribers" 
ON public.newsletter_subscribers 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email recipients" 
ON public.email_recipients 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead submissions" 
ON public.lead_submissions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead generation tracking" 
ON public.lead_generation_tracking 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix missing UPDATE/DELETE policies for analytics tables
CREATE POLICY "Users can update their own social media analytics" 
ON public.social_media_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social media analytics" 
ON public.social_media_analytics 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content analytics" 
ON public.content_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content analytics" 
ON public.content_analytics 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content performance" 
ON public.content_performance 
FOR DELETE 
USING (auth.uid() = user_id);