-- Create profiles table to store user profile info and API keys
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  google_api_key text,
  headshot_url text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies for user access
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for automatic timestamp updates
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();