-- Create a public storage bucket for branding assets (idempotent)
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Public read access for files in the branding bucket
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Public read for branding'
  ) then
    create policy "Public read for branding"
      on storage.objects
      for select
      using (bucket_id = 'branding');
  end if;
end $$;

-- Allow users to upload only within their own folder (first path segment is their uid)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Users can upload to branding in their folder'
  ) then
    create policy "Users can upload to branding in their folder"
      on storage.objects
      for insert
      with check (
        bucket_id = 'branding'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Allow users to update only their own files in branding
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Users can update their branding files'
  ) then
    create policy "Users can update their branding files"
      on storage.objects
      for update
      using (
        bucket_id = 'branding'
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'branding'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Allow users to delete only their own files in branding
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
      and tablename = 'objects' 
      and policyname = 'Users can delete their branding files'
  ) then
    create policy "Users can delete their branding files"
      on storage.objects
      for delete
      using (
        bucket_id = 'branding'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Add branding image URL columns to profiles (idempotent)
alter table public.profiles
  add column if not exists headshot_url text,
  add column if not exists logo_url text;

-- Ensure RLS is enabled on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies (idempotent)
-- View own profile
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can view their own profile'
  ) then
    create policy "Users can view their own profile"
      on public.profiles
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Insert own profile
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
      on public.profiles
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Update own profile
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
      on public.profiles
      for update
      using (auth.uid() = user_id);
  end if;
end $$;