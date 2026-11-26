// =====================================================
// FILE: src/components/presenter/PresenterJudgingScreen.tsx
// PROJECT: pitch-game
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T11-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-11-26
// PURPOSE: จอระหว่างรอ AI ตัดสิน (~1-2 นาที)
//          - พื้นหลังเป็นข้อความจริงของผู้เล่นลอยขึ้น (ไม่มีชื่อ) ให้ MC เล่นต่อได้
//          - พี่มั่นอยู่กลาง เน้นสีทอง เพราะองก์ 1 ที่ตามมาคือข้อความจากแก
//          - ความคืบหน้าแยกรายกรรมการ (ของจริงยิงขนาน เสร็จไม่พร้อมกัน)
//
// CHANGE LOG:
//   T11-v1 (2026-11-26): แถบความคืบหน้าวิ่งไล่จาก 0 ไปหาค่าจริง (12/16/20 วิ ไม่เกินค่าจริง) + ตรา "ตัดสินครบ" รายกรรมการ + หัวข้อ "ผลออกแล้ว พร้อมประกาศ" + onProgressCue
//   T9-v1 (2026-09-20): headline พี่ชัวร์ + ไอคอน The Analyst
//   T8-v1 (2026-08-20): strings เคสพี่มั่น (ไม่แตะ logic)
//   T7-v1 (2026-08-04): เขียนใหม่ — ชื่อกรรมการใหม่, stream พื้นหลัง,
//                       รับ submissions เพื่อแสดงความคืบหน้าจริง (เดิมไม่มี props)
//   T4-v1 (2026-05-07): Initial
// =====================================================
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SubmissionRow } from '@/lib/types';
import {
  ANALYST_MESSAGES,
  CREATIVE_MESSAGES,
  COMMUNICATOR_MESSAGES,
  JUDGE_MSG_INTERVAL_MS,
  JUDGING_STREAM_SNIPPETS,
} from '@/lib/presenter-config';
import { PERSONA_LABELS, PERSONA_ROLES } from '@/lib/judge-prompts';
import { T7Ambient, T7TopBar } from './PresenterChrome';

/** สุ่มแบบ seed คงที่ — ค่าเดิมทุกครั้ง กัน hydration mismatch */
function seeded(i: number, salt = 1): number {
  const x = Math.sin(i * 91.7 + salt * 233.3) * 43758.5453;
  return x - Math.floor(x);
}

type Props = {
  submissions: SubmissionRow[];
  /** T11: จังหวะเสียง — 'judge' = กรรมการ 1 คนตัดสินครบ · 'all' = ครบทั้ง 3 คน พร้อมประกาศ */
  onProgressCue?: (cue: 'judge' | 'all') => void;
};

// T11: แถบความคืบหน้า "วิ่งไล่" จาก 0 ไปหาค่าจริง ในเวลาคงที่ต่อกรรมการ (ms)
// ไม่เคยแสดงเกินค่าจริง — ถ้ากรรมการยังตัดสินไม่ครบ แถบจะรอที่ค่าจริง
// (กรรมการตัดสินแต่ละชิ้นเสร็จใน ~7 วิหลังส่ง → ตอนเข้าหน้านี้ส่วนใหญ่ครบแล้ว เดิมแถบเต็มทันที)
const CATCHUP_MS = { analyst: 12000, communicator: 16000, creative: 20000 } as const;
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2.2);

