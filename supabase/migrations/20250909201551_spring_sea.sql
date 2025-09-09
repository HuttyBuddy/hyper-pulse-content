/*
  # Add CRM Integration Fields to Profiles

  1. New Columns
    - `crm_type` (text) - Type of CRM system (hubspot, salesforce, pipedrive, etc.)
    - `crm_api_key` (text) - Encrypted API key for CRM authentication
    - `crm_settings` (jsonb) - Additional CRM-specific configuration settings

  2. Security
    - API keys stored securely in profiles table
    - Access controlled by existing RLS policies
    - Settings stored as flexible JSON for different CRM requirements

  3. Changes
    - Add three new columns to profiles table
    - Maintain existing table structure and constraints
*/

-- Add CRM integration fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS crm_type TEXT,
ADD COLUMN IF NOT EXISTS crm_api_key TEXT,
ADD COLUMN IF NOT EXISTS crm_settings JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.crm_type IS 'Type of CRM system integrated (hubspot, salesforce, pipedrive, etc.)';
COMMENT ON COLUMN public.profiles.crm_api_key IS 'Encrypted API key for CRM authentication';
COMMENT ON COLUMN public.profiles.crm_settings IS 'Additional CRM-specific configuration settings as JSON';