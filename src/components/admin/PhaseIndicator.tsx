// =====================================================
// FILE: src/components/admin/PhaseIndicator.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Read-only phase indicator — 4 chips showing progression
//          State: passed (grey, opacity 0.7) / active (mint) / upcoming (opacity 0.35)
//          Not clickable — admin uses PrimaryActionButton to advance
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type { GamePhase } from '@/lib/types';

export interface PhaseIndicatorProps {
  currentPhase: GamePhase;
}

const PHASES: GamePhase[] = ['LOBBY', 'WRITING', 'JUDGING', 'RESULTS'];

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIdx = PHASES.indexOf(currentPhase);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <label
          style={{
            fontSize: 12,
            color: '#A1A1AA',
            fontWeight: 500,
            display: 'block',
          }}
        >
          Phase Indicator
        </label>
        <span
          style={{
            fontSize: 9,
            color: '#52525B',
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Read-only
        </span>
      </div>
      <div
        title="Phase indicator (read-only) — use Primary Button below to advance"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {PHASES.map((p, idx) => {
          const isActive = idx === currentIdx;
          const isPassed = idx < currentIdx;
          const isUpcoming = idx > currentIdx;
          return (
            <div
              key={p}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textAlign: 'center',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                ...(isActive
                  ? {
                      background: '#5DF591',
                      color: '#062b13',
                      border: '1px solid #5DF591',
                    }
                  : isPassed
                  ? {
                      background: 'transparent',
                      color: '#A1A1AA',
                      border: '1px solid rgba(255,255,255,0.16)',
                      opacity: 0.7,
                    }
                  : isUpcoming
                  ? {
                      background: '#1c1c1e',
                      color: '#71717A',
                      border: '1px solid rgba(255,255,255,0.08)',
                      opacity: 0.35,
                    }
                  : {}),
              }}
            >
              {p}
            </div>
          );
        })}
      </div>
    </>
  );
}
