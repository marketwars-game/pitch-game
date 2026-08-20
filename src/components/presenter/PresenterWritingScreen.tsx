// =====================================================
// FILE: src/components/presenter/PresenterWritingScreen.tsx
// PROJECT: pitch-game
// TASK: T8 — LINE หาพี่มั่น (DIME x SCG)
// VERSION: T8-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-08-20
// PURPOSE: จอตอนผู้เล่นกำลังเขียน 5 นาที
//          - ข้อความพี่มั่นเป็นบับเบิลแชทแบบเดียวกับที่ทุกคนเห็นในมือถือ
//          - เครื่องมือ 7 ชิ้นเป็นแถบล่างเต็มความกว้าง (อ่านจากท้ายห้องได้)
//          - วงแหวนจำนวนคนที่ส่งแล้ว แทนแถบ progress เดิม
//          - โหมดเตือน 30 วิสุดท้าย เปลี่ยนโทนทั้งจอ ไม่ใช่แค่ตัวเลข
//
// CHANGE LOG:
//   T8-v1 (2026-08-20): strings เคสพี่มั่น — โจทย์จอใหญ่ + อวาตาร์ ม + อายุ 52 + หัวกล่องหลักผู้นำ (ไม่แตะ logic)
//   T7-v1 (2026-08-04): เขียนใหม่ — เดิมเป็น "Pitch หุ้น X ให้ลูกฟัง" + countdown 200px
//                       นาฬิกาย่อเหลือ 132px เพื่อแบ่งพื้นที่ให้เคสกับเครื่องมือ
//   T4-v2 (2026-05-07): Pass totalSeconds from game.config
// =====================================================
'use client';

import {
  type GameRow,
  type PlayerRow,
  type SubmissionRow,
  DEFAULT_GAME_CONFIG,
} from '@/lib/types';
import { useCountdown } from '@/hooks/useCountdown';
import { TOOLBOX } from '@/lib/stock-data';
import { T7Ambient, T7TopBar } from './PresenterChrome';

const RING_R = 100;
const RING_C = 2 * Math.PI * RING_R;

type Props = {
  game: GameRow;
  players: PlayerRow[];
  submissions: SubmissionRow[];
};

export function PresenterWritingScreen({ game, players, submissions }: Props) {
  const totalSeconds =
    game.config?.writingTimeSeconds ?? DEFAULT_GAME_CONFIG.writingTimeSeconds;
  const { mmss, isUrgent, secondsLeft } = useCountdown(
    game.writing_ends_at,
    totalSeconds
  );
  const warn = isUrgent && secondsLeft > 0;

  const caseData = game.stock;
  const totalPlayers = players.length;
  const submitted = submissions.length;
  const pct = totalPlayers > 0 ? Math.min(1, submitted / totalPlayers) : 0;

  const chat = caseData?.chat ?? [];

  return (
    <div className={`t7-writing${warn ? ' t7-urgent-host' : ''}`}>
      <T7Ambient />

      <div className="t7-stage">
        <T7TopBar
          status={warn ? 'เร่งมือหน่อย!' : 'โจทย์รอบนี้'}
          variant={warn ? 'danger' : 'default'}
        />

        <div className="t7-w-head">
          <div className="t7-w-title">
            พิมพ์ LINE ตอบ{caseData?.name ?? 'พี่มั่น'} 1 ข้อความ
            <br />
            <b>ให้แกเปิดใจลองก้าวแรก</b> · ห้ามสั่ง ห้ามขู่ ห้ามอ้างนโยบาย
          </div>
          <div className="t7-clockwrap">
            <div className="t7-clock-label">เวลาที่เหลือ</div>
            <div className={`t7-clock${warn ? ' t7-clock--warn' : ''}`}>{mmss}</div>
          </div>
        </div>

        <div className="t7-w-mid">
          {/* ---------- ซ้าย: แชทพี่มั่น ---------- */}
          <div className="t7-chatcol">
            {chat.map((line, i) => (
              <div key={i} className={`t7-msgrow t7-msgrow--${i + 1}`}>
                <div className={`t7-ava${i > 0 ? ' t7-ava--hidden' : ''}`}>ม</div>
                <div>
                  {i === 0 && (
                    <div className="t7-who">
                      {caseData?.name ?? 'พี่มั่น'} · {caseData?.age ?? 52}
                    </div>
                  )}
                  <div className="t7-bub">{line}</div>
                </div>
              </div>
            ))}

            <div className="t7-facts">
              {(caseData?.facts ?? []).map((f, i) => (
                <span key={i} className="t7-fact">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* ---------- ขวา: วงแหวนจำนวนที่ส่งแล้ว ---------- */}
          <div className="t7-sentcol">
            <div className="t7-ring">
              <svg width={230} height={230} viewBox="0 0 230 230">
                <circle
                  className="t7-ring-bg"
                  cx={115}
                  cy={115}
                  r={RING_R}
                  fill="none"
                  strokeWidth={14}
                />
                <circle
                  className="t7-ring-fg"
                  cx={115}
                  cy={115}
                  r={RING_R}
                  fill="none"
                  strokeWidth={14}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - pct)}
                />
              </svg>
              <div className="t7-ring-text">
                <div className="t7-ring-num">{submitted}</div>
                <div className="t7-ring-of">จาก {totalPlayers}</div>
              </div>
            </div>
            <div className="t7-sent-label">ส่งข้อความแล้ว</div>
          </div>
        </div>

        {/* ---------- ล่าง: กล่องเครื่องมือ ---------- */}
        <div className="t7-toolbar">
          <div className="t7-toolhead">
            <span className="t7-toolhead-lbl">หลักผู้นำจาก session วันนี้</span>
            <span className="t7-toolhead-rule">
              ใช้อย่างน้อย 1 ข้อ · 2–3 ข้อมีคะแนนโบนัส
            </span>
          </div>
          <div className="t7-tools">
            {TOOLBOX.map((t, i) => (
              <div
                key={t.id}
                className="t7-tool"
                style={{ animationDelay: `${0.6 + i * 0.07}s` }}
              >
                <i>{String(i + 1).padStart(2, '0')}</i>
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
