-- =====================================================
-- FILE: supabase/migration.sql — Pitch Game DB Schema
-- VERSION: T0-v1 — Initial schema for T0 setup
-- LAST MODIFIED: 2026-05-05
-- =====================================================
-- วิธีใช้:
-- 1. เปิด Supabase Dashboard → Project ของคุณ
-- 2. ไปที่ SQL Editor (เมนูซ้าย icon ฐานข้อมูล)
-- 3. กด "New query"
-- 4. Paste ทั้งหมดของไฟล์นี้
-- 5. กด "Run"
-- =====================================================

-- เปิด extension uuid (Supabase เปิดให้แล้วโดยปริยาย แต่กันลืม)
create extension if not exists "uuid-ossp";

-- =====================================================
-- Table: games
-- =====================================================
create table if not exists public.games (
  id          uuid primary key default uuid_generate_v4(),
  phase       text not null default 'LOBBY'
    check (phase in ('LOBBY','WRITING','JUDGING','RESULTS')),
  stock       jsonb,
  config      jsonb,
  writing_started_at  timestamptz,
  writing_ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- =====================================================
-- Table: players
-- =====================================================
create table if not exists public.players (
  id          uuid primary key default uuid_generate_v4(),
  game_id     uuid not null references public.games(id) on delete cascade,
  nickname    text not null,
  joined_at   timestamptz not null default now()
);

create index if not exists idx_players_game_id on public.players(game_id);

-- =====================================================
-- Table: submissions
-- =====================================================
create table if not exists public.submissions (
  id              uuid primary key default uuid_generate_v4(),
  game_id         uuid not null references public.games(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  pitch           text not null,
  submitted_at    timestamptz not null default now(),
  auto_submitted  boolean not null default false,
  scores          jsonb
);

create index if not exists idx_submissions_game_id on public.submissions(game_id);
create index if not exists idx_submissions_player_id on public.submissions(player_id);
create unique index if not exists idx_submissions_unique_player
  on public.submissions(game_id, player_id);

-- =====================================================
-- Row Level Security
-- เปิด RLS แต่ใช้ permissive policy สำหรับ MVP
-- (event-only app, ไม่มี user authentication)
-- =====================================================
alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.submissions enable row level security;

-- Policies: anon + authenticated สามารถ read/write ได้ทั้งหมด
-- (เนื่องจากเป็น event app ไม่มี multi-tenant)

drop policy if exists "games_all_anon" on public.games;
create policy "games_all_anon" on public.games
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "players_all_anon" on public.players;
create policy "players_all_anon" on public.players
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "submissions_all_anon" on public.submissions;
create policy "submissions_all_anon" on public.submissions
  for all to anon, authenticated
  using (true) with check (true);

-- =====================================================
-- Enable Realtime on all 3 tables
-- =====================================================
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.submissions;

-- =====================================================
-- Seed: สร้าง 1 game record สำหรับ T1 testing
-- ใช้ fixed UUID เพื่อให้อ้างอิงได้จาก code
-- =====================================================
insert into public.games (id, phase, stock, config)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'LOBBY',
  jsonb_build_object(
    'name', 'NVIDIA Corporation',
    'ticker', 'NVDA',
    'exchange', 'NASDAQ',
    'price', '$131.29',
    'ytdChange', '-2.3%',
    'description', 'ผู้นำด้านชิปประมวลผล GPU สำหรับ AI, gaming, data center',
    'marketCap', '$3.21T',
    'peRatio', '39.3x',
    'revenueGrowth', '+114%',
    'news', jsonb_build_array(
      'เปิดตัว Blackwell Ultra สำหรับ AI Training'
    )
  ),
  jsonb_build_object(
    'writingTimeSeconds', 240,
    'primaryColor', '#1a1a2e',
    'logoUrl', null
  )
)
on conflict (id) do nothing;

-- =====================================================
-- Done!
-- ตรวจสอบ:
-- 1. ไปที่ Table Editor → ควรเห็น 3 tables: games, players, submissions
-- 2. ควรเห็น 1 row ใน games table
-- 3. ไปที่ Database → Replication → ควรเห็น 3 tables เปิด realtime
-- =====================================================
