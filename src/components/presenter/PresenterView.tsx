// =====================================================
// FILE: src/components/presenter/PresenterView.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-05 (T0-v2 placeholder)
// LAST MODIFIED: 2026-05-07
// PURPOSE: Top-level Presenter component.
//          - Renders Phase 0 (LANDING) until user dismisses (spacebar/click)
//          - After dismiss, routes to LOBBY/WRITING/JUDGING/RESULTS based on game.phase
//          - Subscribes to combined realtime via usePresenterState
//
//          Phase 0 is client-only state — does NOT touch the DB. This means:
//          if admin re-opens Presenter mid-game, they'll see LANDING and need
//          to press SPACE once. Acceptable trade-off for "set up screen → press
//          space to begin" mental model.
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Replace T0-v2 placeholder with full Presenter
//   T0-v2 (2026-05-06): Initial placeholder (page-wrapper refactor)
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import { usePresenterState } from '@/hooks/usePresenterState';
import { LANDING_DISMISS_KEYS } from '@/lib/presenter-config';
import { PresenterLandingScreen } from './PresenterLandingScreen';
import { PresenterLobbyScreen } from './PresenterLobbyScreen';
import { PresenterWritingScreen } from './PresenterWritingScreen';
import { PresenterJudgingScreen } from './PresenterJudgingScreen';
import { PresenterResultsScreen } from './PresenterResultsScreen';

export function PresenterView() {
  const [showLanding, setShowLanding] = useState(true);
  const { game, players, submissions, newPlayerIds, loading } = usePresenterState();

  // dismiss LANDING on Space/Enter or click
  useEffect(() => {
    if (!showLanding) return;
    const onKey = (e: KeyboardEvent) => {
      if ((LANDING_DISMISS_KEYS as readonly string[]).includes(e.code)) {
        e.preventDefault();
        setShowLanding(false);
      }
    };
    const onClick = () => setShowLanding(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [showLanding]);

  // Phase 0
  if (showLanding) {
    return (
      <div className="presenter-stage">
        <PresenterLandingScreen />
      </div>
    );
  }

  // Loading state — render LOBBY shell with empty data so layout doesn't flash
  if (loading || !game) {
    return (
      <div className="presenter-stage">
        <PresenterLobbyScreen players={[]} newPlayerIds={new Set()} />
      </div>
    );
  }

  // Phase routing
  let inner: React.ReactNode;
  switch (game.phase) {
    case 'LOBBY':
      inner = <PresenterLobbyScreen players={players} newPlayerIds={newPlayerIds} />;
      break;
    case 'WRITING':
      inner = (
        <PresenterWritingScreen
          game={game}
          players={players}
          submissions={submissions}
        />
      );
      break;
    case 'JUDGING':
      inner = <PresenterJudgingScreen />;
      break;
    case 'RESULTS':
      inner = (
        <PresenterResultsScreen
          game={game}
          players={players}
          submissions={submissions}
        />
      );
      break;
    default:
      inner = <PresenterLobbyScreen players={players} newPlayerIds={newPlayerIds} />;
  }

  return <div className="presenter-stage">{inner}</div>;
}
