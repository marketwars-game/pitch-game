// =====================================================
// FILE: src/components/admin/Top3Leaderboard.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Top 3 leaderboard for RESULTS phase
//          Sorted by finalScore DESC, clickable to open PlayerDetailModal
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useMemo } from 'react';
import type { PlayerStatusEnriched } from '@/lib/types';

export interface Top3LeaderboardProps {
  enrichedPlayers: PlayerStatusEnriched[];
  onPlayerClick: (playerId: string) => void;
}

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export function Top3Leaderboard({
  enrichedPlayers,
  onPlayerClick,
}: Top3LeaderboardProps) {
  const top3 = useMemo(() => {
    const scored = enrichedPlayers
      .filter((p) => p.submission?.scores?.finalScore !== undefined)
      .sort((a, b) => {
        const scoreA = a.submission?.scores?.finalScore ?? 0;
        const scoreB = b.submission?.scores?.finalScore ?? 0;
        return scoreB - scoreA;
      })
      .slice(0, 3);
    return scored;
  }, [enrichedPlayers]);

  if (top3.length === 0) {
    return (
      <div
        style={{
          background: '#1c1c1e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: 20,
          marginBottom: 14,
          textAlign: 'center',
          color: '#71717A',
          fontSize: 12,
        }}
      >
        ยังไม่มีผลคะแนน
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#71717A',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        Top 3 Leaderboard
      </div>
      <div
        style={{
          background: 'rgba(59,125,255,0.06)',
          borderLeft: '3px solid #3B7DFF',
          padding: '8px 10px',
          borderRadius: 6,
          marginBottom: 12,
          fontSize: 11,
          color: '#A1A1AA',
          lineHeight: 1.5,
        }}
      >
        💡 คลิกที่ Top 3 เพื่อเปิด pitch + comments บนเวที
      </div>

      <div
        style={{
          background: '#1c1c1e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: 12,
          marginBottom: 14,
        }}
      >
        {top3.map((p, idx) => (
          <button
            key={p.player.id}
            type="button"
            onClick={() => onPlayerClick(p.player.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 60px',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom:
                idx < top3.length - 1
                  ? '1px solid rgba(255,255,255,0.08)'
                  : 'none',
              fontSize: 13,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              width: '100%',
              fontFamily: 'inherit',
              color: '#fff',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {RANK_EMOJI[idx]}
            </div>
            <div style={{ fontWeight: 600 }}>{p.player.nickname}</div>
            <div
              style={{
                fontWeight: 800,
                color: '#5DF591',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.submission?.scores?.finalScore?.toFixed(1) ?? '—'}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
