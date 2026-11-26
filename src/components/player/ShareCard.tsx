// =====================================================
// FILE: src/components/player/ShareCard.tsx
// PROJECT: pitch-game
// TASK: T11 — LINE หาพี่ชัวร์ (DIME x BU · FinTech & Digital Investment)
// VERSION: T11-v1
// CREATED: 2026-11-26
// LAST MODIFIED: 2026-11-26
// PURPOSE: "การ์ดผลของฉัน" — หน้าเต็มจอสำหรับแคปหน้าจอแล้วแชร์ต่อ
//          - พอดี 1 หน้าจอ ไม่ต้องเลื่อน (100dvh)
//          - ไม่สร้างไฟล์รูป ไม่ใช้ Web Share — ใช้การแคปหน้าจอของเครื่อง
//            (เบราว์เซอร์ในแอป LINE ดาวน์โหลดไฟล์ไม่ได้)
//          - ไม่แสดงข้อความ pitch ของผู้เล่น — แสดงเฉพาะคำตอบของพี่ชัวร์ ตัดที่ 3 บรรทัด
//          - ป้ายอันดับแสดงเฉพาะ Top 10
//          - คำแนะนำ "แคปหน้าจอ / แตะเพื่อปิด" จางหายเองใน 4 วิ เพื่อให้ภาพที่แคปสะอาด
//          - อ่านค่าจาก props อย่างเดียว ไม่ยิง DB / realtime เพิ่ม
//
// CHANGE LOG:
//   T11-v1 (2026-11-26): Initial
// =====================================================
'use client';

import type { SubmissionScores } from '@/lib/types';
import { formatScoreCompare, formatScorePersonal } from '@/lib/ranking';

export const SHARE_RANK_TOP_N = 10;

const JUDGES: {
  key: 'analyst' | 'creative' | 'communicator';
  label: string;
  color: string;
  soft: string;
}[] = [
  { key: 'analyst', label: 'The Analyst', color: '#A78BFA', soft: 'rgba(139,92,246,0.16)' },
  { key: 'creative', label: 'พี่ชัวร์', color: '#FF8C42', soft: 'rgba(255,140,66,0.16)' },
  { key: 'communicator', label: 'Communicator', color: '#FF7BA1', soft: 'rgba(255,92,138,0.15)' },
];

interface ShareCardProps {
  nickname: string | null;
  finalScore: number | null;
  scores: SubmissionScores | null;
  rank: number | null;
  total: number | null;
  reply: string | null;
  onClose: () => void;
}

export function ShareCard({
  nickname,
  finalScore,
  scores,
  rank,
  total,
  reply,
  onClose,
}: ShareCardProps) {
  const showRank = rank !== null && total !== null && rank <= SHARE_RANK_TOP_N;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="การ์ดผลของฉัน"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        height: '100dvh',
        background:
          'radial-gradient(ellipse 90% 50% at 50% 0%, rgba(93,245,145,0.16), transparent 70%), ' +
          'radial-gradient(ellipse 80% 45% at 85% 55%, rgba(139,92,246,0.16), transparent 70%), ' +
          'radial-gradient(ellipse 80% 40% at 10% 90%, rgba(255,217,61,0.08), transparent 70%), ' +
          '#000000',
        display: 'flex',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes share-hint-out { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes share-card-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: 430,
          height: '100%',
          boxSizing: 'border-box',
          padding:
            'max(18px, env(safe-area-inset-top)) 22px max(14px, env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          gap: 10,
          textAlign: 'center',
          color: '#FFFFFF',
          animation: 'share-card-in 0.25s ease-out both',
        }}
      >
        {/* ---------- บน: แบรนด์ + ชื่อเกม ---------- */}
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 13px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 'clamp(8px, 2.55vw, 10px)',
              fontWeight: 800,
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: '#5DF591' }}>DIME × BU</span>
            <span style={{ color: '#71717A', fontWeight: 400 }}>·</span>
            <span style={{ color: '#6FA0FF' }}>FINTECH & DIGITAL INVESTMENT</span>
          </span>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              marginTop: 14,
              lineHeight: 1.15,
            }}
          >
            LINE หา<span style={{ color: '#06C167' }}>พี่ชัวร์</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#A1A1AA', marginTop: 5 }}>
            อธิบายหุ้น SpaceX ให้คนกลัวเสี่ยงเข้าใจ ใน 1 ข้อความ
          </div>
        </div>

        {/* ---------- กลาง: ชื่อ + คะแนน + อันดับ ---------- */}
        <div style={{ width: '100%' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nickname ?? ''}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'baseline',
              gap: 7,
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 84,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-2.5px',
                fontVariantNumeric: 'tabular-nums',
                background: 'linear-gradient(135deg, #5DF591 0%, #FFD93D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatScoreCompare(finalScore)}
            </span>
            <span style={{ fontSize: 20, color: '#71717A', fontWeight: 600 }}>/ 10</span>
          </div>
          {showRank && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                padding: '6px 16px',
                borderRadius: 999,
                background: 'rgba(255,217,61,0.14)',
                border: '1px solid rgba(255,217,61,0.45)',
                color: '#FFD93D',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              🏆 อันดับ {rank} จาก {total} คน
            </div>
          )}
        </div>

        {/* ---------- กรรมการ 3 คน ---------- */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          {JUDGES.map((j) => (
            <div
              key={j.key}
              style={{
                background: j.soft,
                border: `1px solid ${j.color}55`,
                borderRadius: 12,
                padding: '9px 4px 8px',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: j.color,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {j.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatScorePersonal(scores?.[j.key]?.score)}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- คำตอบของพี่ชัวร์ (ตัด 3 บรรทัด) ---------- */}
        {reply && (
          <div style={{ width: '100%', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#FF8C42',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ช
            </div>
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: '#A1A1AA', margin: '0 0 3px 2px' }}>
                พี่ชัวร์ตอบกลับ
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#111111',
                  borderRadius: '4px 14px 14px 14px',
                  padding: '8px 12px',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {/* clamp อยู่ชั้นใน (ไม่มี padding) — ไม่งั้นบรรทัดที่ 4 จะโผล่ในช่อง padding ล่าง */}
                <div
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {reply}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- ล่าง: ข้อคิด + หมายเหตุ ---------- */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D4D4D8' }}>
            What → How → Yet · AI เก่งเท่า context ที่เราป้อน
          </div>
          <div style={{ fontSize: 9.5, color: '#71717A', marginTop: 4 }}>
            KKP Dime · เกมเพื่อการเรียนรู้ ไม่ใช่คำแนะนำการลงทุน
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#A1A1AA',
              marginTop: 8,
              height: 16,
              animation: 'share-hint-out 4s ease-out forwards',
            }}
          >
            📸 แคปหน้าจอเพื่อแชร์ · แตะที่ใดก็ได้เพื่อปิด
          </div>
        </div>
      </div>
    </div>
  );
}
