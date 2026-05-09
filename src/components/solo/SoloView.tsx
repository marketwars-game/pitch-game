// =====================================================
// FILE: src/components/solo/SoloView.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Phase router for /try. Hosts useSoloFlow and switches between
//          4 screens: WELCOME / WRITING / JUDGING / RESULTS.
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial
// =====================================================

'use client';

import { useSoloFlow } from '@/hooks/useSoloFlow';
import { WelcomeScreen } from './WelcomeScreen';
import { WritingScreen } from './WritingScreen';
import { JudgingScreen } from './JudgingScreen';
import { ResultsScreen } from './ResultsScreen';

export function SoloView() {
  const flow = useSoloFlow();

  switch (flow.phase) {
    case 'WELCOME':
      return (
        <WelcomeScreen
          initialNickname={flow.nickname}
          onStart={flow.startWriting}
        />
      );
    case 'WRITING':
      return <WritingScreen onSubmit={flow.submitPitch} />;
    case 'JUDGING':
      return (
        <JudgingScreen
          submissionId={flow.submissionId}
          onResults={flow.showResults}
        />
      );
    case 'RESULTS':
      return (
        <ResultsScreen
          pitch={flow.pitch}
          scores={flow.scores}
          rank={flow.rank}
          onReplay={flow.reset}
        />
      );
  }
}
