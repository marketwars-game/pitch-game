// =====================================================
// FILE: src/components/presenter/PresenterSoundDirector.tsx
// PROJECT: pitch-game
// TASK: T11 — LINE หาพี่ชัวร์ (DIME x BU · FinTech & Digital Investment)
// VERSION: T11-v2
// CREATED: 2026-11-26
// LAST MODIFIED: 2026-11-26
// PURPOSE: ผู้กำกับเสียงของจอใหญ่ — ดู phase / จำนวนคน / เวลาที่เหลือ แล้วสั่งเสียง
//          ไม่ render อะไรนอกจากป้าย "ปิดเสียง" ตอน mute
//          - LOBBY:   bgm_lobby · มีคนเข้า = sfx_join (จำกัดความถี่)
//          - WRITING: sfx_market_bell ตอนเริ่ม → bgm_play · 30 วิสุดท้าย bgm_results (ดังขึ้น)
//                     10 วิสุดท้าย sfx_countdown · ถึง 0 = sfx_buzzer ทันที → bgm_suspense
//          - JUDGING: bgm_suspense (ออดดังเฉพาะถ้าปิดรับก่อนหมดเวลา)
//          - RESULTS: sfx_transition ตอนเข้า · กลอง/เปิดชื่อ สั่งจาก PresenterResultsScreen
//          - กด M = ปิด/เปิดเสียง
//
// CHANGE LOG:
//   T11-v2 (2026-11-26): นาฬิกาแดง = bgm_results ดังขึ้น · ออด (sfx_buzzer) ดังตอนนาฬิกาถึง 0 ไม่ใช่ตอนกดปิดรับ · เข้า RESULTS ไม่รัวกลองแล้ว
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
  URGENT_FROM_SEC,
  URGENT_BGM,
  BGM_VOLUME_URGENT,
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
  // T11-v2: ออดหมดเวลาดังไปแล้วหรือยังของรอบเขียนนี้ (key = writingEndsAt) — กันดังซ้ำตอน admin กดปิดรับ
  const buzzedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !phase) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // เสียงเปลี่ยนจังหวะ — เฉพาะตอน "เปลี่ยน" จริง ไม่ใช่ตอนเปิดหน้าครั้งแรก
    if (prev !== null && prev !== phase) {
      if (phase === 'WRITING') playSfx('sfx_market_bell');
      else if (phase === 'JUDGING') {
        // ออดดังตอนนาฬิกาถึง 0 อยู่แล้ว — ดังตรงนี้เฉพาะกรณี admin ปิดรับก่อนหมดเวลา
        if (buzzedForRef.current === null) playSfx('sfx_buzzer');
        buzzedForRef.current = null;
      }
      // RESULTS: เสียงวูบเปิดช่วงประกาศผล — กลอง/เสียงเปิดชื่อ สั่งจากลำดับบนจอ (PresenterResultsScreen)
      else if (phase === 'RESULTS') playSfx('sfx_transition');
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
      if (left <= 0) {
        // นาฬิกาถึง 0 → ออดดังทันที (ครั้งเดียว) แล้วลดเป็นเพลงลุ้น รอ admin กดปิดรับ
        if (buzzedForRef.current !== writingEndsAt) {
          buzzedForRef.current = writingEndsAt;
          playSfx('sfx_buzzer');
          playBgm('bgm_suspense');
        }
        return;
      }
      if (left <= URGENT_FROM_SEC) {
        // นาฬิกาแดง → เพลงเร้าใจ + ดังขึ้น
        playBgm(URGENT_BGM, BGM_VOLUME_URGENT);
      }
      if (left <= COUNTDOWN_BEEP_FROM_SEC && left !== lastBeep) {
        lastBeep = left;
        playSfx('sfx_countdown');
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [ready, phase, writingEndsAt, playSfx, playBgm]);

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
