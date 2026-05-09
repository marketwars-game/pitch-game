// =====================================================
// FILE: src/components/board/BoardView.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v2
// CREATED: 2026-05-09
// PURPOSE: Public leaderboard for /board.
//          - Header + CTA "เล่นเลย" linking to /try
//          - Stats: total players, stock ticker
//          - Top 3 highlighted (gold/silver/bronze)
//          - Rank 4+ standard rows
//          - Load More pagination (20/page)
//          - Relative timestamps refresh every 30s (via useSoloBoard tick)
//          - Empty state with CTA
//
// CHANGE LOG:
//   T6-v2 (2026-05-09): UI fixes:
//                       1. .board-scroll: + box-sizing border-box + overflow-x hidden
//                          (was overflowing parent due to padding 20px without border-box)
//                       2. .board-cta: stronger selector (a.board-cta:link/visited) +
//                          !important on color/text-decoration to override Next.js Link
//                          base style. Also added shadow + hover lift for depth.
//                       3. .board-row: tighter grid (32px rank + 10px gap), + box-sizing
//                          + min-width 0; .board-score min-width 36px (was 40px) so
//                          number "7.3" no longer truncates on 360px screens.
//                       4. .board-load-more: + box-sizing border-box.
//   T6-v1 (2026-05-09): Initial — matches MEXPO26-PITCH-GAME-T6-mockup-v3
// =====================================================

'use client';

import Link from 'next/link';
import { useSoloBoard } from '@/hooks/useSoloBoard';
import { formatRelativeTime, formatScore } from '@/lib/solo-utils';

