/*
  # CRM Integration and Shared Reports Schema

  1. New Tables
    - `shared_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `report_type` (text, content_package or analytics_dashboard)
      - `source_id` (uuid, references content_history.id)
      - `share_url` (text, unique shareable URL)
      - `access_token` (text, unique token for secure access)
      - `title` (text, report title)
      - `description` (text, report description)
      - `expires_at` (timestamp, optional expiration)
      - `is_active` (boolean, active status)
      - `view_count` (integer, tracking views)
      - `report_config` (jsonb, report settings)
      - `branding_config` (jsonb, branding preferences)

  2. Profile Updates
    - Add CRM integration fields to profiles table
    - `crm_type` (text, CRM system type)
    - `crm_api_key` (text, encrypted API key)
    - `crm_settings` (jsonb, CRM-specific configuration)

  3. Security
    - Enable RLS on shared_reports table
    - Add policies for user access and public sharing
    - Create storage bucket for shared report files
    - Add storage policies for secure file access

  4. Performance
    - Add indexes for common query patterns
    - Create helper functions for view tracking
*/

-- Add CRM fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'crm_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN crm_type TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'crm_api_key'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN crm_api_key TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'crm_settings'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN crm_settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add comments to CRM fields
COMMENT ON COLUMN public.profiles.crm_type IS 'Type of CRM system integrated (hubspot, salesforce, pipedrive, etc.)';
COMMENT ON COLUMN public.profiles.crm_api_key IS 'Encrypted API key for CRM authentication';
COMMENT ON COLUMN public.profiles.crm_settings IS 'Additional CRM-specific configuration settings as JSON';

-- Create shared_reports table
CREATE TABLE IF NOT EXISTS public.shared_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('content_package', 'analytics_dashboard')),
    source_id UUID, -- References content_history.id or other relevant tables
    share_url TEXT UNIQUE NOT NULL,
    access_token TEXT UNIQUE, -- For secure sharing
    title TEXT NOT NULL,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    view_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    report_config JSONB NOT NULL DEFAULT '{}', -- Stores specific settings for the report/dashboard
    branding_config JSONB DEFAULT '{}' -- Stores user branding preferences
);

-- Add foreign key constraint to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shared_reports_user_id_fkey'
  ) THEN
    ALTER TABLE public.shared_reports 
    ADD CONSTRAINT shared_reports_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_reports table
CREATE POLICY "Users can view their own shared reports" ON public.shared_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shared reports" ON public.shared_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared reports" ON public.shared_reports
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared reports" ON public.shared_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Public access policy for shared reports (read-only via access_token)
CREATE POLICY "Public can view active shared reports with valid token" ON public.shared_reports
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
    );

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_shared_reports_user_type ON public.shared_reports (user_id, report_type);
CREATE INDEX IF NOT EXISTS idx_shared_reports_share_url ON public.shared_reports (share_url);
CREATE INDEX IF NOT EXISTS idx_shared_reports_access_token ON public.shared_reports (access_token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_active_unexpired ON public.shared_reports (is_active, expires_at) WHERE is_active = true;

-- Function to update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_shared_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_shared_reports_updated_at
        BEFORE UPDATE ON public.shared_reports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_report_view_count(report_token TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.shared_reports 
    SET view_count = view_count + 1 
    WHERE access_token = report_token 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for shared reports (execute if bucket doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shared-reports', 'shared-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shared reports bucket
DO $$
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own shared reports'
  ) THEN
    CREATE POLICY "Users can upload their own shared reports" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'shared-reports' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own shared reports'
  ) THEN
    CREATE POLICY "Users can view their own shared reports" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'shared-reports' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view shared report files'
  ) THEN
    CREATE POLICY "Public can view shared report files" ON storage.objects
        FOR SELECT USING (bucket_id = 'shared-reports');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own shared reports'
  ) THEN
    CREATE POLICY "Users can update their own shared reports" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'shared-reports' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own shared reports'
  ) THEN
    CREATE POLICY "Users can delete their own shared reports" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'shared-reports' 
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
  END IF;
END $$;