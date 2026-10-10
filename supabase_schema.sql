-- ==========================================================
-- CLOUD-BASED BLOG PLATFORM SUPABASE DATABASE SCHEMA (SQL)
-- Execute this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==========================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text check (role in ('admin', 'writer', 'reader')) default 'writer',
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. POSTS TABLE
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  markdown text not null,
  published boolean default false,
  tags text[] default '{}',
  cover_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- 4. ROW-LEVEL SECURITY (RLS) SETUP
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Profiles Policies
drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles" on public.profiles 
  for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles 
  for update using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles 
  for insert with check (auth.uid() = id);

-- Posts Policies
drop policy if exists "public read published" on public.posts;
create policy "public read published" on public.posts 
  for select using (published = true or auth.uid() = author);

drop policy if exists "authors manage own" on public.posts;
create policy "authors manage own" on public.posts 
  for all using (auth.uid() = author);

-- Comments Policies
drop policy if exists "comment read" on public.comments;
create policy "comment read" on public.comments 
  for select using (true);

drop policy if exists "comment write" on public.comments;
create policy "comment write" on public.comments 
  for insert with check (auth.uid() = user_id);

drop policy if exists "comment delete own" on public.comments;
create policy "comment delete own" on public.comments 
  for delete using (auth.uid() = user_id);

-- 5. AUTOMATIC PROFILE CREATION TRIGGER FOR SIGNUPS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'writer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. INDEXES FOR PERFORMANCE
create index if not exists idx_posts_slug on public.posts (slug);
create index if not exists idx_posts_published on public.posts (published);
create index if not exists idx_comments_post_id on public.comments (post_id);

-- 7. ENABLE REALTIME BROADCASTING
-- Ensures Postgres sends real-time change events to connected clients
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.profiles;
