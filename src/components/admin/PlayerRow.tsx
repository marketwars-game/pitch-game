// =====================================================
// FILE: src/components/admin/PlayerRow.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Single player row in PlayerStatusList
//          Status pill + optional score + 👁/🔄 action button
//          Optional rank emoji (🥇🥈🥉) for top 3 at RESULTS phase
//
// CHANGE LOG:
//   T2-v2 (2026-05-06): Add showRankEmoji prop
//                        - Top 3 (idx 1-3): emoji 🥇🥈🥉
//                        - 4+: เลข #4, #5, ...
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type { PlayerStatus, PlayerStatusEnriched } from '@/lib/types';

export interface PlayerRowProps {
  index: number;
  enriched: PlayerStatusEnriched;
  showScore: boolean;
  showRankEmoji?: boolean;
  onClick: () => void;
}

const STATUS_LABELS: Record<PlayerStatus, string> = {
  writing: 'writing…',
  submitted: 'submitted',
  scoring: 'scoring',
  scored: 'scored',
  failed: 'failed',
};

const STATUS_STYLES: Record<PlayerStatus, React.CSSProperties> = {
  writing: {
    background: 'rgba(255,217,61,0.18)',
    color: '#FFD93D',
  },
  submitted: {
    background: 'rgba(59,125,255,0.15)',
    color: '#3B7DFF',
    border: '1px solid rgba(59,125,255,0.4)',
  },
  scoring: {
    background: 'rgba(139,92,246,0.15)',
    color: '#8B5CF6',
    border: '1px solid rgba(139,92,246,0.4)',
  },
  scored: {
    background: 'rgba(93,245,145,0.14)',
    color: '#5DF591',
    border: '1px solid rgba(93,245,145,0.35)',
  },
  failed: {
    background: 'rgba(255,92,138,0.14)',
    color: '#FF5C8A',
    border: '1px solid #FF5C8A',
  },
};

const RANK_EMOJI: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function PlayerRow({
  index,
  enriched,
  showScore,
  showRankEmoji = false,
  onClick,
}: PlayerRowProps) {
  const { player, status, submission } = enriched;
  const finalScore = submission?.scores?.finalScore;
  const isFailed = status === 'failed';
  const canViewDetail = status !== 'writing';

  // Rank display: emoji ที่ top 3 ถ้า showRankEmoji, ไม่งั้นแสดงเลข
  const rankDisplay =
    showRankEmoji && RANK_EMOJI[index]
      ? RANK_EMOJI[index]
      : index;

  const cellStyle: React.CSSProperties = {
    padding: '10px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <>
      <div
        style={{
          ...cellStyle,
          color: '#71717A',
          justifyContent: 'center',
          fontSize: showRankEmoji && RANK_EMOJI[index] ? 18 : 12,
          fontWeight: showRankEmoji && index <= 3 ? 800 : 400,
        }}
      >
        {rankDisplay}
      </div>
      <div
        onClick={canViewDetail ? onClick : undefined}
        style={{
          ...cellStyle,
          color: '#fff',
          fontWeight: 500,
          cursor: canViewDetail ? 'pointer' : 'default',
        }}
      >
        {player.nickname}
        {submission?.auto_defaulted && (
          <span
            title="Auto-defaulted (admin-only)"
            style={{
              marginLeft: 6,
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 4,
              background: 'rgba(255,217,61,0.12)',
              border: '1px solid rgba(255,217,61,0.4)',
              color: '#FFD93D',
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            AUTO
          </span>
        )}
      </div>
      {showScore && (
        <div
          style={{
            ...cellStyle,
            color: finalScore !== undefined ? '#5DF591' : '#52525B',
            fontWeight: 800,
            justifyContent: 'flex-end',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {finalScore !== undefined ? finalScore.toFixed(1) : '—'}
        </div>
      )}
      <div style={{ ...cellStyle, justifyContent: 'flex-end' }}>
        <span
          style={{
            fontSize: 10,
            padding: '3px 9px',
            borderRadius: 999,
            fontWeight: 700,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            ...STATUS_STYLES[status],
          }}
        >
          {status === 'scoring' && (
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#8B5CF6',
                animation: 'pg-pulse 0.9s ease-in-out infinite',
              }}
            />
          )}
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div style={{ ...cellStyle, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={canViewDetail ? onClick : undefined}
          disabled={!canViewDetail}
          title={
            isFailed
              ? 'ดูรายละเอียด (Re-judge available in modal)'
              : canViewDetail
              ? 'ดูรายละเอียด'
              : 'ยังไม่ส่ง pitch'
          }
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: `1px solid ${
              isFailed ? '#FF5C8A' : 'rgba(255,255,255,0.08)'
            }`,
            background: '#1c1c1e',
            color: isFailed ? '#FF5C8A' : '#71717A',
            cursor: canViewDetail ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontFamily: 'inherit',
            padding: 0,
            opacity: canViewDetail ? 1 : 0.3,
          }}
        >
          {isFailed ? '🔄' : '👁'}
        </button>
      </div>
    </>
  );
}