export function PresenterJudgingScreen({ submissions, onProgressCue }: Props) {
  const total = submissions.length;

  // นับรายกรรมการจาก scores ที่ลงมาแล้วจริง
  const counts = useMemo(() => {
    let a = 0,
      c = 0,
      m = 0;
    for (const s of submissions) {
      if (s.scores?.analyst) a++;
      if (s.scores?.creative) c++;
      if (s.scores?.communicator) m++;
    }
    return { analyst: a, creative: c, communicator: m };
  }, [submissions]);

  // เวลาที่ผ่านไปตั้งแต่เข้าหน้านี้ — ขับแถบวิ่งไล่
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      if (e > CATCHUP_MS.creative + 500) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, []);

  const shownOf = (key: keyof typeof CATCHUP_MS, actual: number) =>
    Math.min(actual, Math.floor(total * easeOut(elapsed / CATCHUP_MS[key])));
  const shown = {
    analyst: shownOf('analyst', counts.analyst),
    creative: shownOf('creative', counts.creative),
    communicator: shownOf('communicator', counts.communicator),
  };
  const complete = {
    analyst: total > 0 && shown.analyst >= total,
    creative: total > 0 && shown.creative >= total,
    communicator: total > 0 && shown.communicator >= total,
  };
  const allComplete = complete.analyst && complete.creative && complete.communicator;

  const done = Math.min(shown.analyst, shown.creative, shown.communicator);
  const donePct = total > 0 ? (done / total) * 100 : 0;

  // จังหวะเสียง: กรรมการครบทีละคน แล้วครบทั้งหมด
  const completeCount =
    (complete.analyst ? 1 : 0) + (complete.creative ? 1 : 0) + (complete.communicator ? 1 : 0);
  const prevCompleteRef = useRef(0);
  useEffect(() => {
    if (completeCount > prevCompleteRef.current) {
      onProgressCue?.(completeCount >= 3 ? 'all' : 'judge');
    }
    prevCompleteRef.current = completeCount;
  }, [completeCount, onProgressCue]);

  const aIdx = useRotatingIndex(ANALYST_MESSAGES.length, JUDGE_MSG_INTERVAL_MS);
  const cIdx = useRotatingIndex(CREATIVE_MESSAGES.length, JUDGE_MSG_INTERVAL_MS + 260);
  const mIdx = useRotatingIndex(COMMUNICATOR_MESSAGES.length, JUDGE_MSG_INTERVAL_MS + 520);

  const snips = useMemo(
    () =>
      JUDGING_STREAM_SNIPPETS.map((text, i) => ({
        text,
        left: `${4 + seeded(i, 1) * 76}%`,
        duration: `${22 + seeded(i, 2) * 14}s`,
        delay: `${-seeded(i, 3) * 30}s`,
      })),
    []
  );

  return (
    <div className="t7-judging">
      <T7Ambient thirdOrb />

      <div className="t7-stream">
        {snips.map((s, i) => (
          <div
            key={i}
            className="t7-snip"
            style={{
              left: s.left,
              animationDuration: s.duration,
              animationDelay: s.delay,
            }}
          >
            {s.text}
          </div>
        ))}
      </div>

      <div className="t7-stage">
        <T7TopBar
          status={allComplete ? 'ตัดสินครบแล้ว' : 'กำลังตัดสิน'}
          variant="warn"
          dot
        />

        <div className="t7-j-headline">
          {allComplete ? (
            <>
              <div className="t7-j-big">
                <em>ผลออกแล้ว</em> พร้อมประกาศ
              </div>
              <div className="t7-j-small">กรรมการทั้ง 3 ท่านตัดสินครบทุกข้อความ</div>
            </>
          ) : (
            <>
              <div className="t7-j-big">
                <em>พี่ชัวร์</em>กำลังอ่านข้อความของทุกคน
              </div>
              <div className="t7-j-small">
                กรรมการอีก 2 ท่านก็กำลังให้คะแนนอยู่เหมือนกัน
              </div>
            </>
          )}
        </div>

        <div className="t7-judges">
          <JudgeTile
            n={1}
            emoji="📊"
            name={PERSONA_LABELS.analyst}
            role={PERSONA_ROLES.analyst}
            message={ANALYST_MESSAGES[aIdx]}
            count={shown.analyst}
            complete={complete.analyst}
            total={total}
            bg="rgba(183,156,255,.16)"
          />
          <JudgeTile
            n={2}
            emoji="🧡"
            name={PERSONA_LABELS.creative}
            role={PERSONA_ROLES.creative}
            message={CREATIVE_MESSAGES[cIdx]}
            count={shown.creative}
            complete={complete.creative}
            total={total}
            bg="rgba(245,197,24,.2)"
          />
          <JudgeTile
            n={3}
            emoji="💬"
            name={PERSONA_LABELS.communicator}
            role={PERSONA_ROLES.communicator}
            message={COMMUNICATOR_MESSAGES[mIdx]}
            count={shown.communicator}
            complete={complete.communicator}
            total={total}
            bg="rgba(255,143,176,.16)"
          />
        </div>

        <div className="t7-foot">
          <div className="t7-foot-text">
            ตัดสินแล้ว <b>{done}</b> จาก {total} ข้อความ
          </div>
          <div className="t7-foot-bar">
            <span style={{ width: `${donePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function JudgeTile({
  n,
  emoji,
  name,
  role,
  message,
  count,
  total,
  bg,
  complete,
}: {
  n: 1 | 2 | 3;
  emoji: string;
  name: string;
  role: string;
  message: string;
  count: number;
  total: number;
  bg: string;
  complete: boolean;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className={`t7-jcard t7-jcard--${n}`}>
      <div className="t7-javatar" style={{ background: bg }}>
        {emoji}
      </div>
      <div className="t7-jname">{name}</div>
      <div className="t7-jrole">{role}</div>
      <div className="t7-jmsg">
        {complete ? (
          <span
            key="complete"
            style={{
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: 999,
              background: 'rgba(93,245,145,.16)',
              border: '1.5px solid rgba(93,245,145,.7)',
              color: '#5DF591',
              fontWeight: 800,
            }}
          >
            ✓ ตัดสินครบ
          </span>
        ) : (
          <span key={message}>{message}</span>
        )}
      </div>
      <div className="t7-jbar">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="t7-jcount">
        <b>{count}</b> / {total}
      </div>
    </div>
  );
}

function useRotatingIndex(length: number, intervalMs: number): number {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs]);
  return idx;
}
