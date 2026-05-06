// =====================================================
// FILE: src/components/admin/PlayerStatusList.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Right panel — list all players with status pills
//          - At RESULTS phase: sort by finalScore DESC + show rank (🥇🥈🥉 / #4, #5...)
//          - Sticky header ที่ scroll แค่ list (รองรับ 50+ players)
//          - Each row clickable → open PlayerDetailModal
//
// CHANGE LOG:
//   T2-v2 (2026-05-06): Add ranking + sticky header
//                        - RESULTS phase: sort by finalScore DESC
//                        - Show rank column (🥇🥈🥉 emoji for top 3, #N for rest)
//                        - Sticky header — scroll only list section
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useMemo } from 'react';
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
  const isResults = phase === 'RESULTS';

  // T2-v2: Sort + rank ที่ RESULTS
  const orderedPlayers = useMemo(() => {
    if (!isResults) return enrichedPlayers;
    // Sort by finalScore DESC, ส่วนที่ไม่มีคะแนนไปท้าย
    return [...enrichedPlayers].sort((a, b) => {
      const scoreA = a.submission?.scores?.finalScore;
      const scoreB = b.submission?.scores?.finalScore;
      // คนที่ไม่มี score → ไปท้าย
      if (scoreA === undefined && scoreB === undefined) return 0;
      if (scoreA === undefined) return 1;
      if (scoreB === undefined) return -1;
      return scoreB - scoreA;
    });
  }, [enrichedPlayers, isResults]);

  return (
    <div
      style={{
        background: 'rgba(28,28,30,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 18,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        // Layout: header เด่น + list scroll ภายใน
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header (sticky — อยู่นอก scroll area) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexShrink: 0,
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
          {isResults
            ? `Leaderboard (${counts.total})`
            : `Players (${counts.total})`}
        </div>
        {(phase === 'JUDGING' || phase === 'RESULTS') && (
          <div style={{ fontSize: 11, color: '#71717A' }}>
            คลิก row → ดูรายละเอียด
          </div>
        )}
      </div>

      {/* List body (scrollable) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          // Custom scrollbar styling (Chrome/Safari)
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.16) transparent',
        }}
      >
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
        ) : orderedPlayers.length === 0 ? (
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
                ? '40px 1fr 60px 90px 36px'
                : '32px 1fr 90px 36px',
              fontSize: 12,
            }}
          >
            {/* Sticky header row */}
            <HeaderCell sticky>{showScore ? '#' : '#'}</HeaderCell>
            <HeaderCell sticky>Nickname</HeaderCell>
            {showScore && (
              <HeaderCell sticky align="right">
                Score
              </HeaderCell>
            )}
            <HeaderCell sticky align="right">
              Status
            </HeaderCell>
            <HeaderCell sticky />

            {/* Data rows */}
            {orderedPlayers.map((p, idx) => (
              <PlayerRow
                key={p.player.id}
                index={idx + 1}
                enriched={p}
                showScore={showScore}
                showRankEmoji={isResults}
                onClick={() => onPlayerClick(p.player.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderCell({
  children,
  align = 'left',
  sticky = false,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  sticky?: boolean;
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
        // Sticky behavior — header stays at top of scroll area
        ...(sticky
          ? {
              position: 'sticky',
              top: 0,
              background: 'rgba(28,28,30,0.95)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 2,
            }
          : {}),
      }}
    >
      {children}
    </div>
  );
}
