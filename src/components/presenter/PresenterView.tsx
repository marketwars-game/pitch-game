// =====================================================
// FILE: src/components/presenter/PresenterView.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T11-v4
// CREATED: 2026-05-05 (T0-v2 placeholder)
// LAST MODIFIED: 2026-11-26
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
//   T11-v4 (2026-11-26): ส่ง onProgressCue ให้ PresenterJudgingScreen (เสียงตอนกรรมการตัดสินครบ)
//   T11-v3 (2026-11-26): ตัดเสียงรัวกลองตอนชื่อเด้ง (stopSfx) · step 4 ไม่มีเสียง · step 5 เสียงเปลี่ยนจังหวะ
//   T11-v2 (2026-11-26): ส่ง onDrumroll ให้ PresenterResultsScreen (รัวกลองก่อนเปิดอันดับถัดไป)
//   T11-v1 (2026-11-26): เสียงจอใหญ่ — usePresenterSound + PresenterSoundDirector · ปลดล็อกตอนปิด landing · ไม่แตะ phase routing
//   T7-v1 (2026-08-04): ห่อทุก phase ด้วย <PresenterStage> (fit-to-screen)
//                       + ส่ง submissions ให้ PresenterJudgingScreen
//                       state machine + usePresenterState เหมือนเดิมทุกอย่าง
//   T4-v1 (2026-05-07): Replace T0-v2 placeholder with full Presenter
//   T0-v2 (2026-05-06): Initial placeholder (page-wrapper refactor)
// =====================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePresenterState } from '@/hooks/usePresenterState';
import { LANDING_DISMISS_KEYS } from '@/lib/presenter-config';
import { PresenterStage } from './PresenterStage';
import { PresenterLandingScreen } from './PresenterLandingScreen';
import { PresenterLobbyScreen } from './PresenterLobbyScreen';
import { PresenterWritingScreen } from './PresenterWritingScreen';
import { PresenterJudgingScreen } from './PresenterJudgingScreen';
import { PresenterResultsScreen } from './PresenterResultsScreen';
import { PresenterSoundDirector } from './PresenterSoundDirector';
import { usePresenterSound } from '@/hooks/usePresenterSound';

export function PresenterView() {
  const [showLanding, setShowLanding] = useState(true);
  const { game, players, submissions, newPlayerIds, loading } = usePresenterState();
  // T11: เสียงจอใหญ่ — ปลดล็อกด้วย gesture เดียวกับที่ปิดหน้า landing
  const sound = usePresenterSound();
  const { unlock: unlockSound, playBgm, playSfx, stopSfx } = sound;

  // dismiss LANDING on Space/Enter or click
  useEffect(() => {
    if (!showLanding) return;
    const onKey = (e: KeyboardEvent) => {
      if ((LANDING_DISMISS_KEYS as readonly string[]).includes(e.code)) {
        e.preventDefault();
        unlockSound();
        setShowLanding(false);
      }
    };
    const onClick = () => {
      unlockSound();
      setShowLanding(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [showLanding, unlockSound]);

  // T11: เสียงตอนเปิดผลทีละขั้น (step จาก PresenterResultsScreen)
  const handleRevealStep = useCallback(
    (step: number) => {
      // ชื่อเด้งขึ้น = กลองหยุดพอดี
      if (step >= 1 && step <= 3) stopSfx('sfx_drumroll');
      if (step === 1 || step === 2) playSfx('sfx_reveal');
      else if (step === 3) {
        playSfx('sfx_fanfare');
        playSfx('sfx_confetti');
        playBgm('bgm_final');
      } else if (step === 5) playSfx('sfx_transition');
    },
    [playBgm, playSfx, stopSfx]
  );

  const handleDrumroll = useCallback(() => playSfx('sfx_drumroll'), [playSfx]);

  // T11-v4: เสียงตอนกรรมการตัดสินครบทีละคน / ครบทั้งหมด (หน้า JUDGING)
  const handleJudgingCue = useCallback(
    (cue: 'judge' | 'all') => playSfx(cue === 'all' ? 'sfx_reveal' : 'sfx_join'),
    [playSfx]
  );

  const soundDirector = (
    <PresenterSoundDirector
      sound={sound}
      active={!showLanding}
      phase={game?.phase ?? null}
      playerCount={players.length}
      writingEndsAt={game?.writing_ends_at ?? null}
    />
  );

  // Phase 0
  if (showLanding) {
    return (
      <PresenterStage>
        <PresenterLandingScreen />
      </PresenterStage>
    );
  }

  // Loading state — render LOBBY shell with empty data so layout doesn't flash
  if (loading || !game) {
    return (
      <PresenterStage>
        <PresenterLobbyScreen players={[]} newPlayerIds={new Set()} />
      </PresenterStage>
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
      inner = <PresenterJudgingScreen submissions={submissions} onProgressCue={handleJudgingCue} />;
      break;
    case 'RESULTS':
      inner = (
        <PresenterResultsScreen
          game={game}
          players={players}
          submissions={submissions}
          onRevealStep={handleRevealStep}
          onDrumroll={handleDrumroll}
        />
      );
      break;
    default:
      inner = <PresenterLobbyScreen players={players} newPlayerIds={newPlayerIds} />;
  }

  return (
    <>
      <PresenterStage>{inner}</PresenterStage>
      {soundDirector}
    </>
  );
}
