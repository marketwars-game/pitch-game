-- =====================================================
-- FILE: supabase/migration-T2.sql
-- PROJECT: pitch-game
-- TASK: T2 — Admin Panel + Phase Control
-- VERSION: T2-v1
-- CREATED: 2026-05-06
-- LAST MODIFIED: 2026-05-06
-- PURPOSE: Add columns for multi-round + streaming judging + auto-default flag
--          Re-run safe (idempotent) — uses IF NOT EXISTS
--
-- CHANGE LOG:
--   T2-v1 (2026-05-06): Initial — adds round_number, judging_status, auto_defaulted
-- =====================================================
-- วิธีใช้:
-- 1. เปิด Supabase Dashboard → Project ของคุณ
-- 2. ไปที่ SQL Editor (เมนูซ้าย icon ฐานข้อมูล)
-- 3. กด "New query"
-- 4. Paste ทั้งหมดของไฟล์นี้
-- 5. กด "Run"
--
-- หมายเหตุ: ไฟล์นี้ไม่ลบ data รอบเก่า — เพิ่ม column ใหม่อย่างเดียว
-- =====================================================

-- =====================================================
-- 1. Multi-round support
-- =====================================================
-- เพิ่ม round_number ใน 3 tables — default = 1 สำหรับ data เดิม
alter table public.games
  add column if not exists round_number int not null default 1;

alter table public.players
  add column if not exists round_number int not null default 1;

alter table public.submissions
  add column if not exists round_number int not null default 1;

-- =====================================================
-- 2. Streaming judging status
-- =====================================================
-- judging_status: 'pending' | 'in_progress' | 'done' | 'failed'
alter table public.submissions
  add column if not exists judging_status text not null default 'pending';

-- เพิ่ม CHECK constraint (drop ก่อนถ้ามีจะได้ไม่ซ้ำ)
alter table public.submissions
  drop constraint if exists submissions_judging_status_check;

alter table public.submissions
  add constraint submissions_judging_status_check
  check (judging_status in ('pending', 'in_progress', 'done', 'failed'));

-- =====================================================
-- 3. Auto-default flag (admin-only)
-- =====================================================
-- auto_defaulted: true เมื่อ admin กด "ดำเนินต่อ" ใน Confirm Reveal
-- ทำให้ player คนนั้นได้ default score 0/10
alter table public.submissions
  add column if not exists auto_defaulted boolean not null default false;

-- =====================================================
-- 4. Indexes สำหรับ performance
-- =====================================================
-- Filter by round เกิดบ่อย (Player View, Admin Panel, Presenter View)
create index if not exists idx_players_game_round
  on public.players(game_id, round_number);

create index if not exists idx_submissions_game_round
  on public.submissions(game_id, round_number);

-- Filter by judging_status สำหรับ Admin progress tracker
create index if not exists idx_submissions_judging_status
  on public.submissions(game_id, round_number, judging_status);

-- =====================================================
-- 5. Update existing seed game (re-run safe)
-- =====================================================
-- ตรวจว่า round_number ของ seed game ถูกต้อง
update public.games
set round_number = coalesce(round_number, 1)
where id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- เสร็จแล้ว! ตรวจสอบ:
-- 1. Table Editor → games → ควรเห็น column round_number = 1
-- 2. Table Editor → submissions → ควรเห็น 3 columns ใหม่:
--    round_number, judging_status, auto_defaulted
-- 3. Database → Indexes → ควรเห็น 3 indexes ใหม่
-- =====================================================
