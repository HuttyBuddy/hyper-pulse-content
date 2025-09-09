-- Add brokerage_logo_url column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS brokerage_logo_url TEXT;