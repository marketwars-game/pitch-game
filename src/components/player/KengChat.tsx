// =====================================================
// FILE: src/components/player/KengChat.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-08-04
// LAST MODIFIED: 2026-08-04
// PURPOSE: ชิ้นส่วนหน้าจอแชทแบบ LINE — ใช้ร่วมกัน 3 หน้าจอ
//          WritingScreen (เขียน) · JudgingScreen (รอพี่เก่งอ่าน) · ResultsScreen (องก์ 1)
//          เลียนแบบเลย์เอาต์อย่างเดียว ไม่ใช้โลโก้/เครื่องหมายการค้าของ LINE
//
// หมายเหตุ Lesson 27: Tailwind v4 ไม่ apply universal box-sizing reset
//          ทุก block ที่ width:100% + padding ต้องใส่ boxSizing: 'border-box' เอง
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): Initial
// =====================================================
'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { CaseData } from '@/lib/types';

// =====================================================
// Palette (ตรงกับ mockup v3)
// =====================================================
export const CHAT_BG =
  'linear-gradient(180deg, #A9C7E8 0%, #B9D4EE 46%, #CBE0F3 100%)';
export const CHAT_CHROME = '#F2F3F5';
export const CHAT_BORDER = '#dcdee1';
export const CHAT_SEND = '#06C167';
export const CHAT_MINE = '#9DE882';

// =====================================================
// Header — แถบบนแบบหน้าแชท
// =====================================================
export function ChatHeader({
  name,
  status,
  statusColor,
  right,
}: {
  name: string;
  status: string;
  statusColor?: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        background: CHAT_CHROME,
        borderBottom: `1px solid ${CHAT_BORDER}`,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ color: '#5b5f66', fontSize: 18, lineHeight: 1 }}>‹</span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#111',
            letterSpacing: '-0.2px',
            lineHeight: 1.25,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: statusColor ?? '#7b8089',
            fontWeight: statusColor ? 700 : 400,
          }}
        >
          {status}
        </div>
      </div>
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  );
}

// =====================================================
// Timer pill (มุมขวาบนของ header)
// =====================================================
export function ChatTimer({ mmss, urgent }: { mmss: string; urgent: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: urgent ? '#FFE9EF' : '#fff',
        border: `1px solid ${urgent ? '#FFB9CC' : CHAT_BORDER}`,
        color: urgent ? '#D01345' : '#111',
        borderRadius: 999,
        padding: '4px 11px',
        fontSize: 13,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        boxSizing: 'border-box',
        animation: urgent ? 'pulse 1s ease-in-out infinite' : undefined,
      }}
    >
      {mmss}
    </span>
  );
}

