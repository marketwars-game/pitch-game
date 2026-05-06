// =====================================================
// FILE: src/components/presenter/PresenterJudgingScreen.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: JUDGING phase on Presenter
//          - Heading: "กรรมการ AI กำลังตัดสิน..." (gold→red gradient on accent word)
//          - 3 persona tiles: Analyst (cyan/primary) · Creative (gold) · Communicator (red)
//          - Each tile: avatar + name + trait + rotating status message + indeterminate progress bar
//          - Messages rotate every JUDGE_MSG_INTERVAL_MS (~2.4s)
//          - No "X/Y judged" counter, no done state — admin controls flow
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import {
  ANALYST_MESSAGES,
  CREATIVE_MESSAGES,
  COMMUNICATOR_MESSAGES,
  JUDGE_MSG_INTERVAL_MS,
} from '@/lib/presenter-config';
import { PresenterAmbientBg } from './PresenterAmbientBg';
import { PresenterHeader } from './PresenterHeader';

function useRotatingIndex(length: number, intervalMs: number): number {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs]);
  return idx;
}

export function PresenterJudgingScreen() {
  const aIdx = useRotatingIndex(ANALYST_MESSAGES.length, JUDGE_MSG_INTERVAL_MS);
  const cIdx = useRotatingIndex(CREATIVE_MESSAGES.length, JUDGE_MSG_INTERVAL_MS);
  const mIdx = useRotatingIndex(COMMUNICATOR_MESSAGES.length, JUDGE_MSG_INTERVAL_MS);

  return (
    <div className="presenter-stage-inner">
      <PresenterAmbientBg />

      <PresenterHeader statusText="AI JUDGING" statusVariant="warn" />

      <div className="presenter-judging-wrap">
        <div className="presenter-judging-eyebrow">
          <span className="presenter-spinner-mini" />
          ทุก pitch ส่งให้ AI ตัดสินทันที
        </div>

        <div className="presenter-judging-title">
          กรรมการ AI{' '}
          <span className="presenter-judging-title-accent">
            กำลังตัดสิน...
          </span>
        </div>

        <div className="presenter-judges-row">
          <JudgeTile
            kind="analyst"
            avatar="A"
            name="The Analyst"
            trait="DATA · LOGIC"
            message={ANALYST_MESSAGES[aIdx]}
          />
          <JudgeTile
            kind="creative"
            avatar="C"
            name="The Creative"
            trait="STORY · SPARK"
            message={CREATIVE_MESSAGES[cIdx]}
          />
          <JudgeTile
            kind="communicator"
            avatar="M"
            name="The Communicator"
            trait="CLARITY · RISK"
            message={COMMUNICATOR_MESSAGES[mIdx]}
          />
        </div>
      </div>
    </div>
  );
}

type JudgeTileProps = {
  kind: 'analyst' | 'creative' | 'communicator';
  avatar: string;
  name: string;
  trait: string;
  message: string;
};

function JudgeTile({ kind, avatar, name, trait, message }: JudgeTileProps) {
  return (
    <div className={`presenter-judge-tile presenter-judge-tile--${kind}`}>
      <div className="presenter-judge-avatar">{avatar}</div>
      <div className="presenter-judge-name">{name}</div>
      <div className="presenter-judge-trait">{trait}</div>
      <div className="presenter-judge-status">
        {message}
        <span className="presenter-typing-cursor" />
      </div>
      <div className="presenter-judge-progress">
        <div className="presenter-judge-progress-fill" />
      </div>
    </div>
  );
}
