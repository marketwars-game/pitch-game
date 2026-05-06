// =====================================================
// FILE: src/components/player/ResultsScreen.tsx
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Results screen — รองรับ 2 states จาก mockup-v5:
//          State 8: full results (vibrant + watermark + sparkles + 3 judge cards + rank)
//          State 9: not playing (faded "การแข่งขันสิ้นสุด")
//          คำนวณ rank โดย subscribe submissions ทั้งหมดในเกม
//
// CHANGE LOG:
//   T1-v2 (2026-05-06): Fix TypeScript build error — useRank() select('id, scores')
//                        infer เป็น 'never' บน typed client
//                        Cast result เป็น Pick<SubmissionRow, 'id' | 'scores'>[]
//   T1-v1 (2026-05-06): Initial — vibrant gradient bg, sparkles, gradient score,
//                        rank คำนวณจาก submissions ทั้งหมด
// =====================================================
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { SubmissionRow, SubmissionScores } from '@/lib/types';

interface ResultsScreenProps {
  gameId: string;
  variant: 'full' | 'not-playing';
  submission: SubmissionRow | null;
}

export function ResultsScreen({ gameId, variant, submission }: ResultsScreenProps) {
  const { rank, total } = useRank(gameId, submission?.id ?? null);

  if (variant === 'not-playing') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px 8px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#1c1c1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          🏁
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#A1A1AA',
            marginBottom: 8,
            letterSpacing: '-0.3px',
          }}
        >
          การแข่งขันสิ้นสุด
        </div>
        <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55 }}>
          ขอบคุณที่เข้าร่วมงาน
          <br />
          ดูผู้ชนะได้บนจอใหญ่
        </div>
      </div>
    );
  }

  // ---------- variant === 'full' ----------
  const scores = submission?.scores ?? null;
  const finalScore = scores?.finalScore ?? computeFinalScore(scores);
  const isAutoSubmitted = submission?.auto_submitted ?? false;

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(139,92,246,0.18), transparent 70%), ' +
          'radial-gradient(ellipse 70% 50% at 80% 30%, rgba(93,245,145,0.10), transparent 70%), ' +
          'radial-gradient(ellipse 80% 40% at 20% 80%, rgba(255,92,138,0.08), transparent 70%), ' +
          '#000000',
      }}
    >
      <Sparkles />

      {/* Watermark — สำหรับ share screenshot */}
      <div
        style={{ textAlign: 'center', padding: '10px 0 6px', position: 'relative', zIndex: 2 }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.5,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <span style={{ color: '#5DF591' }}>DIME × AI</span>
          <span style={{ color: '#71717A', fontWeight: 400 }}>·</span>
          <span style={{ color: '#3B7DFF' }}>MONEY EXPO 2026</span>
        </span>
      </div>

      {/* Content แบบ scroll ได้ */}
      <div style={{ padding: '4px 16px 16px', overflowY: 'auto', height: 'calc(100% - 36px)' }}>
        {/* Rank pill */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              borderRadius: 999,
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              color: '#8B5CF6',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              margin: '8px auto 12px',
            }}
          >
            🏆 อันดับที่ {rank ?? '—'} จาก {total ?? '—'}
          </div>
        </div>

        {/* Final score (gradient text) */}
        <div
          style={{
            textAlign: 'center',
            margin: '4px 0 22px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #5DF591 0%, #FFD93D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              letterSpacing: '-2.5px',
              fontVariantNumeric: 'tabular-nums',
              display: 'inline-block',
            }}
          >
            {finalScore !== null ? finalScore.toFixed(1) : '—'}
          </span>
          <span
            style={{
              fontSize: 18,
              color: '#71717A',
              fontWeight: 600,
              marginLeft: 4,
            }}
          >
            / 10
          </span>
          {isAutoSubmitted && (
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  background: 'rgba(255,140,66,0.15)',
                  color: '#FF8C42',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                ⏱ ส่งอัตโนมัติ
              </span>
            </div>
          )}
        </div>

        {/* Judge cards 3 ใบ */}
        <JudgeCard
          variant="analyst"
          icon="📊"
          name="The Analyst"
          score={scores?.analyst}
        />
        <JudgeCard
          variant="creative"
          icon="✨"
          name="The Creative"
          score={scores?.creative}
        />
        <JudgeCard
          variant="communicator"
          icon="💬"
          name="The Communicator"
          score={scores?.communicator}
        />

        <div
          style={{
            margin: '14px 0 4px',
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            fontSize: 11,
            color: '#71717A',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          ดู Leaderboard เต็มได้บนจอใหญ่
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Judge card
// =====================================================
const JUDGE_COLORS = {
  analyst: { brand: '#8B5CF6', soft: 'rgba(139,92,246,0.15)' },
  creative: { brand: '#FF8C42', soft: 'rgba(255,140,66,0.15)' },
  communicator: { brand: '#FF5C8A', soft: 'rgba(255,92,138,0.14)' },
};

function JudgeCard({
  variant,
  icon,
  name,
  score,
}: {
  variant: 'analyst' | 'creative' | 'communicator';
  icon: string;
  name: string;
  score?: { score: number; comment: string };
}) {
  const c = JUDGE_COLORS[variant];
  const hasScore = !!score;

  return (
    <div
      style={{
        background: '#1c1c1e',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${c.brand}`,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: c.brand,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            background: c.soft,
            color: c.brand,
          }}
        >
          {icon}
        </span>
        {name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: c.brand, letterSpacing: '-0.5px' }}>
          {hasScore ? score.score : '—'}
        </span>
        <span style={{ fontSize: 11, color: '#71717A' }}>/ 10</span>
      </div>
      {hasScore ? (
        <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 6, lineHeight: 1.55 }}>
          &ldquo;{score.comment}&rdquo;
        </div>
      ) : (
        <div
          style={{
            fontSize: 11,
            color: '#71717A',
            marginTop: 6,
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          กรรมการท่านนี้ยังไม่มีคะแนน
        </div>
      )}
    </div>
  );
}

// =====================================================
// Sparkles (8 floating dots)
// =====================================================
function Sparkles() {
  const sparkles = [
    { top: 80, left: 30, color: '#5DF591', delay: 0, size: 4 },
    { top: 120, right: 40, color: '#8B5CF6', delay: 0.6, size: 5 },
    { top: 200, left: 50, color: '#FFD93D', delay: 1.2, size: 4 },
    { top: 280, right: 30, color: '#5DF591', delay: 1.8, size: 3 },
    { top: 360, left: 25, color: '#8B5CF6', delay: 2.4, size: 4 },
    { top: 440, right: 50, color: '#FFD93D', delay: 0.3, size: 5 },
    { top: 60, right: 80, color: '#FF8C42', delay: 1.5, size: 4 },
    { top: 320, left: 90, color: '#5DF591', delay: 2.1, size: 3 },
  ];
  return (
    <>
      {sparkles.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            right: s.right,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            pointerEvents: 'none',
            animation: `sparkle-float 4s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
}

// =====================================================
// Helpers
// =====================================================
function computeFinalScore(scores: SubmissionScores | null): number | null {
  if (!scores) return null;
  const arr = [scores.analyst?.score, scores.creative?.score, scores.communicator?.score].filter(
    (s): s is number => typeof s === 'number'
  );
  if (arr.length === 0) return null;
  const avg = arr.reduce((sum, s) => sum + s, 0) / arr.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Subscribe submissions ทั้งหมดในเกม + คำนวณ rank ของ submission ของผู้เล่น
 * Rank = ตำแหน่งหลัง sort ตาม finalScore จากมากไปน้อย
 */
function useRank(gameId: string, mySubmissionId: string | null) {
  const [rank, setRank] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!mySubmissionId) {
      setRank(null);
      setTotal(null);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    const compute = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, scores')
        .eq('game_id', gameId);

      if (cancelled || error || !data) return;

      // Cast เป็น row type ที่ select มา (id + scores) เพื่อให้ TypeScript รู้จัก fields
      type RankRow = Pick<SubmissionRow, 'id' | 'scores'>;
      const rows = data as unknown as RankRow[];

      const withScore = rows
        .map((row) => ({
          id: row.id,
          finalScore: computeFinalScore(row.scores ?? null),
        }))
        .filter((r): r is { id: string; finalScore: number } => r.finalScore !== null);

      withScore.sort((a, b) => b.finalScore - a.finalScore);

      const myIndex = withScore.findIndex((r) => r.id === mySubmissionId);
      setRank(myIndex >= 0 ? myIndex + 1 : null);
      setTotal(rows.length);
    };

    compute();

    const channel = supabase
      .channel(`rank:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          if (!cancelled) compute();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [gameId, mySubmissionId]);

  return { rank, total };
}
