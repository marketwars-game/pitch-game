// =====================================================
// FILE: src/components/admin/CountdownDisplay.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Big countdown timer for WRITING phase
//          Reads writing_ends_at from games row, computes seconds remaining
//          Urgent state at ≤ 30s (red + pulse)
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useEffect, useState } from 'react';

export interface CountdownDisplayProps {
  endsAt: string | null;
}

export function CountdownDisplay({ endsAt }: CountdownDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    computeSecondsLeft(endsAt)
  );

  useEffect(() => {
    setSecondsLeft(computeSecondsLeft(endsAt));
    if (!endsAt) return;
    const interval = setInterval(() => {
      setSecondsLeft(computeSecondsLeft(endsAt));
    }, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  const totalSeconds = secondsLeft;
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Progress: assume max writing time = 240s (จาก DEFAULT_GAME_CONFIG)
  // ถ้ามี game.config สามารถส่ง config มาด้วยภายหลัง
  const totalDuration = 240;
  const progressPct = Math.min(
    100,
    Math.max(0, (totalSeconds / totalDuration) * 100)
  );

  const isUrgent = totalSeconds <= 30 && totalSeconds > 0;
  const isExpired = totalSeconds <= 0;

  return (
    <div
      style={{
        background: '#1c1c1e',
        border: `1px solid ${isUrgent ? '#FF5C8A' : '#FFD93D'}`,
        borderRadius: 14,
        padding: 18,
        textAlign: 'center',
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${
            isUrgent ? 'rgba(255,92,138,0.10)' : 'rgba(255,217,61,0.08)'
          }, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: '#71717A',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontWeight: 700,
          marginBottom: 6,
          position: 'relative',
        }}
      >
        Time Remaining
      </div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: isUrgent ? '#FF5C8A' : isExpired ? '#71717A' : '#FFD93D',
          letterSpacing: -2,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          position: 'relative',
          animation: isUrgent ? 'pg-pulse 1s ease-in-out infinite' : 'none',
        }}
      >
        {display}
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 999,
          overflow: 'hidden',
          marginTop: 10,
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 999,
            width: `${progressPct}%`,
            background: isUrgent ? '#FF5C8A' : '#FFD93D',
            transition: 'width 0.3s linear',
            boxShadow: `0 0 12px ${
              isUrgent ? 'rgba(255,92,138,0.5)' : 'rgba(255,217,61,0.5)'
            }`,
          }}
        />
      </div>
    </div>
  );
}

function computeSecondsLeft(endsAt: string | null): number {
  if (!endsAt) return 0;
  const ends = new Date(endsAt).getTime();
  if (Number.isNaN(ends)) return 0;
  return Math.max(0, Math.floor((ends - Date.now()) / 1000));
}
