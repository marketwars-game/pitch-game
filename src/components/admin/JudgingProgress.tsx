// =====================================================
// FILE: src/components/admin/JudgingProgress.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Progress display for JUDGING phase
//          Shows scored / scoring / failed with progress bar
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type { PlayerCounts } from '@/lib/types';

export interface JudgingProgressProps {
  counts: PlayerCounts;
}

export function JudgingProgress({ counts }: JudgingProgressProps) {
  const total = counts.total;
  const settled = counts.scored + counts.failed; // resolved (either way)
  const progressPct = total === 0 ? 0 : (settled / total) * 100;

  return (
    <div
      style={{
        background: '#1c1c1e',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
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
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,92,246,0.10), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#71717A',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontWeight: 700,
          }}
        >
          Scored
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: -0.5,
          }}
        >
          {counts.scored}
          <span
            style={{ color: '#71717A', fontSize: 16, fontWeight: 700 }}
          >
            {' '}
            / {total}
          </span>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: 8,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #8B5CF6, #5DF591)',
            transition: 'width 0.4s',
            boxShadow: '0 0 12px rgba(139,92,246,0.4)',
            width: `${progressPct}%`,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginTop: 10,
          fontSize: 11,
          color: '#71717A',
          position: 'relative',
          flexWrap: 'wrap',
        }}
      >
        <Stat dotColor="#5DF591" label="scored" value={counts.scored} />
        <Stat
          dotColor="#8B5CF6"
          dotPulse
          label="in progress"
          value={counts.scoring}
        />
        <Stat
          dotColor="#FF5C8A"
          label="failed"
          value={counts.failed}
          valueColor={counts.failed > 0 ? '#FF5C8A' : undefined}
        />
        <Stat dotColor="#FFD93D" label="submitted" value={counts.submitted} />
      </div>
    </div>
  );
}

function Stat({
  dotColor,
  dotPulse,
  label,
  value,
  valueColor,
}: {
  dotColor: string;
  dotPulse?: boolean;
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColor,
          animation: dotPulse ? 'pg-pulse 0.9s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ color: valueColor ?? '#fff', fontWeight: 700 }}>
        {value}
      </span>{' '}
      {label}
    </div>
  );
}
