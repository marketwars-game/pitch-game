// =====================================================
// FILE: src/components/presenter/PresenterJudgingScreen.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-08-04
// PURPOSE: จอระหว่างรอ AI ตัดสิน (~1-2 นาที)
//          - พื้นหลังเป็นข้อความจริงของผู้เล่นลอยขึ้น (ไม่มีชื่อ) ให้ MC เล่นต่อได้
//          - พี่เก่งอยู่กลาง เน้นสีทอง เพราะองก์ 1 ที่ตามมาคือข้อความจากแก
//          - ความคืบหน้าแยกรายกรรมการ (ของจริงยิงขนาน เสร็จไม่พร้อมกัน)
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): เขียนใหม่ — ชื่อกรรมการใหม่, stream พื้นหลัง,
//                       รับ submissions เพื่อแสดงความคืบหน้าจริง (เดิมไม่มี props)
//   T4-v1 (2026-05-07): Initial
// =====================================================
'use client';

import { useEffect, useMemo, useState } from 'react';
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
};

export function PresenterJudgingScreen({ submissions }: Props) {
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

  const done = Math.min(counts.analyst, counts.creative, counts.communicator);
  const donePct = total > 0 ? (done / total) * 100 : 0;

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
        <T7TopBar status="กำลังตัดสิน" variant="warn" dot />

        <div className="t7-j-headline">
          <div className="t7-j-big">
            <em>พี่เก่ง</em>กำลังอ่านข้อความของทุกคน
          </div>
          <div className="t7-j-small">
            กรรมการอีก 2 ท่านก็กำลังให้คะแนนอยู่เหมือนกัน
          </div>
        </div>

        <div className="t7-judges">
          <JudgeTile
            n={1}
            emoji="🎓"
            name={PERSONA_LABELS.analyst}
            role={PERSONA_ROLES.analyst}
            message={ANALYST_MESSAGES[aIdx]}
            count={counts.analyst}
            total={total}
            bg="rgba(183,156,255,.16)"
          />
          <JudgeTile
            n={2}
            emoji="🧡"
            name={PERSONA_LABELS.creative}
            role={PERSONA_ROLES.creative}
            message={CREATIVE_MESSAGES[cIdx]}
            count={counts.creative}
            total={total}
            bg="rgba(245,197,24,.2)"
          />
          <JudgeTile
            n={3}
            emoji="💬"
            name={PERSONA_LABELS.communicator}
            role={PERSONA_ROLES.communicator}
            message={COMMUNICATOR_MESSAGES[mIdx]}
            count={counts.communicator}
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
}: {
  n: 1 | 2 | 3;
  emoji: string;
  name: string;
  role: string;
  message: string;
  count: number;
  total: number;
  bg: string;
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
        <span key={message}>{message}</span>
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
