// =====================================================
// FILE: src/components/presenter/PresenterSoundDirector.tsx
// PROJECT: pitch-game
// TASK: T11 — LINE หาพี่ชัวร์ (DIME x BU · FinTech & Digital Investment)
// VERSION: T11-v1
// CREATED: 2026-11-26
// LAST MODIFIED: 2026-11-26
// PURPOSE: ผู้กำกับเสียงของจอใหญ่ — ดู phase / จำนวนคน / เวลาที่เหลือ แล้วสั่งเสียง
//          ไม่ render อะไรนอกจากป้าย "ปิดเสียง" ตอน mute
//          - LOBBY:   bgm_lobby · มีคนเข้า = sfx_join (จำกัดความถี่)
//          - WRITING: sfx_market_bell ตอนเริ่ม → bgm_play · 10 วิสุดท้าย sfx_countdown
//          - JUDGING: sfx_timeup ตอนปิดรับ → bgm_suspense
//          - RESULTS: sfx_drumroll ตอนเข้า · ที่เหลือสั่งจาก PresenterResultsScreen (onRevealStep)
//          - กด M = ปิด/เปิดเสียง
//
// CHANGE LOG:
//   T11-v1 (2026-11-26): Initial
// =====================================================
'use client';

import { useEffect, useRef } from 'react';
import type { GamePhase } from '@/lib/types';
import type { PresenterSound } from '@/hooks/usePresenterSound';
import {
  PHASE_BGM,
  JOIN_SFX_MIN_GAP_MS,
  COUNTDOWN_BEEP_FROM_SEC,
  MUTE_KEY,
} from '@/lib/sound';

type Props = {
  sound: PresenterSound;
  /** true เมื่อพ้นหน้า landing แล้ว (= มี user gesture ปลดล็อกเสียงแล้ว) */
  active: boolean;
  phase: GamePhase | null;
  playerCount: number;
  writingEndsAt: string | null;
};

export function PresenterSoundDirector({
  sound,
  active,
  phase,
  playerCount,
  writingEndsAt,
}: Props) {
  const { isUnlocked, muted, playBgm, playSfx, toggleMute } = sound;
  const ready = active && isUnlocked;

  // ---------- phase → BGM + เสียงเปลี่ยน phase ----------
  const prevPhaseRef = useRef<GamePhase | null>(null);
  useEffect(() => {
    if (!ready || !phase) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // เสียงเปลี่ยนจังหวะ — เฉพาะตอน "เปลี่ยน" จริง ไม่ใช่ตอนเปิดหน้าครั้งแรก
    if (prev !== null && prev !== phase) {
      if (phase === 'WRITING') playSfx('sfx_market_bell');
      else if (phase === 'JUDGING') playSfx('sfx_timeup');
      else if (phase === 'RESULTS') playSfx('sfx_drumroll');
      else if (phase === 'LOBBY') playSfx('sfx_transition');
    }
    playBgm(PHASE_BGM[phase]);
  }, [ready, phase, playBgm, playSfx]);

  // ---------- คนเข้าห้อง (LOBBY) ----------
  const prevCountRef = useRef<number | null>(null);
  const lastJoinSfxRef = useRef(0);
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = playerCount;
    if (!ready || phase !== 'LOBBY' || prev === null) return;
    if (playerCount > prev) {
      const now = Date.now();
      if (now - lastJoinSfxRef.current >= JOIN_SFX_MIN_GAP_MS) {
        lastJoinSfxRef.current = now;
        playSfx('sfx_join');
      }
    }
  }, [ready, phase, playerCount, playSfx]);

  // ---------- นับถอยหลังช่วงท้ายของเวลาเขียน ----------
  useEffect(() => {
    if (!ready || phase !== 'WRITING' || !writingEndsAt) return;
    const endMs = new Date(writingEndsAt).getTime();
    if (!isFinite(endMs)) return;
    let lastBeep = -1;
    const tick = () => {
      const left = Math.ceil((endMs - Date.now()) / 1000);
      if (left >= 1 && left <= COUNTDOWN_BEEP_FROM_SEC && left !== lastBeep) {
        lastBeep = left;
        playSfx('sfx_countdown');
      }
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [ready, phase, writingEndsAt, playSfx]);

  // ---------- ปุ่ม M ปิด/เปิดเสียง ----------
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === MUTE_KEY) toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, toggleMute]);

  if (!muted) return null;
  return (
    <div
      style={{
        position: 'fixed',
        right: 14,
        bottom: 12,
        zIndex: 80,
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 999,
        padding: '4px 12px',
        pointerEvents: 'none',
      }}
    >
      🔇 ปิดเสียงอยู่ · กด M เพื่อเปิด
    </div>
  );
}
