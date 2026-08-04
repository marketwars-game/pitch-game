// =====================================================
// FILE: src/components/presenter/PresenterResultsScreen.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-08-04
// PURPOSE: จอผลรอบสุดท้าย — รับใช้องก์ 2-3 ของการเฉลย
//          - เปิดทีละขั้นด้วย SPACE/คลิก ให้ MC คุมจังหวะพากลุ้นเอง
//            (state ฝั่ง client ล้วน ไม่แตะ DB / ไม่แตะ phase)
//          - podium 3 แท่ง + คะแนนแยกรายกรรมการ
//          - กล่องข้อความของแชมป์ + ข้อความที่พี่เก่งตอบกลับ (สำหรับ MC อ่านออกเสียง)
//          - อันดับ 4-10
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): เขียนใหม่ — staged reveal, ranking.ts, 2 ทศนิยม,
//                       ข้อความแชมป์, ใช้ PresenterChrome แทน PresenterHeader
//   T5-v1 (2026-05-07): Top 3 podium + Top 4-10 + gold confetti
// =====================================================
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameRow, PlayerRow, SubmissionRow } from '@/lib/types';
import { compareRank, resolveFinalScore, formatScoreCompare } from '@/lib/ranking';
import { PODIUM_TOP_N, RUNNERS_TOP_N } from '@/lib/presenter-config';
import { T7Ambient, T7TopBar } from './PresenterChrome';

/** กันกดรัว — MC เผลอกดสองครั้งจะไม่ข้ามอันดับ */
const ADVANCE_LOCK_MS = 600;

type Props = {
  game: GameRow;
  players: PlayerRow[];
  submissions: SubmissionRow[];
};

type Row = {
  id: string;
  nickname: string;
  finalScore: number;
  pitch: string;
  analyst?: number;
  creative?: number;
  communicator?: number;
  reply?: string;
};

