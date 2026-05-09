-- =====================================================
-- FILE: supabase/migration-T6.sql
-- PROJECT: pitch-game
-- TASK: T6 — Solo Mode (/try + /board)
-- VERSION: T6-v1
-- CREATED: 2026-05-09
-- PURPOSE: Add `solo_submissions` table for standalone Facebook-shared
--          play. Fully isolated from games/players/submissions schema —
--          no FK, no RLS dependency on existing tables.
-- =====================================================

-- Enable uuid extension if not already (T0 should already have this)
create extension if not exists "uuid-ossp";

-- =====================================================
-- Table: solo_submissions
-- =====================================================
create table if not exists solo_submissions (
  id              uuid primary key default uuid_generate_v4(),
  nickname        text not null check (char_length(nickname) between 1 and 20),
  pitch           text not null check (char_length(pitch) between 1 and 1500),
  stock_ticker    text not null default 'PLTR',
  scores          jsonb,
  judging_status  text not null default 'pending'
                  check (judging_status in ('pending', 'judging', 'done', 'failed')),
  auto_submitted  boolean not null default false,
  created_at      timestamptz not null default now()
);

comment on table solo_submissions is
  'Solo mode submissions from /try (Facebook viral). Independent of games/players.';

-- =====================================================
-- Indexes
-- =====================================================
-- Leaderboard sort (most queried — finalScore desc, then created_at desc for tie-break)
create index if not exists idx_solo_submissions_leaderboard
  on solo_submissions (
    ((scores->>'finalScore')::float) desc nulls last,
    created_at desc
  )
  where judging_status = 'done';

-- Realtime subscription filter (status changes for in-flight submissions)
create index if not exists idx_solo_submissions_status
  on solo_submissions (judging_status, created_at desc);

-- =====================================================
-- Realtime
-- =====================================================
alter publication supabase_realtime add table solo_submissions;

-- =====================================================
-- RLS — public read + insert; UPDATE only via service_role
-- =====================================================
alter table solo_submissions enable row level security;

create policy "solo_submissions_public_read"
  on solo_submissions for select
  using (true);

create policy "solo_submissions_public_insert"
  on solo_submissions for insert
  with check (
    char_length(nickname) between 1 and 20
    and char_length(pitch) between 1 and 1500
    and judging_status = 'pending'
    and scores is null
  );

-- No UPDATE policy for anon — only service_role (used by /api/judge-solo) can UPDATE.
-- No DELETE policy — submissions are permanent.

-- =====================================================
-- Verify
-- =====================================================
-- After running:
--   select count(*) from solo_submissions;  -- 0
--   select count(*) from pg_policies where tablename = 'solo_submissions';  -- 2
