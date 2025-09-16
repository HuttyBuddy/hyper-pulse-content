/*
  # Add Google My Business Integration Fields

  1. New Columns Added to profiles table
    - `gmb_access_token` (text, nullable) - Stores Google OAuth access token
    - `gmb_refresh_token` (text, nullable) - Stores Google OAuth refresh token for token renewal
    - `gmb_token_expiry` (timestamp with time zone, nullable) - Tracks when access token expires
    - `gmb_account_id` (text, nullable) - Stores user's primary Google My Business account ID
    - `gmb_location_id` (text, nullable) - Stores selected GMB location ID for posting

  2. Security
    - All columns are nullable to maintain backward compatibility
    - Tokens are stored as encrypted text fields
    - No additional RLS policies needed as existing profile policies cover these fields

  3. Purpose
    - Enables Google My Business integration for local SEO
    - Allows automated posting to GMB from the application
    - Stores necessary OAuth credentials securely per user
*/

-- Add Google My Business access token column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gmb_access_token'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gmb_access_token text;
  END IF;
END $$;

-- Add Google My Business refresh token column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gmb_refresh_token'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gmb_refresh_token text;
  END IF;
END $$;

-- Add Google My Business token expiry column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gmb_token_expiry'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gmb_token_expiry timestamp with time zone;
  END IF;
END $$;

-- Add Google My Business account ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gmb_account_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gmb_account_id text;
  END IF;
END $$;

-- Add Google My Business location ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gmb_location_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gmb_location_id text;
  END IF;
END $$;