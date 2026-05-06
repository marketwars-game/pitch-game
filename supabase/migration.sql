-- =====================================================
-- FILE: supabase/migration.sql
-- PROJECT: pitch-game
-- TASK: T1 — Player View + Realtime
-- VERSION: T1-v1
-- CREATED: 2026-05-05
-- LAST MODIFIED: 2026-05-06
-- PURPOSE: DB schema (3 tables) + RLS + realtime + seed game row
--          Re-run safe (idempotent) — มี on conflict + UPDATE สำหรับ seed
--
-- CHANGE LOG:
--   T1-v1 (2026-05-06): เพิ่ม pitchMinLength=50 + pitchMaxLength=1500 ใน seed config
--                        เพิ่ม UPDATE block เพื่อ refresh seed config ที่มีอยู่ (re-run safe)
--   T0-v1 (2026-05-05): Initial schema
-- =====================================================
-- วิธีใช้:
-- 1. เปิด Supabase Dashboard → Project ของคุณ
-- 2. ไปที่ SQL Editor (เมนูซ้าย icon ฐานข้อมูล)
-- 3. กด "New query"
-- 4. Paste ทั้งหมดของไฟล์นี้
-- 5. กด "Run"
--
-- หมายเหตุ T1-v1: ถ้า run ซ้ำ จะ update config ของ seed game ให้มี
-- pitchMinLength + pitchMaxLength โดยอัตโนมัติ (ไม่ต้องลบ row เก่า)
-- =====================================================

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
-- (idempotent — ถ้ามีอยู่แล้ว throw แต่ไม่กระทบ data)
-- =====================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.games;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.players;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.submissions;
  exception when duplicate_object then null;
  end;
end $$;

-- =====================================================
-- Seed: สร้าง 1 game record สำหรับ testing
-- ใช้ fixed UUID เพื่อให้อ้างอิงได้จาก code (DEFAULT_GAME_ID ใน types.ts)
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
    'pitchMinLength', 50,
    'pitchMaxLength', 1500,
    'primaryColor', '#5DF591',
    'logoUrl', null
  )
)
on conflict (id) do nothing;

-- =====================================================
-- Re-run safe: update config ให้มี pitchMinLength/pitchMaxLength
-- (กรณี run T0-v1 ไปแล้ว seed เก่ายังไม่มี 2 fields นี้)
-- =====================================================
update public.games
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object(
       'writingTimeSeconds', coalesce((config->>'writingTimeSeconds')::int, 240),
       'pitchMinLength',     coalesce((config->>'pitchMinLength')::int, 50),
       'pitchMaxLength',     coalesce((config->>'pitchMaxLength')::int, 1500),
       'primaryColor',       coalesce(config->>'primaryColor', '#5DF591'),
       'logoUrl',            config->'logoUrl'
     )
where id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- เสร็จแล้ว!
-- ตรวจสอบ:
-- 1. Table Editor → ควรเห็น 3 tables: games, players, submissions
-- 2. games table ควรมี 1 row, config มี writingTimeSeconds + pitchMinLength + pitchMaxLength
-- 3. Database → Replication → ควรเห็น 3 tables เปิด realtime
-- =====================================================
