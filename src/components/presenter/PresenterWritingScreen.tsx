// =====================================================
// FILE: src/components/presenter/PresenterWritingScreen.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v2
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: WRITING phase on Presenter
//          - Eyebrow ("โจทย์รอบนี้" / "เร่งมือหน่อย!" in warn mode)
//          - Prompt 44px multi-line: "Pitch หุ้น <stock> ให้ลูกฟัง..."
//          - Hero countdown (200px) — switches to red+heartbeat at ≤30s (via hook isUrgent)
//          - Stats row: ส่งแล้ว N/total · progress bar · กำลังเขียน X / เหลืออยู่ X
//
//          Header status flips to red when warn mode active.
//
// CHANGE LOG:
//   T4-v2 (2026-05-07): Pass totalSeconds (from game.config) to countdown
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import {
  type GameRow,
  type PlayerRow,
  type SubmissionRow,
  DEFAULT_GAME_CONFIG,
} from '@/lib/types';
import { PresenterAmbientBg } from './PresenterAmbientBg';
import { PresenterHeader } from './PresenterHeader';
import { PresenterCountdown, useCountdownWarn } from './PresenterCountdown';

type Props = {
  game: GameRow;
  players: PlayerRow[];
  submissions: SubmissionRow[];
};

export function PresenterWritingScreen({ game, players, submissions }: Props) {
  const totalSeconds =
    game.config?.writingTimeSeconds ?? DEFAULT_GAME_CONFIG.writingTimeSeconds;
  const { isWarn } = useCountdownWarn(game.writing_ends_at, totalSeconds);
  const totalPlayers = players.length;
  const submittedCount = submissions.length;
  const writingCount = Math.max(0, totalPlayers - submittedCount);
  const progressPct =
    totalPlayers > 0
      ? Math.min(100, Math.round((submittedCount / totalPlayers) * 100))
      : 0;

  const stock = game.stock;
  const ticker = stock?.ticker ?? '—';

  return (
    <div className="presenter-stage-inner">
      <PresenterAmbientBg />

      <PresenterHeader
        statusText={isWarn ? '30 วินาทีสุดท้าย' : 'WRITING · IN PROGRESS'}
        statusVariant={isWarn ? 'red' : 'default'}
      />

      <div className="presenter-writing-wrap">
        <div
          className="presenter-writing-eyebrow"
          style={isWarn ? { color: 'var(--presenter-danger)' } : undefined}
        >
          {isWarn ? 'เร่งมือหน่อย!' : 'โจทย์รอบนี้'}
        </div>

        <div className="presenter-writing-title">
          Pitch หุ้น <span className="presenter-writing-title-stock">{ticker}</span>{' '}
          ให้ลูกฟัง
          <br />
          ทำไมควรเอาเงิน{' '}
          <span className="presenter-writing-title-money">50 บาท</span> มาลงทุน
        </div>

        <PresenterCountdown
          endsAt={game.writing_ends_at}
          totalSeconds={totalSeconds}
        />
        <div className="presenter-countdown-label">เวลาที่เหลือ</div>

        <div className="presenter-writing-stats">
          <div className="presenter-wstat">
            <div className="presenter-wstat-num">
              {submittedCount}
              <span className="presenter-wstat-of">/{totalPlayers}</span>
            </div>
            <div className="presenter-wstat-label">ส่งแล้ว</div>
          </div>

          <div className="presenter-wstat-progress">
            <div className="presenter-progress-bar">
              <div
                className="presenter-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div
              className="presenter-wstat-label"
              style={{ textAlign: 'center' }}
            >
              {progressPct}% submitted
            </div>
          </div>

          <div className="presenter-wstat">
            <div
              className="presenter-wstat-num"
              style={{
                color: isWarn ? 'var(--presenter-danger)' : 'var(--presenter-primary)',
              }}
            >
              {writingCount}
            </div>
            <div className="presenter-wstat-label">
              {isWarn ? 'เหลืออยู่' : 'กำลังเขียน'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
