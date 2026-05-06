// =====================================================
// FILE: src/components/admin/PlayerStatusList.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Right panel — list all players with status pills
//          Each row clickable → open PlayerDetailModal
//          Score column visible in JUDGING/RESULTS
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type {
  GamePhase,
  PlayerCounts,
  PlayerStatusEnriched,
} from '@/lib/types';
import { PlayerRow } from './PlayerRow';

export interface PlayerStatusListProps {
  phase: GamePhase;
  enrichedPlayers: PlayerStatusEnriched[];
  counts: PlayerCounts;
  loading: boolean;
  onPlayerClick: (playerId: string) => void;
}

export function PlayerStatusList({
  phase,
  enrichedPlayers,
  counts,
  loading,
  onPlayerClick,
}: PlayerStatusListProps) {
  const showScore = phase === 'JUDGING' || phase === 'RESULTS';

  return (
    <div
      style={{
        background: 'rgba(28,28,30,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 18,
        overflow: 'auto',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#71717A',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          Players ({counts.total})
        </div>
        {(phase === 'JUDGING' || phase === 'RESULTS') && (
          <div style={{ fontSize: 11, color: '#71717A' }}>
            คลิก row → ดูรายละเอียด
          </div>
        )}
      </div>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: 20,
            color: '#71717A',
            fontSize: 12,
          }}
        >
          กำลังโหลด...
        </div>
      ) : enrichedPlayers.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 30,
            color: '#71717A',
            fontSize: 13,
          }}
        >
          ยังไม่มีผู้เล่น
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: showScore
              ? '32px 1fr 60px 90px 36px'
              : '32px 1fr 90px 36px',
            fontSize: 12,
          }}
        >
          {/* Header */}
          <HeaderCell>#</HeaderCell>
          <HeaderCell>Nickname</HeaderCell>
          {showScore && <HeaderCell align="right">Score</HeaderCell>}
          <HeaderCell align="right">Status</HeaderCell>
          <HeaderCell />

          {/* Rows */}
          {enrichedPlayers.map((p, idx) => (
            <PlayerRow
              key={p.player.id}
              index={idx + 1}
              enriched={p}
              showScore={showScore}
              onClick={() => onPlayerClick(p.player.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderCell({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <div
      style={{
        padding: '10px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.16)',
        color: '#71717A',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        fontWeight: 700,
        textAlign: align,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {children}
    </div>
  );
}