// =====================================================
// Chat surface — พื้นหลังฟ้าอ่อน scroll ได้
// =====================================================
export function ChatSurface({
  children,
  scrollRef,
  style,
}: {
  children: ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
}) {
  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '12px 11px 8px',
        background: CHAT_BG,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// =====================================================
// Day divider
// =====================================================
export function ChatDay({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 11 }}>
      <span
        style={{
          background: 'rgba(255,255,255,0.62)',
          color: '#41505f',
          fontSize: 10.5,
          fontWeight: 700,
          borderRadius: 999,
          padding: '3px 12px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// =====================================================
// บับเบิลของพี่เก่ง (ฝั่งซ้าย)
// =====================================================
export function KengBubble({
  children,
  showAvatar = true,
  time,
  compact,
}: {
  children: ReactNode;
  showAvatar?: boolean;
  time?: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 7,
        marginBottom: 8,
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: '#F0A868',
          color: '#5a2c06',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 13,
          visibility: showAvatar ? 'visible' : 'hidden',
        }}
      >
        ก
      </div>
      <div
        style={{
          background: '#fff',
          borderRadius: '4px 15px 15px 15px',
          padding: '8px 11px',
          fontSize: compact ? 11.5 : 12.5,
          color: '#141414',
          maxWidth: 218,
          boxShadow: '0 1px 1px rgba(0,0,0,0.07)',
          lineHeight: 1.55,
          boxSizing: 'border-box',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </div>
      {time && (
        <span
          style={{
            fontSize: 9,
            color: '#5c6b7a',
            alignSelf: 'flex-end',
            marginBottom: 2,
            flexShrink: 0,
          }}
        >
          {time}
        </span>
      )}
    </div>
  );
}

// =====================================================
// บับเบิลของผู้เล่น (ฝั่งขวา สีเขียว)
// =====================================================
export function MyBubble({
  children,
  time,
  empty,
  compact,
}: {
  children: ReactNode;
  time?: string;
  empty?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 7,
        marginBottom: 8,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
    >
      {time && (
        <span
          style={{
            fontSize: 9,
            color: '#5c6b7a',
            alignSelf: 'flex-end',
            marginBottom: 2,
            flexShrink: 0,
          }}
        >
          {time}
        </span>
      )}
      <div
        style={{
          background: empty ? 'rgba(255,255,255,0.42)' : CHAT_MINE,
          border: empty ? '1px dashed rgba(0,0,0,0.13)' : 'none',
          color: empty ? '#4c5a68' : '#141414',
          fontStyle: empty ? 'italic' : 'normal',
          borderRadius: '15px 4px 15px 15px',
          padding: '8px 11px',
          fontSize: compact ? 11.5 : 12.5,
          maxWidth: 232,
          boxShadow: empty ? 'none' : '0 1px 1px rgba(0,0,0,0.07)',
          lineHeight: 1.55,
          boxSizing: 'border-box',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// =====================================================
// กล่องโจทย์ (แทรกกลางแชท)
// =====================================================
export function TaskNote({ rules }: { rules: string[] }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.74)',
        borderLeft: '3px solid #FF8C42',
        borderRadius: 8,
        padding: '9px 11px',
        fontSize: 11.5,
        color: '#33404d',
        margin: '2px 0 11px',
        lineHeight: 1.6,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ color: '#B25510', fontWeight: 800, marginBottom: 3 }}>
        โจทย์ — พิมพ์ตอบพี่เก่ง 1 ข้อความ ให้แกกล้าเริ่มก้าวแรกวันนี้
      </div>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 5 }}>
          <span style={{ color: '#B25510', fontWeight: 800, flexShrink: 0 }}>
            {i === 0 ? '①' : '②'}
          </span>
          <span>{r}</span>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// บับเบิล "กำลังพิมพ์…" (จุดสามจุด)
// =====================================================
export function TypingBubble() {
  return (
    <KengBubble>
      <span
        style={{
          display: 'inline-flex',
          gap: 4,
          alignItems: 'center',
          padding: '3px 2px',
        }}
      >
        {[0, 0.2, 0.4].map((d) => (
          <span
            key={d}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#8a97a5',
              display: 'inline-block',
              animation: 'keng-typing 1.2s ease-in-out infinite',
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </span>
    </KengBubble>
  );
}

// =====================================================
// ชุดบับเบิลเปิดเรื่องของพี่เก่ง (จาก CaseData.chat)
// =====================================================
export function KengIntro({
  caseData,
  time = '12:04',
}: {
  caseData: CaseData | null;
  time?: string;
}) {
  const lines = caseData?.chat ?? [];
  if (lines.length === 0) {
    return <KengBubble time={time}>{caseData?.headline ?? '—'}</KengBubble>;
  }
  return (
    <>
      {lines.map((line, i) => (
        <KengBubble key={i} showAvatar={i === 0} time={i === lines.length - 1 ? time : undefined}>
          {line}
        </KengBubble>
      ))}
    </>
  );
}

// =====================================================
// Keyframes ที่ไฟล์นี้ใช้ (inject ครั้งเดียว)
// =====================================================
export function KengChatStyles() {
  return (
    <style>{`
      @keyframes keng-typing {
        0%, 60%, 100% { opacity: 0.3; }
        30% { opacity: 1; }
      }
    `}</style>
  );
}
