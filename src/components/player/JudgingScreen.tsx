// =====================================================
// FILE: src/components/player/JudgingScreen.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-08-04
// PURPOSE: หน้ารอตัดสิน — อยู่ในหน้าแชทเดิม ไม่ตัดไปหน้าอนิเมชันอื่น
//          ใช้ "กำลังพิมพ์…" แบบ LINE ซึ่งจะกลายเป็นข้อความจริงของพี่เก่ง
//          ในหน้าถัดไป (องก์ 1 ของการเฉลย) — ต่อเนื่องเป็นเรื่องเดียว
//
//          variant='waiting'      → ส่งแล้ว รอพี่เก่งอ่าน
//          variant='not-playing'  → ไม่ได้ส่ง (คงพฤติกรรมเดิม)
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): เขียนใหม่เป็นหน้าแชท (เดิม: neural network SVG)
//                       + รับ pitch/caseName เพื่อโชว์ข้อความของผู้เล่นค้างไว้
//   T1-v1 (2026-05-06): Initial — neural network SVG + status dots
// =====================================================
'use client';

import {
  ChatHeader,
  ChatSurface,
  MyBubble,
  TypingBubble,
  KengChatStyles,
} from './KengChat';

interface JudgingScreenProps {
  variant: 'waiting' | 'not-playing';
  pitch?: string | null;
  caseName?: string;
}

export function JudgingScreen({ variant, pitch, caseName }: JudgingScreenProps) {
  const name = caseName ?? 'พี่เก่ง';

  // ---------- ไม่ได้แข่งรอบนี้ (คงเดิม) ----------
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
          👀
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
          ไม่ได้แข่งรอบนี้
        </div>
        <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55 }}>
          รอชมผลบนจอใหญ่ได้เลย
        </div>
      </div>
    );
  }

  // ---------- ส่งแล้ว รอพี่เก่งอ่าน ----------
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
      }}
    >
      <KengChatStyles />

      <ChatHeader name={name} status="กำลังพิมพ์…" statusColor="#046B3A" />

      <ChatSurface>
        {pitch && (
          <MyBubble time="อ่านแล้ว" compact>
            {pitch}
          </MyBubble>
        )}

        <TypingBubble />

        <div style={{ textAlign: 'center', marginTop: 22, padding: '0 10px' }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 800,
              color: '#33404d',
              letterSpacing: '-0.2px',
            }}
          >
            {name}กำลังอ่านข้อความของคุณ…
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: '#4c5a68',
              marginTop: 6,
              lineHeight: 1.65,
            }}
          >
            อาจารย์การเงินกับเพื่อนที่อ่านแชท
            <br />
            ก็กำลังให้คะแนนอยู่เหมือนกัน
          </div>
        </div>
      </ChatSurface>
    </div>
  );
}
