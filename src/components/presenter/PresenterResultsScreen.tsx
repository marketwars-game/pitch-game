// =====================================================
// FILE: src/components/presenter/PresenterResultsScreen.tsx
// PROJECT: pitch-game
// TASK: T5 — End-to-End Test + Polish
// VERSION: T5-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: RESULTS phase on Presenter
//   - Header: full prompt restated + "🏆 ผู้ชนะ 🏆" gold→red gradient
//   - Podium 3 cards: Silver(2) · Gold(1, raised) · Bronze(3) — each with 3 judge pips
//   - Runners 4-10: 7 grid cards
//   - Footer: total players + "เปิดบัญชี Dime แล้วเทรด..." CTA
//   - ✨ T5: Gold-only confetti — 60 particles × 2 bursts (1s, 4s after mount)
//
// Sorts submissions by scores.finalScore DESC. Resolves nicknames via players[].
// Skips submissions without finalScore (judging_status='failed' before AUTO_DEFAULT applied).
//
// CHANGE LOG:
//   T5-v1 (2026-05-07): + gold-only confetti via canvas-confetti dynamic import
//                        - Trigger on mount when ranked.length > 0
//                        - 60 particles × 2 bursts at 1s and 4s
//                        - Cleanup via cancelled flag for safe unmount
//                        - Dynamic import to avoid SSR break (window.requestAnimationFrame)
//   T4-v1 (2026-05-07): Initial
// =====================================================
'use client';

import { useEffect } from 'react';
import type { GameRow, PlayerRow, SubmissionRow, SubmissionScores } from '@/lib/types';
import { PODIUM_TOP_N, RUNNERS_TOP_N } from '@/lib/presenter-config';
import { PresenterAmbientBg } from './PresenterAmbientBg';
import { PresenterHeader } from './PresenterHeader';

type Props = {
  game: GameRow;
  players: PlayerRow[];
  submissions: SubmissionRow[];
};

type RankedRow = {
  submissionId: string;
  nickname: string;
  finalScore: number;
  scores: SubmissionScores | null;
};

function buildRanked(
  players: PlayerRow[],
  submissions: SubmissionRow[]
): RankedRow[] {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const ranked: RankedRow[] = [];

  for (const s of submissions) {
    const final = s.scores?.finalScore;
    if (typeof final !== 'number') continue; // skip un-scored

    const player = playerById.get(s.player_id);
    ranked.push({
      submissionId: s.id,
      nickname: player?.nickname ?? '—',
      finalScore: final,
      scores: s.scores,
    });
  }

  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}

// =====================================================
// T5-v1: Confetti config (gold-only)
// =====================================================
const CONFETTI_GOLD_PALETTE = ['#f5c518', '#ffd700', '#ffea80'];
const CONFETTI_BURST_1_DELAY_MS = 1000; // 1s after mount — wait for podium pop-in
const CONFETTI_BURST_2_DELAY_MS = 4000; // 4s after mount — reinforce winner moment

