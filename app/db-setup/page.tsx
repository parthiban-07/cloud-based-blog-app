"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, testSupabaseRealtimeConnection } from "@/lib/supabase";
import { 
  Database, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  ArrowLeft,
  Radio,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const SQL_SCHEMA = `-- ==========================================================
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

-- Profiles RLS Policies
drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles" on public.profiles 
  for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles 
  for update using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles 
  for insert with check (auth.uid() = id);

-- Posts RLS Policies
drop policy if exists "public read published" on public.posts;
create policy "public read published" on public.posts 
  for select using (published = true or auth.uid() = author);

drop policy if exists "authors manage own" on public.posts;
create policy "authors manage own" on public.posts 
  for all using (auth.uid() = author);

-- Comments RLS Policies
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

-- 6. INDEXES
create index if not exists idx_posts_slug on public.posts (slug);
create index if not exists idx_posts_published on public.posts (published);
create index if not exists idx_comments_post_id on public.comments (post_id);

-- 7. ENABLE REALTIME BROADCASTING
-- Ensures Postgres sends real-time change events to connected clients
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.profiles;
`;

export default function DbSetupPage() {
  const [copied, setCopied] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    tested: boolean;
    restOk: boolean;
    realtimeOk: boolean;
    message: string;
    postsCount: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseRealtimeConnection();
      setDiagnostics({
        tested: true,
        restOk: res.restOk,
        realtimeOk: res.realtimeOk,
        message: res.message,
        postsCount: res.postsCount,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setDiagnostics({
        tested: true,
        restOk: false,
        realtimeOk: false,
        message: `Connection exception: ${errorMessage}`,
        postsCount: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-[#34d399]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home Feed</span>
        </Link>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-[#10b981]/30 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Supabase PostgreSQL + Realtime WebSockets</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Live Database Connection & Diagnostics
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Connected Project: <code className="text-[#34d399] font-mono">https://pgbypwayhefvowgohjny.supabase.co</code>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="btn-emerald inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold"
          >
            <Radio className="w-4 h-4 text-[#050b08]" />
            <span>{testing ? "Testing Realtime Handshake..." : "Run Realtime Diagnostics"}</span>
          </button>

          <button
            onClick={handleCopy}
            className="btn-glass inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono"
          >
            {copied ? <Check className="w-4 h-4 text-[#34d399]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "SQL Copied!" : "Copy SQL Migration Script"}</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/pgbypwayhefvowgohjny"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl glass-panel hover:border-[#10b981]/40 text-xs font-mono text-gray-300"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#fbbf24]" />
          </a>
        </div>

        {/* Diagnostics Results Panel */}
        {diagnostics && (
          <div className="p-5 rounded-2xl bg-[#050b08] border border-[#10b981]/30 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-white font-bold flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#fbbf24]" />
                <span>Supabase Live Connection Report</span>
              </span>
              <span className="text-gray-400 text-[11px]">{new Date().toLocaleTimeString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                {diagnostics.restOk ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className="text-gray-200">
                  Postgres REST API: <b className={diagnostics.restOk ? "text-[#34d399]" : "text-rose-400"}>{diagnostics.restOk ? "200 OK" : "Failed"}</b>
                </span>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                {diagnostics.realtimeOk ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className="text-gray-200">
                  WebSocket Realtime: <b className={diagnostics.realtimeOk ? "text-[#34d399]" : "text-rose-400"}>{diagnostics.realtimeOk ? "SUBSCRIBED" : "Pending"}</b>
                </span>
              </div>
            </div>

            <p className="text-gray-300 pt-1 text-[11px] leading-relaxed">
              {diagnostics.message}
            </p>
          </div>
        )}
      </div>

      {/* SQL Script Display */}
      <div className="glass-panel p-6 rounded-3xl border border-[#10b981]/20 space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-[#fbbf24]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#10b981]" />
            <span>supabase_schema.sql (Postgres Schema & Realtime Setup)</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-[#34d399] transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <pre className="p-6 rounded-2xl bg-[#040907] border border-gray-800 text-xs text-[#34d399] font-mono overflow-x-auto leading-relaxed max-h-[500px]">
          <code>{SQL_SCHEMA}</code>
        </pre>
      </div>
    </div>
  );
}
