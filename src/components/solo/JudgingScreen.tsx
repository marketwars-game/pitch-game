// =====================================================
// FILE: src/components/solo/JudgingScreen.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v2
// CREATED: 2026-05-09
// PURPOSE: Neural network animation while AI judges.
//          Subscribes to solo_submissions:{id} UPDATE events.
//          When scores arrive (judging_status='done'), computes rank + flips to Results.
//          On 'failed' status, flips to Results with empty scores (failed message).
//          Mount-time DB check for race conditions (T5 lesson 20).
//
// CHANGE LOG:
//   T6-v2 (2026-05-09): Replace .gt('scores->finalScore', ...) jsonb-arrow query
//                        (TS strict unfriendly) with client-side reduce on fetched
//                        scores jsonb. Same result, type-safe.
//   T6-v1 (2026-05-09): Initial — matches MEXPO26-PITCH-GAME-T6-mockup-v3
// =====================================================

'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { SubmissionScores, SoloJudgingStatus } from '@/lib/types';

type Props = {
  submissionId: string | null;
  onResults: (scores: SubmissionScores, rank: number | null) => void;
};

export function JudgingScreen({ submissionId, onResults }: Props) {
  const completedRef = useRef(false);

  useEffect(() => {
    if (!submissionId || completedRef.current) return;

    const supabase = getSupabaseBrowserClient();

    const handleComplete = async (scores: SubmissionScores) => {
      if (completedRef.current) return;
      completedRef.current = true;

      // Compute rank: how many submissions have a higher finalScore?
      // We do this client-side because Supabase JS strict types don't allow
      // .gt('scores->finalScore', ...) ergonomically. Fetch only `scores`
      // jsonb of done rows and count locally — payload is small even at scale.
      let rank: number | null = null;
      if (scores.finalScore != null) {
        const { data } = await supabase
          .from('solo_submissions')
          .select('scores')
          .eq('judging_status', 'done')
          .not('scores', 'is', null);

        if (data) {
          type ScoreRow = { scores: { finalScore?: number } | null };
          const rows = data as unknown as ScoreRow[];
          const myScore = scores.finalScore;
          const higher = rows.reduce<number>((acc: number, row: ScoreRow): number => {
            const fs = row.scores?.finalScore;
            return fs != null && fs > myScore ? acc + 1 : acc;
          }, 0);
          rank = higher + 1;
        }
      }

      onResults(scores, rank);
    };

    // Subscribe to UPDATE event
    const channel = supabase
      .channel(`solo_submission:${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solo_submissions',
          filter: `id=eq.${submissionId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            judging_status: SoloJudgingStatus;
            scores: SubmissionScores | null;
          };
          if (row.judging_status === 'done' && row.scores) {
            void handleComplete(row.scores);
          } else if (row.judging_status === 'failed') {
            void handleComplete({});
          }
        }
      )
      .subscribe();

    // Mount-time check (race condition guard — T5 lesson 20)
    void (async () => {
      const { data } = await supabase
        .from('solo_submissions')
        .select('judging_status, scores')
        .eq('id', submissionId)
        .single();
      if (data?.judging_status === 'done' && data.scores) {
        void handleComplete(data.scores as SubmissionScores);
      } else if (data?.judging_status === 'failed') {
        void handleComplete({});
      }
    })();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [submissionId, onResults]);

  return (
    <div className="solo-judging">
      <div className="mesh-bg" />

      <div className="judging-wrap">
        <div className="neural-stage">
          <svg className="neural-svg" viewBox="0 0 200 200" aria-hidden>
            {/* Lines from center to 3 perimeter */}
            <line className="neural-line" x1="100" y1="100" x2="50" y2="50" />
            <line className="neural-line" x1="100" y1="100" x2="150" y2="50" />
            <line className="neural-line" x1="100" y1="100" x2="100" y2="170" />
            {/* Connecting outer lines */}
            <line className="neural-line" x1="50" y1="50" x2="150" y2="50" />
            <line className="neural-line" x1="50" y1="50" x2="100" y2="170" />
            <line className="neural-line" x1="150" y1="50" x2="100" y2="170" />

            {/* Pulse particles along lines */}
            <circle className="neural-pulse" r="2.5">
              <animateMotion dur="2s" repeatCount="indefinite" path="M50,50 L100,100" />
            </circle>
            <circle className="neural-pulse" r="2.5">
              <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s" path="M150,50 L100,100" />
            </circle>
            <circle className="neural-pulse" r="2.5">
              <animateMotion dur="2s" repeatCount="indefinite" begin="1s" path="M100,170 L100,100" />
            </circle>

            {/* 3 persona nodes (perimeter) */}
            <circle className="neural-node active-analyst" cx="50" cy="50" r="6" />
            <circle className="neural-node active-creative" cx="150" cy="50" r="6" />
            <circle className="neural-node active-communicator" cx="100" cy="170" r="6" />

            {/* Center node (mint) */}
            <circle className="neural-node-center" cx="100" cy="100" r="10" />
          </svg>
        </div>

        <div className="judging-title">AI กำลังประมวลผล Pitch ของคุณ</div>
        <div className="judging-sub">ใช้เวลาประมาณ 5-10 วินาที</div>

        <div className="judging-personas">
          <div className="judging-persona-row">
            <span className="judging-persona-dot analyst" />
            <span>The Analyst กำลังดูตัวเลข...</span>
          </div>
          <div className="judging-persona-row">
            <span className="judging-persona-dot creative" />
            <span>The Creative กำลังหาความน่าสนใจ...</span>
          </div>
          <div className="judging-persona-row">
            <span className="judging-persona-dot communicator" />
            <span>The Communicator กำลังเช็คความเสี่ยง...</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .solo-judging {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        .mesh-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
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

        .judging-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 24px 16px;
          text-align: center;
        }

        .neural-stage {
          width: 200px;
          height: 200px;
          margin: 0 auto 20px;
          position: relative;
        }
        .neural-svg { width: 100%; height: 100%; overflow: visible; }
        .neural-node {
          fill: #2a2a2c;
          stroke: rgba(255,255,255,0.16);
          stroke-width: 1.5;
          transition: all 0.3s;
        }
        .neural-node.active-analyst {
          fill: #8B5CF6;
          stroke: #8B5CF6;
          animation: node-glow-purple 1.4s ease-in-out infinite;
        }
        .neural-node.active-creative {
          fill: #FF8C42;
          stroke: #FF8C42;
          animation: node-glow-orange 1.4s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        .neural-node.active-communicator {
          fill: #FF5C8A;
          stroke: #FF5C8A;
          animation: node-glow-pink 1.4s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        .neural-node-center {
          fill: #5DF591;
          stroke: #5DF591;
          filter: drop-shadow(0 0 10px #5DF591);
        }
        @keyframes node-glow-purple {
          0%, 100% { filter: drop-shadow(0 0 0 transparent); r: 6; }
          50%      { filter: drop-shadow(0 0 8px #8B5CF6); r: 8; }
        }
        @keyframes node-glow-orange {
          0%, 100% { filter: drop-shadow(0 0 0 transparent); r: 6; }
          50%      { filter: drop-shadow(0 0 8px #FF8C42); r: 8; }
        }
        @keyframes node-glow-pink {
          0%, 100% { filter: drop-shadow(0 0 0 transparent); r: 6; }
          50%      { filter: drop-shadow(0 0 8px #FF5C8A); r: 8; }
        }
        .neural-line {
          stroke: rgba(255,255,255,0.08);
          stroke-width: 1;
          fill: none;
        }
        .neural-pulse {
          fill: #5DF591;
          filter: drop-shadow(0 0 4px #5DF591);
        }

        .judging-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
          animation: pulse-text 2s ease-in-out infinite;
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
        .judging-sub {
          font-size: 12px;
          color: #A1A1AA;
          margin-bottom: 22px;
        }
        .judging-personas {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 240px;
        }
        .judging-persona-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #A1A1AA;
        }
        .judging-persona-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: dot-pulse 1.4s ease-in-out infinite;
        }
        .judging-persona-dot.analyst { background: #8B5CF6; }
        .judging-persona-dot.creative { background: #FF8C42; animation-delay: 0.4s; }
        .judging-persona-dot.communicator { background: #FF5C8A; animation-delay: 0.8s; }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%      { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