export function BoardView() {
  const { rows, hasMore, loading, totalCount, error, tick, loadMore } = useSoloBoard();

  return (
    <div className="solo-board">
      <div className="mesh-bg" />

      <div className="board-scroll">
        {/* Header */}
        <div className="board-header">
          <div className="board-title-block">
            <div className="board-eyebrow">DIME × AI</div>
            <h1 className="board-title">🏆 Leaderboard</h1>
          </div>
          <Link href="/try" className="board-cta">
            เล่นเลย →
          </Link>
        </div>

        {/* Stats */}
        <div className="board-stats">
          <div>
            <span className="stat-num">{totalCount.toLocaleString()}</span> คนเล่นทั้งหมด
          </div>
          <div>
            <span className="stat-num">PLTR</span> โจทย์
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="board-error">โหลดข้อมูลไม่สำเร็จ: {error}</div>
        )}

        {/* Empty state */}
        {!loading && rows.length === 0 && !error && (
          <div className="board-empty">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">ยังไม่มีใครเล่น</div>
            <div className="empty-sub">เริ่มเป็นคนแรกได้เลย!</div>
            <Link href="/try" className="empty-cta">
              เริ่มเล่น →
            </Link>
          </div>
        )}

        {/* Loading skeleton (initial) */}
        {loading && rows.length === 0 && (
          <div className="board-loading">กำลังโหลด…</div>
        )}

        {/* Rows */}
        {rows.length > 0 && (
          <div data-tick={tick}>
            {rows.map((row, idx) => {
              const rank = idx + 1;
              const medalClass =
                rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
              const rankDisplay =
                rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
              return (
                <div key={row.id} className={`board-row ${medalClass}`}>
                  <div className="board-rank">{rankDisplay}</div>
                  <div className="board-nick" title={row.nickname}>
                    {row.nickname}
                  </div>
                  <div className="board-time">{formatRelativeTime(row.createdAt)}</div>
                  <div className="board-score">{formatScore(row.finalScore)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && rows.length > 0 && (
          <button
            type="button"
            className="board-load-more"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'กำลังโหลด…' : 'โหลดอีก 20 คน ↓'}
          </button>
        )}
      </div>

      <style jsx>{`
        .solo-board {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .mesh-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%,    rgba(59,125,255,0.27), transparent 60%),
            radial-gradient(ellipse 50% 35% at 90% 15%,   rgba(139,92,246,0.22), transparent 60%),
            radial-gradient(ellipse 70% 40% at 50% 100%,  rgba(93,245,145,0.13), transparent 60%);
          animation: mesh-shift 16s ease-in-out infinite alternate;
        }
        @keyframes mesh-shift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-6px, 4px) scale(1.04); }
          100% { transform: translate(4px, -4px) scale(1.02); }
        }

        .board-scroll {
          position: relative;
          z-index: 2;
          box-sizing: border-box;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
        }

        /* ========== Header ========== */
        .board-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          gap: 12px;
        }
        .board-eyebrow {
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #5DF591;
          letter-spacing: 3px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .board-title {
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .board-cta,
        a.board-cta,
        a.board-cta:link,
        a.board-cta:visited {
          background: #5DF591;
          color: #062b13 !important;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none !important;
          display: inline-block;
          flex-shrink: 0;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 12px rgba(93,245,145,0.25);
          transition: all 0.15s;
        }
        a.board-cta:hover { background: #1ED15F; transform: translateY(-1px); }
        a.board-cta:active { transform: translateY(0); }

        /* ========== Stats ========== */
        .board-stats {
          display: flex;
          gap: 14px;
          margin-bottom: 18px;
          font-size: 12px;
          color: #71717A;
          flex-wrap: wrap;
        }
        .stat-num {
          color: #fff;
          font-weight: 700;
        }

        /* ========== Error / loading / empty ========== */
        .board-error {
          padding: 14px;
          background: rgba(255,92,138,0.08);
          border: 1px solid rgba(255,92,138,0.2);
          border-radius: 10px;
          color: #FF5C8A;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .board-loading {
          text-align: center;
          padding: 40px 20px;
          color: #A1A1AA;
          font-size: 13px;
        }
        .board-empty {
          text-align: center;
          padding: 60px 20px;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .empty-sub {
          font-size: 13px;
          color: #71717A;
          margin-bottom: 18px;
        }
        .empty-cta {
          display: inline-block;
          background: #5DF591;
          color: #062b13;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }
        .empty-cta:hover { background: #1ED15F; }

        /* ========== Rows ========== */
        .board-row {
          display: grid;
          grid-template-columns: 32px 1fr auto auto;
          gap: 10px;
          padding: 12px 14px;
          align-items: center;
          border-radius: 10px;
          margin-bottom: 4px;
          background: rgba(255,255,255,0.02);
          border: 1px solid transparent;
          transition: all 0.15s;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
        }
        .board-row.gold {
          background: linear-gradient(90deg, rgba(255,217,61,0.10), rgba(255,217,61,0.02));
          border-color: rgba(255,217,61,0.3);
        }
        .board-row.silver {
          background: linear-gradient(90deg, rgba(220,220,230,0.06), rgba(220,220,230,0.01));
          border-color: rgba(220,220,230,0.18);
        }
        .board-row.bronze {
          background: linear-gradient(90deg, rgba(205,127,50,0.08), rgba(205,127,50,0.02));
          border-color: rgba(205,127,50,0.22);
        }
        .board-rank {
          font-size: 18px;
          font-weight: 800;
          color: #71717A;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .board-row.gold .board-rank { color: #FFD93D; }
        .board-row.silver .board-rank { color: #d4d4dc; }
        .board-row.bronze .board-rank { color: #d99a5b; }

        .board-nick {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .board-time {
          font-size: 10px;
          color: #71717A;
          text-align: right;
          white-space: nowrap;
        }
        .board-score {
          font-size: 18px;
          font-weight: 800;
          color: #5DF591;
          font-variant-numeric: tabular-nums;
          text-align: right;
          letter-spacing: -0.3px;
          min-width: 36px;
          flex-shrink: 0;
        }
        .board-row.gold .board-score { color: #FFD93D; }

        /* ========== Load More ========== */
        .board-load-more {
          margin-top: 14px;
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          color: #A1A1AA;
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: all 0.15s;
        }
        .board-load-more:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .board-load-more:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
