// =====================================================
// FILE: src/lib/sound.ts
// PROJECT: pitch-game
// TASK: T11 — LINE หาพี่ชัวร์ (DIME x BU · FinTech & Digital Investment)
// VERSION: T11-v1
// CREATED: 2026-11-26
// LAST MODIFIED: 2026-11-26
// PURPOSE: ทะเบียนไฟล์เสียงของจอใหญ่ (Presenter) — BGM 4 เพลง + SFX 9 เสียง
//          ยกโครงมาจาก market-wars lib/sound.ts (B16d-v1) ใช้ไฟล์เสียงชุดเดียวกัน
//          ไฟล์อยู่ที่ /public/sounds/<key>.mp3 — ไฟล์ไหนโหลดไม่ได้ = เงียบ ไม่พัง
//          เสียงเล่นเฉพาะจอใหญ่ ไม่มีเสียงบนมือถือผู้เล่น
//
// CHANGE LOG:
//   T11-v1 (2026-11-26): Initial — port จาก market-wars + phase map ของ pitch-game
// =====================================================
import type { GamePhase } from '@/lib/types';

export const SOUND_BASE = '/sounds';

export type BgmKey = 'bgm_lobby' | 'bgm_play' | 'bgm_suspense' | 'bgm_final';

export const BGM_FILES: Record<BgmKey, string> = {
  bgm_lobby: `${SOUND_BASE}/bgm_lobby.mp3`,
  bgm_play: `${SOUND_BASE}/bgm_play.mp3`,
  bgm_suspense: `${SOUND_BASE}/bgm_suspense.mp3`,
  bgm_final: `${SOUND_BASE}/bgm_final.mp3`,
};

export type SfxKey =
  | 'sfx_transition'
  | 'sfx_market_bell'
  | 'sfx_countdown'
  | 'sfx_timeup'
  | 'sfx_join'
  | 'sfx_drumroll'
  | 'sfx_reveal'
  | 'sfx_fanfare'
  | 'sfx_confetti';

export const SFX_FILES: Record<SfxKey, string> = {
  sfx_transition: `${SOUND_BASE}/sfx_transition.mp3`,
  sfx_market_bell: `${SOUND_BASE}/sfx_market_bell.mp3`,
  sfx_countdown: `${SOUND_BASE}/sfx_countdown.mp3`,
  sfx_timeup: `${SOUND_BASE}/sfx_timeup.mp3`,
  sfx_join: `${SOUND_BASE}/sfx_join.mp3`,
  sfx_drumroll: `${SOUND_BASE}/sfx_drumroll.mp3`,
  sfx_reveal: `${SOUND_BASE}/sfx_reveal.mp3`,
  sfx_fanfare: `${SOUND_BASE}/sfx_fanfare.mp3`,
  sfx_confetti: `${SOUND_BASE}/sfx_confetti.mp3`,
};

// phase → เพลงพื้นหลัง (RESULTS เริ่มที่ suspense แล้วเปลี่ยนเป็น final ตอนเปิดแชมป์)
export const PHASE_BGM: Record<GamePhase, BgmKey> = {
  LOBBY: 'bgm_lobby',
  WRITING: 'bgm_play',
  JUDGING: 'bgm_suspense',
  RESULTS: 'bgm_suspense',
};

// BGM เบากว่า SFX — วิทยากรต้องพูดทับได้
export const BGM_VOLUME = 0.35;
export const SFX_VOLUME = 0.9;
export const BGM_FADE_MS = 800;

// เสียงคนเข้าห้อง: ไม่เกิน 1 ครั้งต่อช่วงนี้ (180 คนเข้าไล่กัน ไม่ให้รัว)
export const JOIN_SFX_MIN_GAP_MS = 1200;
// บี๊บนับถอยหลังช่วงท้ายของเวลาเขียน
export const COUNTDOWN_BEEP_FROM_SEC = 10;
// ปุ่มปิด/เปิดเสียงบนจอใหญ่
export const MUTE_KEY = 'KeyM';