export function PresenterResultsScreen({ game, players, submissions }: Props) {
  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) map.set(p.id, p.nickname);
    return map;
  }, [players]);

  const ranked = useMemo<Row[]>(() => {
    return submissions
      .filter((s) => resolveFinalScore(s.scores) !== null)
      .sort((a, b) =>
        compareRank(
          { scores: a.scores, submittedAt: a.submitted_at },
          { scores: b.scores, submittedAt: b.submitted_at }
        )
      )
      .map((s) => ({
        id: s.id,
        nickname: nameOf.get(s.player_id) ?? '—',
        finalScore: resolveFinalScore(s.scores) ?? 0,
        pitch: s.pitch,
        analyst: s.scores?.analyst?.score,
        creative: s.scores?.creative?.score,
        communicator: s.scores?.communicator?.score,
        reply: s.scores?.creative?.reply,
      }));
  }, [submissions, nameOf]);

  const podium = ranked.slice(0, PODIUM_TOP_N);
  const runners = ranked.slice(PODIUM_TOP_N, PODIUM_TOP_N + RUNNERS_TOP_N);
  const champ = podium[0] ?? null;
  const kengName = game.stock?.name ?? 'พี่เก่ง';

  // ---------- การเปิดผลทีละขั้น ----------
  // 0 = ยังไม่เปิดอะไร · 1 = อันดับ 3 · 2 = อันดับ 2 · 3 = แชมป์
  // 4 = ข้อความแชมป์ · 5 = อันดับ 4-10
  const [step, setStep] = useState(0);
  const lockRef = useRef(0);

  const advance = useCallback(() => {
    const now = Date.now();
    if (now - lockRef.current < ADVANCE_LOCK_MS) return;
    lockRef.current = now;
    setStep((s) => Math.min(5, s + 1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', advance);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', advance);
    };
  }, [advance]);

  const headline =
    step === 0
      ? `ใครทำให้${kengName}กล้าเริ่มได้มากที่สุด`
      : step === 1
        ? 'อันดับ 3 …'
        : step === 2
          ? 'อันดับ 2 …'
          : step === 3
            ? 'แชมป์ของรอบนี้'
            : `ใครทำให้${kengName}กล้าเริ่มได้มากที่สุด`;

  const cue =
    step === 0
      ? 'เปิดอันดับ 3'
      : step === 1
        ? 'เปิดอันดับ 2'
        : step === 2
          ? 'เปิดแชมป์'
          : step === 3
            ? 'เปิดข้อความของแชมป์'
            : step === 4
              ? 'เปิดอันดับ 4–10'
              : null;

  return (
    <div className="t7-results">
      <T7Ambient />
      {step >= 3 && <Confetti />}

      <div className="t7-stage">
        <T7TopBar status="ผลการตัดสิน" variant="warn" />

        <div className="t7-r-headline">
          <div className="t7-j-big">{headline}</div>
        </div>

        <div className="t7-r-body">
          <div className="t7-podium">
            <PodiumSlot rank={2} row={podium[1]} open={step >= 2} />
            <PodiumSlot rank={1} row={podium[0]} open={step >= 3} />
            <PodiumSlot rank={3} row={podium[2]} open={step >= 1} />
          </div>

          <div className={`t7-champ${step >= 4 ? ' t7-on' : ''}`}>
            <div className="t7-champ-head">ข้อความที่ทำให้{kengName}กล้าเริ่ม</div>
            <div className="t7-champ-chat">
              <div className="t7-champ-mine">{champ?.pitch ?? '—'}</div>
              <div className="t7-champ-kengrow">
                <div className="t7-ava">ก</div>
                <div className="t7-champ-keng">
                  {champ?.reply ?? 'พี่อ่านแล้วนะ ขอเก็บไปคิดก่อน 🙏'}
                </div>
              </div>
            </div>
            <div className="t7-champ-foot">ฟัง → หลักการ → ก้าวเล็กที่ทำได้วันนี้</div>
          </div>
        </div>

        <div className={`t7-runners${step >= 5 ? ' t7-on' : ''}`}>
          <div className="t7-run-head">อันดับ 4–10</div>
          <div className="t7-run-row">
            {runners.map((r, i) => (
              <div key={r.id} className="t7-run">
                <i>{i + PODIUM_TOP_N + 1}</i>
                <b>{r.nickname}</b>
                <span>{formatScoreCompare(r.finalScore)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cue && (
        <div className="t7-cue">
          กด <span className="t7-kbd">SPACE</span> เพื่อ{cue}
        </div>
      )}
    </div>
  );
}

// =====================================================
// แท่ง podium — ก่อนเปิดเป็นเงาโครงเส้นประ + เครื่องหมาย ?
// =====================================================
function PodiumSlot({
  rank,
  row,
  open,
}: {
  rank: 1 | 2 | 3;
  row?: Row;
  open: boolean;
}) {
  const medal = rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉';
  const show = open && !!row;

  return (
    <div className={`t7-slot t7-slot--${rank}${show ? ' t7-on' : ''}`}>
      <div className="t7-pending">
        <div className="t7-qmark">?</div>
        <div className="t7-ghostbar" />
      </div>

      <div className="t7-slot-inner">
        <div className="t7-medal">{medal}</div>
        <div className="t7-nick">{row?.nickname ?? '—'}</div>
        <div className="t7-score">
          {formatScoreCompare(row?.finalScore)}
          <small>/10</small>
        </div>
        <div className="t7-breakdown">
          <span className="t7-bd t7-bd--prof">{fmt1(row?.analyst)}</span>
          <span className="t7-bd t7-bd--keng">{fmt1(row?.creative)}</span>
          <span className="t7-bd t7-bd--comm">{fmt1(row?.communicator)}</span>
        </div>
        <div className="t7-bar">
          <div className="t7-rankno">{rank}</div>
        </div>
      </div>
    </div>
  );
}

function fmt1(v: number | undefined): string {
  return typeof v === 'number' && isFinite(v) ? v.toFixed(1) : '—';
}

// =====================================================
// Confetti — seeded (ไม่ใช้ Math.random กัน hydration mismatch)
// =====================================================
const CONFETTI_COLORS = ['#f5c518', '#5DEFA3', '#00d4ff', '#FF8FB0', '#B79CFF'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => {
        const s = (n: number) => {
          const x = Math.sin(i * 71.3 + n * 191.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          left: `${s(1) * 100}%`,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          duration: `${5 + s(2) * 5}s`,
          delay: `${s(3) * 6}s`,
        };
      }),
    []
  );
  return (
    <div className="t7-confetti">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="t7-conf"
          style={{
            left: p.left,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
