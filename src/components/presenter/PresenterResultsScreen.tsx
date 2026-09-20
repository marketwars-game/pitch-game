// =====================================================
// FILE: src/components/presenter/PresenterResultsScreen.tsx
// PROJECT: pitch-game
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T9-v2
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-09-20
// PURPOSE: จอผลรอบสุดท้าย — รับใช้องก์ 2-3 ของการเฉลย
//          - เปิดทีละขั้นด้วย SPACE/คลิก ให้ MC คุมจังหวะพากลุ้นเอง
//            (state ฝั่ง client ล้วน ไม่แตะ DB / ไม่แตะ phase)
//          - podium 3 แท่ง + คะแนนแยกรายกรรมการ
//          - กล่องข้อความของแชมป์ + ข้อความที่พี่มั่นตอบกลับ (สำหรับ MC อ่านออกเสียง)
//          - อันดับ 4-10
//
// CHANGE LOG:
//   T9-v2 (2026-09-20): 🔴 FIX — ข้อความแชมป์ยาวแล้วโดนตัดทั้งหัวและท้าย (font 24px ตายตัว +
//                        justify-content:center + overflow:hidden) พบตอนเทส preview ด้วยข้อความ ~900 ตัวอักษร
//                        งานนี้ผู้เล่นใช้ AI ช่วยเขียน → ข้อความยาวกว่า T7/T8 มาก (เพดาน 1500)
//                        แก้: useFitText ย่อ font ของการ์ดแชมป์อัตโนมัติ 24px → ต่ำสุด 13px จนพอดีกรอบ
//                        (วัดด้วย scrollHeight/clientHeight ในผืนผ้าใบ 1920×1080 — ไม่ขึ้นกับ scale ของจอ)
//                        ถ้าย่อสุดแล้วยังล้น → ชิดบน + ตัดท้ายข้อความผู้เล่นด้วยเงาจาง · reply พี่ชัวร์เห็นครบเสมอ
//   T9-v1 (2026-09-20): ข้อความ podium เวอร์ชันพี่ชัวร์ + avatar ช + fallback reply
//   T8-v1 (2026-08-20): strings เคสพี่มั่น — headline ผล + อวาตาร์ ม + fallback reply ใหม่ (ไม่แตะ logic)
//   T7-v1 (2026-08-04): เขียนใหม่ — staged reveal, ranking.ts, 2 ทศนิยม,
//                       ข้อความแชมป์, ใช้ PresenterChrome แทน PresenterHeader
//   T5-v1 (2026-05-07): Top 3 podium + Top 4-10 + gold confetti
// =====================================================
'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameRow, PlayerRow, SubmissionRow } from '@/lib/types';
import { compareRank, resolveFinalScore, formatScoreCompare } from '@/lib/ranking';
import { PODIUM_TOP_N, RUNNERS_TOP_N } from '@/lib/presenter-config';
import { T7Ambient, T7TopBar } from './PresenterChrome';

// T9-v2: ขนาดตัวอักษรการ์ดแชมป์ (px ในผืนผ้าใบ 1920×1080)
const CHAMP_FONT_MAX = 24;
const CHAMP_FONT_MIN = 13;

/**
 * ย่อ font ของกล่องแชทแชมป์จนเนื้อหาพอดีกรอบ
 * - เขียนค่าเป็น CSS variable --t9-champ-fs บน element (css อ่านไปใช้ทั้งข้อความผู้เล่นและ reply)
 * - scrollHeight/clientHeight เป็นหน่วย layout px จึงไม่ถูกกระทบจาก transform: scale ของ PresenterStage
 * - รับ ref ของกล่องแชทจาก component · คืน true ถ้าย่อสุดแล้วยังล้น (ให้ css สลับเป็นโหมดตัดท้าย)
 */
function useFitText(
  ref: React.RefObject<HTMLDivElement | null>,
  deps: readonly unknown[]
): boolean {
  const [clipped, setClipped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    const fit = () => {
      if (cancelled || !el) return;
      el.classList.remove('t9-champ-chat--clip');
      let size = CHAMP_FONT_MAX;
      el.style.setProperty('--t9-champ-fs', `${size}px`);
      while (size > CHAMP_FONT_MIN && el.scrollHeight > el.clientHeight + 1) {
        size -= 1;
        el.style.setProperty('--t9-champ-fs', `${size}px`);
      }
      setClipped(el.scrollHeight > el.clientHeight + 1);
    };

    fit();
    // ฟอนต์ไทยโหลดช้ากว่า layout รอบแรก — วัดซ้ำเมื่อฟอนต์พร้อม
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(fit).catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return clipped;
}

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
  const kengName = game.stock?.name ?? 'พี่ชัวร์';

  // ---------- การเปิดผลทีละขั้น ----------
  // 0 = ยังไม่เปิดอะไร · 1 = อันดับ 3 · 2 = อันดับ 2 · 3 = แชมป์
  // 4 = ข้อความแชมป์ · 5 = อันดับ 4-10
  const [step, setStep] = useState(0);
  const lockRef = useRef(0);

  // T9-v2: ย่อ font การ์ดแชมป์ให้พอดีกรอบ — วัดใหม่เมื่อแชมป์/ข้อความ/reply เปลี่ยน หรือการ์ดเพิ่งเปิด
  const champChatRef = useRef<HTMLDivElement | null>(null);
  const champClipped = useFitText(champChatRef, [champ?.id, champ?.pitch, champ?.reply, step >= 4]);

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
      ? `ใครอธิบายให้${kengName}เข้าใจได้ดีที่สุด`
      : step === 1
        ? 'อันดับ 3 …'
        : step === 2
          ? 'อันดับ 2 …'
          : step === 3
            ? 'แชมป์ของรอบนี้'
            : `ใครอธิบายให้${kengName}เข้าใจได้ดีที่สุด`;

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
            <div className="t7-champ-head">ข้อความที่ทำให้{kengName}เข้าใจ</div>
            <div
              ref={champChatRef}
              className={`t7-champ-chat${champClipped ? ' t9-champ-chat--clip' : ''}`}
            >
              <div className="t7-champ-mine">{champ?.pitch ?? '—'}</div>
              <div className="t7-champ-kengrow">
                <div className="t7-ava">ช</div>
                <div className="t7-champ-keng">
                  {champ?.reply ?? 'ขอบใจนะน้อง เดี๋ยวพี่ขอค่อยๆ อ่านอีกรอบก่อนนะ 🙏'}
                </div>
              </div>
            </div>
            <div className="t7-champ-foot">What → How → Yet · AI เก่งเท่า context ที่เราป้อน</div>
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