export function PresenterResultsScreen({ game, players, submissions }: Props) {
  const ranked = buildRanked(players, submissions);

  // =====================================================
  // T5-v1: Fire gold-only confetti on mount (if there are winners)
  // - Dynamic import to avoid SSR break
  // - 2 bursts × 60 particles, gold palette
  // - Cleanup via cancelled flag (safe on unmount before bursts fire)
  // =====================================================
  useEffect(() => {
    if (ranked.length === 0) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const fire = async () => {
      try {
        const confettiModule = await import('canvas-confetti');
        if (cancelled) return;
        const confetti = confettiModule.default;

        const baseConfig = {
          particleCount: 60,
          spread: 70,
          origin: { x: 0.5, y: 0.6 },
          colors: CONFETTI_GOLD_PALETTE,
          ticks: 200,
        };

        // Burst 1 — after podium pop-in
        timeouts.push(
          setTimeout(() => {
            if (!cancelled) confetti(baseConfig);
          }, CONFETTI_BURST_1_DELAY_MS)
        );

        // Burst 2 — reinforce winner moment
        timeouts.push(
          setTimeout(() => {
            if (!cancelled) confetti(baseConfig);
          }, CONFETTI_BURST_2_DELAY_MS)
        );
      } catch (err) {
        // Silent fail — confetti is nice-to-have, not critical path
        console.warn('[PresenterResultsScreen] Confetti failed to load:', err);
      }
    };

    fire();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only — RESULTS phase entry triggers component mount

  // Top 3 in podium order: 2 (left) · 1 (center) · 3 (right)
  const r1 = ranked[0];
  const r2 = ranked[1];
  const r3 = ranked[2];

  const runners = ranked.slice(PODIUM_TOP_N, PODIUM_TOP_N + RUNNERS_TOP_N);

  const stock = game.stock;
  const ticker = stock?.ticker ?? '—';
  const totalPlayers = players.length;

  return (
    <div className="presenter-stage-inner">
      <PresenterAmbientBg />
      <PresenterHeader statusText="FINAL RESULTS" statusVariant="warn" />

      <div className="presenter-results-wrap">
        <div className="presenter-results-header">
          <div className="presenter-results-eyebrow">โจทย์</div>
          <div className="presenter-results-prompt">
            Pitch หุ้น{' '}
            <span className="presenter-results-prompt-stock">{ticker}</span>{' '}
            ให้ลูกฟัง — ทำไมควรเอาเงิน{' '}
            <span className="presenter-results-prompt-money">50 บาท</span> มาลงทุน
          </div>
          <div className="presenter-results-title">
            <span>🏆</span>ผู้ชนะ<span>🏆</span>
          </div>
        </div>

        {ranked.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="presenter-podium">
              {r2 ? (
                <PodiumCard rank={2} medal="🥈" row={r2} variant="silver" />
              ) : (
                <PodiumPlaceholder variant="silver" />
              )}
              {r1 ? (
                <PodiumCard rank={1} medal="🥇" row={r1} variant="gold" />
              ) : (
                <PodiumPlaceholder variant="gold" />
              )}
              {r3 ? (
                <PodiumCard rank={3} medal="🥉" row={r3} variant="bronze" />
              ) : (
                <PodiumPlaceholder variant="bronze" />
              )}
            </div>

            {runners.length > 0 && (
              <div className="presenter-runners">
                {runners.map((row, i) => (
                  <RunnerCard
                    key={row.submissionId}
                    rank={PODIUM_TOP_N + 1 + i}
                    row={row}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="presenter-results-footer">
          ทั้งหมด <span className="presenter-results-footer-accent">{totalPlayers}</span> คน
          · เปิดบัญชี Dime แล้วเทรดได้จาก{' '}
          <span className="presenter-results-footer-accent">50 บาท</span>
        </div>
      </div>
    </div>
  );
}

type PodiumVariant = 'gold' | 'silver' | 'bronze';

function PodiumCard({
  rank,
  medal,
  row,
  variant,
}: {
  rank: number;
  medal: string;
  row: RankedRow;
  variant: PodiumVariant;
}) {
  const a = row.scores?.analyst?.score;
  const c = row.scores?.creative?.score;
  const m = row.scores?.communicator?.score;

  return (
    <div className={`presenter-podium-card presenter-podium-card--${variant}`}>
      <div className="presenter-podium-medal">{medal}</div>
      <div className="presenter-podium-rank">RANK {rank}</div>
      <div className="presenter-podium-name">{row.nickname}</div>
      <div className="presenter-podium-score">
        {row.finalScore.toFixed(1)}
        <span className="presenter-podium-score-of">/10</span>
      </div>
      <div className="presenter-podium-judges">
        <JudgePip kind="a" label="ANL" score={a} />
        <JudgePip kind="c" label="CRT" score={c} />
        <JudgePip kind="cm" label="COM" score={m} />
      </div>
    </div>
  );
}

function PodiumPlaceholder({ variant }: { variant: PodiumVariant }) {
  return (
    <div
      className={`presenter-podium-card presenter-podium-card--${variant} presenter-podium-card--empty`}
    >
      <div className="presenter-podium-medal" style={{ opacity: 0.3 }}>
        —
      </div>
      <div className="presenter-podium-name" style={{ opacity: 0.4 }}>
        ไม่มีข้อมูล
      </div>
    </div>
  );
}

function JudgePip({
  kind,
  label,
  score,
}: {
  kind: 'a' | 'c' | 'cm';
  label: string;
  score: number | undefined;
}) {
  return (
    <div className={`presenter-judge-pip presenter-judge-pip--${kind}`}>
      <span className="presenter-judge-pip-score">{score ?? '—'}</span>
      <span className="presenter-judge-pip-label">{label}</span>
    </div>
  );
}

function RunnerCard({ rank, row }: { rank: number; row: RankedRow }) {
  return (
    <div className="presenter-runner-card">
      <div className="presenter-runner-rank">#{rank}</div>
      <div className="presenter-runner-name">{row.nickname}</div>
      <div className="presenter-runner-score">{row.finalScore.toFixed(1)}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '64px 0',
        color: 'var(--presenter-text-3)',
        fontFamily: 'var(--presenter-font-mono)',
        letterSpacing: '2px',
      }}
    >
      ยังไม่มีคะแนน
    </div>
  );
}
