-- Dungeon of Data: database schema for Supabase.
-- Run this once: Supabase dashboard > SQL Editor > New query > paste > Run. It is safe to run again.

-- 1. Private cloud saves: one row per account, readable only by its owner.
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint saves_size check (pg_column_size(data) < 200000)
);

-- 2. Public leaderboard: only these columns are ever shared.
create table if not exists public.leaderboard (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 20),
  color       text not null default '#f2b24d' check (color ~ '^#[0-9a-fA-F]{6}$'),
  xp          int  not null default 0 check (xp between 0 and 1000000),
  streak      int  not null default 0 check (streak between 0 and 4000),
  best_streak int  not null default 0 check (best_streak between 0 and 4000),
  stars       int  not null default 0 check (stars between 0 and 100),
  wins        int  not null default 0 check (wins between 0 and 100000),
  best_wpm    int  not null default 0 check (best_wpm between 0 and 300),
  public      boolean not null default true,
  updated_at  timestamptz not null default now()
);
create index if not exists leaderboard_xp_idx     on public.leaderboard (xp desc);
create index if not exists leaderboard_streak_idx on public.leaderboard (best_streak desc);
create index if not exists leaderboard_wpm_idx    on public.leaderboard (best_wpm desc);

-- 3. One row per player per day for the daily challenge ranking.
create table if not exists public.daily_scores (
  day     date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name    text not null check (char_length(name) between 1 and 20),
  color   text not null default '#f2b24d' check (color ~ '^#[0-9a-fA-F]{6}$'),
  room    text not null default '' check (char_length(room) <= 12),
  stars   int  not null default 0 check (stars between 0 and 3),
  public  boolean not null default true,
  primary key (day, user_id)
);
create index if not exists daily_scores_day_idx on public.daily_scores (day, stars desc);

-- Row level security: the browser holds the public "anon" key, so these policies ARE the security.
alter table public.saves        enable row level security;
alter table public.leaderboard  enable row level security;
alter table public.daily_scores enable row level security;

drop policy if exists "saves: owner all" on public.saves;
create policy "saves: owner all" on public.saves
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "leaderboard: read public or own" on public.leaderboard;
create policy "leaderboard: read public or own" on public.leaderboard
  for select to anon, authenticated using (public or auth.uid() = user_id);
drop policy if exists "leaderboard: owner write" on public.leaderboard;
create policy "leaderboard: owner write" on public.leaderboard
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily: read public or own" on public.daily_scores;
create policy "daily: read public or own" on public.daily_scores
  for select to anon, authenticated using (public or auth.uid() = user_id);
drop policy if exists "daily: owner write" on public.daily_scores;
create policy "daily: owner write" on public.daily_scores
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: scores are reported by the browser, so a determined cheater can edit their own row. The CHECK limits above cap
-- how far. For a competitive board, move score validation into an Edge Function that replays or signs results.
