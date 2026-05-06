// =====================================================
// FILE: src/components/presenter/PresenterCountdown.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v2
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Large countdown for WRITING phase
//          - Wraps `useCountdown` (T1-v1) — uses { secondsLeft, mmss, isUrgent }
//          - Auto switches to warn mode (red + heartbeat) using hook's isUrgent flag
//          - Renders mmss directly (no manual format)
//
// CHANGE LOG:
//   T4-v2 (2026-05-07): Fix — useCountdown returns { secondsLeft, mmss, isUrgent },
//                        not { remainingSeconds }. Also requires totalSeconds arg.
//   T4-v1 (2026-05-07): Initial (broken — wrong field name)
// =====================================================

'use client';

import { useCountdown } from '@/hooks/useCountdown';

type Props = {
  endsAt: string | null;     // ISO timestamp from games.writing_ends_at
  totalSeconds: number;      // total writing duration (for progress fraction)
};

export function PresenterCountdown({ endsAt, totalSeconds }: Props) {
  const { mmss, isUrgent, secondsLeft } = useCountdown(endsAt, totalSeconds);
  // only apply warn styling while time is actually running (not when expired)
  const showWarn = isUrgent && secondsLeft > 0;
  return (
    <div
      className={`presenter-countdown-hero${showWarn ? ' presenter-countdown-hero--warn' : ''}`}
    >
      {mmss}
    </div>
  );
}

/**
 * Hook export — for callers that need raw flags (e.g. WritingScreen wants to
 * swap eyebrow text + status pill variant in sync with countdown warn).
 */
export function useCountdownWarn(
  endsAt: string | null,
  totalSeconds: number
): { secondsLeft: number; isWarn: boolean } {
  const { secondsLeft, isUrgent } = useCountdown(endsAt, totalSeconds);
  return {
    secondsLeft,
    isWarn: isUrgent && secondsLeft > 0,
  };
}
