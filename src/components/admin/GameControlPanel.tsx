// =====================================================
// FILE: src/components/admin/GameControlPanel.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Left panel — game control, contextual UI per phase
//          - LOBBY: stock picker + stats + primary "เริ่มเกม"
//          - WRITING: countdown + stats + primary "ปิดรับ"
//          - JUDGING: judging progress + manual re-judge + primary "โชว์ Leaderboard"
//          - RESULTS: top 3 + export + primary "เริ่มรอบใหม่"
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type {
  GameRow,
  PlayerCounts,
  PlayerStatusEnriched,
} from '@/lib/types';
import type { UsePhaseControlResult } from '@/hooks/usePhaseControl';
import { StockPicker } from './StockPicker';
import { PhaseIndicator } from './PhaseIndicator';
import { CountdownDisplay } from './CountdownDisplay';
import { JudgingProgress } from './JudgingProgress';
import { Top3Leaderboard } from './Top3Leaderboard';
import { PrimaryActionButton } from './PrimaryActionButton';

export interface GameControlPanelProps {
  game: GameRow;
  counts: PlayerCounts;
  unresolvedCount: number;
  phaseControl: UsePhaseControlResult;
  enrichedPlayers: PlayerStatusEnriched[];
  onPrimaryAction: () => void | Promise<void>;
  onPlayerClick: (playerId: string) => void;
}

export function GameControlPanel({
  game,
  counts,
  unresolvedCount,
  phaseControl,
  enrichedPlayers,
  onPrimaryAction,
  onPlayerClick,
}: GameControlPanelProps) {
  const phase = game.phase;

  return (
    <div style={panelStyle}>
      <div style={panelTitleStyle}>Game Control</div>

      {/* LOBBY: stock picker */}
      {phase === 'LOBBY' && (
        <StockPicker
          currentStock={game.stock}
          onApply={phaseControl.applyStock}
          disabled={phaseControl.busy}
        />
      )}

      {/* WRITING: countdown */}
      {phase === 'WRITING' && (
        <CountdownDisplay endsAt={game.writing_ends_at} />
      )}

      {/* JUDGING: progress + manual re-judge note */}
      {phase === 'JUDGING' && (
        <>
          <JudgingProgress counts={counts} />
          {counts.failed > 0 && (
            <div
              style={{
                background: 'rgba(255,92,138,0.06)',
                borderLeft: '3px solid #FF5C8A',
                padding: '10px 12px',
                borderRadius: 6,
                marginBottom: 12,
                fontSize: 12,
                lineHeight: 1.5,
                color: '#A1A1AA',
              }}
            >
              <strong style={{ color: '#FF5C8A' }}>
                ⚠️ {counts.failed} player ยังไม่ได้คะแนน
              </strong>{' '}
              — กดปุ่ม 🔄 ที่ row ของ failed player
            </div>
          )}
        </>
      )}

      {/* RESULTS: top 3 leaderboard */}
      {phase === 'RESULTS' && (
        <Top3Leaderboard
          enrichedPlayers={enrichedPlayers}
          onPlayerClick={onPlayerClick}
        />
      )}

      {/* Stats (LOBBY/WRITING/JUDGING) */}
      {phase !== 'RESULTS' && <StatsRow phase={phase} counts={counts} />}

      {/* Phase Indicator (read-only) */}
      <PhaseIndicator currentPhase={phase} />

      {/* Primary Action Button */}
      <PrimaryActionButton
        phase={phase}
        unresolvedCount={unresolvedCount}
        busy={phaseControl.busy}
        canStart={phase !== 'LOBBY' || Boolean(game.stock)}
        onClick={onPrimaryAction}
      />
    </div>
  );
}

// ============================================================
// Stats row (3 cards)
// ============================================================
function StatsRow({
  phase,
  counts,
}: {
  phase: 'LOBBY' | 'WRITING' | 'JUDGING';
  counts: PlayerCounts;
}) {
  const cards: { label: string; value: number; tint?: string }[] =
    phase === 'LOBBY'
      ? [
          { label: 'Joined', value: counts.total, tint: '#5DF591' },
          { label: 'Submitted', value: 0 },
          { label: 'Scored', value: 0 },
        ]
      : phase === 'WRITING'
      ? [
          {
            label: 'Submitted',
            value: counts.submitted + counts.scoring + counts.scored + counts.failed,
            tint: '#FFD93D',
          },
          { label: 'Scoring', value: counts.scoring, tint: '#8B5CF6' },
          { label: 'Scored', value: counts.scored, tint: '#5DF591' },
        ]
      : [
          { label: 'Total', value: counts.total },
          { label: 'Scored', value: counts.scored, tint: '#5DF591' },
          { label: 'Failed', value: counts.failed, tint: '#FF5C8A' },
        ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}
    >
      {cards.map((c) => (
        <div key={c.label} style={statCardStyle}>
          <div style={statLabelStyle}>{c.label}</div>
          <div style={{ ...statValueStyle, color: c.tint ?? '#fff' }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Styles
// ============================================================
const panelStyle: React.CSSProperties = {
  background: 'rgba(28,28,30,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 18,
  overflow: 'auto',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#71717A',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 12,
};

const statCardStyle: React.CSSProperties = {
  background: '#1c1c1e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '12px 14px',
  textAlign: 'center',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#71717A',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  fontWeight: 700,
  marginBottom: 4,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: -0.5,
  fontVariantNumeric: 'tabular-nums',
};
