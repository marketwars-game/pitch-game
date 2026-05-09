// =====================================================
// FILE: src/components/solo/ResultsScreen.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Final score (gradient mint→blue) + rank pill + pitch echo +
//          3 judge cards + 3 actions (ดู Leaderboard / แชร์ FB / เล่นอีกครั้ง).
//          Failed state: shows fallback message + "เล่นอีกครั้ง" button only.
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial — matches MEXPO26-PITCH-GAME-T6-mockup-v3
// =====================================================

'use client';

import { useRouter } from 'next/navigation';
import type { SubmissionScores } from '@/lib/types';
import { formatScore, buildFacebookShareUrl } from '@/lib/solo-utils';

type Props = {
  pitch: string;
  scores: SubmissionScores | null;
  rank: number | null;
  onReplay: () => void;
};

export function ResultsScreen({ pitch, scores, rank, onReplay }: Props) {
  const router = useRouter();
  const failed = !scores || scores.finalScore == null;

  const handleShareFB = () => {
    if (failed || scores?.finalScore == null) return;
    const url = buildFacebookShareUrl(scores.finalScore);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleViewBoard = () => {
    router.push('/board');
  };

  return (
    <div className="solo-results">
      <div className="mesh-bg" />

      <div className="results-scroll">
        {failed ? (
          <FailedState onReplay={onReplay} />
        ) : (
          <>
            {/* Final score header */}
            <div className="results-header">
              <div className="results-eyebrow">YOUR FINAL SCORE</div>
              <div className="results-final">
                {formatScore(scores!.finalScore)}
                <span className="max"> / 10</span>
              </div>
              {rank != null && (
                <div className="results-rank-pill">🏆 อันดับ #{rank} บน Leaderboard</div>
              )}
            </div>

            {/* Pitch echo */}
            <div className="pitch-echo">
              <div className="pitch-echo-label">Pitch ของคุณ</div>
              <div className="pitch-echo-text">
                &ldquo;{pitch.length > 200 ? `${pitch.slice(0, 200)}…` : pitch}&rdquo;
              </div>
            </div>

            {/* 3 judge cards */}
            {scores!.analyst && (
              <JudgeCard
                kind="analyst"
                name="The Analyst"
                trait="DATA · LOGIC"
                score={scores!.analyst.score}
                comment={scores!.analyst.comment}
              />
            )}
            {scores!.creative && (
              <JudgeCard
                kind="creative"
                name="The Creative"
                trait="STORY · HOOK"
                score={scores!.creative.score}
                comment={scores!.creative.comment}
              />
            )}
            {scores!.communicator && (
              <JudgeCard
                kind="communicator"
                name="The Communicator"
                trait="RISK · BALANCE"
                score={scores!.communicator.score}
                comment={scores!.communicator.comment}
              />
            )}

            {/* Actions */}
            <div className="results-actions">
              <button type="button" className="btn btn-primary" onClick={handleViewBoard}>
                ดู Leaderboard 🏆
              </button>
              <button type="button" className="btn btn-fb" onClick={handleShareFB}>
                <FacebookIcon />
                แชร์คะแนนใน Facebook
              </button>
              <button type="button" className="btn btn-secondary" onClick={onReplay}>
                เล่นอีกครั้ง
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .solo-results {
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

        .results-scroll {
          position: relative;
          z-index: 2;
          padding: 20px 16px;
          overflow-y: auto;
          flex: 1;
        }

        /* ========== Header ========== */
        .results-header {
          text-align: center;
          margin-bottom: 18px;
        }
        .results-eyebrow {
          font-size: 10px;
          color: #5DF591;
          letter-spacing: 4px;
          font-weight: 800;
          margin-bottom: 6px;
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
        }
        .results-final {
          font-size: 56px;
          font-weight: 900;
          letter-spacing: -2px;
          background: linear-gradient(135deg, #5DF591, #3B7DFF);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1;
        }
        .results-final .max {
          font-size: 18px;
          font-weight: 700;
          color: #71717A;
          -webkit-text-fill-color: #71717A;
        }
        .results-rank-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(93,245,145,0.14);
          border: 1px solid rgba(93,245,145,0.35);
          font-size: 11px;
          color: #5DF591;
          font-weight: 700;
          margin-top: 10px;
          letter-spacing: 0.5px;
        }

        /* ========== Pitch echo ========== */
        .pitch-echo {
          background: rgba(28,28,30,0.5);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 14px;
        }
        .pitch-echo-label {
          font-size: 10px;
          color: #71717A;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-weight: 700;
        }
        .pitch-echo-text {
          font-size: 12px;
          color: #A1A1AA;
          line-height: 1.5;
          font-style: italic;
        }

        /* ========== Actions ========== */
        .results-actions {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .btn-primary {
          background: #5DF591;
          color: #062b13;
        }
        .btn-primary:hover { background: #1ED15F; }
        .btn-secondary {
          background: rgba(255,255,255,0.06);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.16);
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.10); }
        .btn-fb {
          background: linear-gradient(135deg, #1877f2, #0d5fcb);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-fb:hover { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}

// ===== Helper components =====

type JudgeCardProps = {
  kind: 'analyst' | 'creative' | 'communicator';
  name: string;
  trait: string;
  score: number;
  comment: string;
};

function JudgeCard({ kind, name, trait, score, comment }: JudgeCardProps) {
  const initial = kind === 'analyst' ? 'A' : kind === 'creative' ? 'C' : 'C';
  return (
    <div className={`judge-card judge-card-${kind}`}>
      <div className={`judge-avatar judge-avatar-${kind}`}>{initial}</div>
      <div className="judge-body">
        <div className="judge-name">{name}</div>
        <div className="judge-trait">{trait}</div>
        <div className="judge-comment">{comment}</div>
      </div>
      <div className={`judge-score judge-score-${kind}`}>
        {score}
        <span className="max-small">/10</span>
      </div>

      <style jsx>{`
        .judge-card {
          background: #1c1c1e;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          display: grid;
          grid-template-columns: 36px 1fr auto;
          gap: 12px;
          align-items: flex-start;
        }
        .judge-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }
        .judge-avatar-analyst { background: #8B5CF6; }
        .judge-avatar-creative { background: #FF8C42; }
        .judge-avatar-communicator { background: #FF5C8A; }
        .judge-body { min-width: 0; }
        .judge-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 2px;
        }
        .judge-trait {
          font-size: 10px;
          color: #71717A;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .judge-comment {
          font-size: 12px;
          color: #A1A1AA;
          line-height: 1.5;
        }
        .judge-score {
          font-size: 22px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.5px;
        }
        .judge-score .max-small {
          font-size: 11px;
          font-weight: 600;
          color: #71717A;
        }
        .judge-score-analyst { color: #8B5CF6; }
        .judge-score-creative { color: #FF8C42; }
        .judge-score-communicator { color: #FF5C8A; }
      `}</style>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function FailedState({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="failed-state">
      <div className="failed-icon">⚠️</div>
      <div className="failed-title">AI ประมวลผลไม่สำเร็จ</div>
      <div className="failed-msg">
        ลองส่งใหม่อีกครั้งนะ — บางครั้ง AI ก็มีอาการเหนื่อยเหมือนกัน
      </div>
      <button type="button" className="failed-btn" onClick={onReplay}>
        เล่นอีกครั้ง
      </button>

      <style jsx>{`
        .failed-state {
          text-align: center;
          padding: 40px 20px;
        }
        .failed-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .failed-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .failed-msg {
          font-size: 13px;
          color: #A1A1AA;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .failed-btn {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          background: #5DF591;
          color: #062b13;
        }
      `}</style>
    </div>
  );
}
