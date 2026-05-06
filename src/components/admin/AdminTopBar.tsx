// =====================================================
// FILE: src/components/admin/AdminTopBar.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Top header bar — brand + event + round + phase status + logout
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type { GamePhase } from '@/lib/types';

export interface AdminTopBarProps {
  phase: GamePhase;
  roundNumber: number;
  onLogout: () => void;
}

const PHASE_DOT_COLOR: Record<GamePhase, string> = {
  LOBBY: '#5DF591',
  WRITING: '#FFD93D',
  JUDGING: '#8B5CF6',
  RESULTS: '#3B7DFF',
};

const PHASE_DOT_ANIM: Record<GamePhase, string> = {
  LOBBY: 'pg-live-pulse 1.6s ease-in-out infinite',
  WRITING: 'pg-pulse 1s ease-in-out infinite',
  JUDGING: 'pg-pulse 1s ease-in-out infinite',
  RESULTS: 'none',
};

export function AdminTopBar({ phase, roundNumber, onLogout }: AdminTopBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 22px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#5DF591',
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            DIME × AI
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#3B7DFF',
              letterSpacing: 1.6,
              lineHeight: 1,
            }}
          >
            MONEY EXPO 2026
          </div>
        </div>
        <div
          style={{
            width: 1,
            height: 24,
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -0.2,
          }}
        >
          Admin Panel
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.4)',
            color: '#8B5CF6',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Round {roundNumber}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 999,
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11,
            fontWeight: 600,
            color: '#A1A1AA',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: PHASE_DOT_COLOR[phase],
              animation: PHASE_DOT_ANIM[phase],
            }}
          />
          {phase}
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: '5px 10px',
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#A1A1AA',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
