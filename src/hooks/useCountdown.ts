// =====================================================
// FILE: src/hooks/useCountdown.ts
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Countdown timer ที่ขับโดย server
//          Source of truth = writing_ends_at (timestamptz จาก DB)
//          คำนวณใหม่ทุก 1 วินาที — return secondsLeft, mmss, progress, isExpired
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Initial — useCountdown(endsAt, totalSeconds)
// =====================================================
'use client';

import { useEffect, useState } from 'react';

export interface UseCountdownResult {
  secondsLeft: number;       // 0 ถ้าหมดเวลาหรือไม่มี endsAt
  mmss: string;              // "3:24" formatted
  progress: number;          // 0..1 (1 = เต็ม, 0 = หมด) — สำหรับ progress bar
  isExpired: boolean;        // true เมื่อ secondsLeft = 0
  isUrgent: boolean;         // true ตอนเหลือ < 30 วิ
}

/**
 * Countdown hook ที่ขับโดย absolute end timestamp
 *
 * @param endsAt        ISO string (writing_ends_at จาก DB) หรือ null
 * @param totalSeconds  ระยะเวลารวม (เช่น 240) — ใช้คำนวณ progress fraction
 *
 * ถ้า endsAt = null → return zero state (เกมยังไม่เริ่ม)
 * ถ้า endsAt < now → return expired state
 */
export function useCountdown(
  endsAt: string | null,
  totalSeconds: number
): UseCountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt) {
    return { secondsLeft: 0, mmss: '0:00', progress: 0, isExpired: true, isUrgent: false };
  }

  const endsAtMs = new Date(endsAt).getTime();
  const diffMs = endsAtMs - now;
  const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
  const isExpired = secondsLeft <= 0;
  const isUrgent = !isExpired && secondsLeft < 30;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const mmss = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1, secondsLeft / totalSeconds))
    : 0;

  return { secondsLeft, mmss, progress, isExpired, isUrgent };
}
