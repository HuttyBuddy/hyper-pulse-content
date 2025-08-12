-- Add location fields to profiles for neighborhood and county context
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood_slug TEXT;