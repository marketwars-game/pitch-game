// =====================================================
// FILE: src/components/player/WritingScreen.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-08-04
// PURPOSE: หน้าเขียน — หน้าจอแชทแบบ LINE
//          - บับเบิลพี่เก่งเปิดเรื่อง + กล่องโจทย์ + บับเบิลเขียวของผู้เล่นแบบ live
//          - แถบเครื่องมือ 7 ชิ้น หดเองตอนคีย์บอร์ดเด้ง (Q1 = ก)
//          - หลังส่งแล้ว ข้อความค้างไว้ให้อ่านทวน ช่องพิมพ์ปิด
//
// ตรรกะที่คงไว้ 100% จาก T1-v1 (ห้ามแตะ):
//          - auto-submit ตอน countdown หมด (fire ครั้งเดียว ผ่าน ref)
//          - min/max length จาก game.config
//          - submitting / submitError states
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): เขียนใหม่เป็น LINE layout (เดิม: challenge box + StockCard)
//                       - ใช้ชิ้นส่วนจาก KengChat.tsx + ToolTray.tsx
//                       - เนื้อหาโจทย์มาจาก game.stock (CaseData)
//                       - เลิกใช้ StockCard (ไฟล์ยังอยู่ในรีโปแต่ไม่ถูกเรียก)
//   T1-v1 (2026-05-06): Initial — sticky header, gradient challenge, textarea, auto-submit
// =====================================================
'use client';

import { useState, useRef, useEffect } from 'react';
import type { GameRow, SubmissionRow } from '@/lib/types';
import { DEFAULT_GAME_CONFIG } from '@/lib/types';
import type { UseCountdownResult } from '@/hooks/useCountdown';
import {
  ChatHeader,
  ChatTimer,
  ChatSurface,
  ChatDay,
  KengIntro,
  MyBubble,
  TaskNote,
  KengChatStyles,
  CHAT_CHROME,
  CHAT_BORDER,
  CHAT_SEND,
} from './KengChat';
import { ToolChips, ToolButton } from './ToolTray';

interface WritingScreenProps {
  game: GameRow;
  countdown: UseCountdownResult;
  submission: SubmissionRow | null;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (pitch: string) => Promise<boolean>;
  onAutoSubmit: (pitch: string) => Promise<boolean>;
}

export function WritingScreen({
  game,
  countdown,
  submission,
  submitting,
  submitError,
  onSubmit,
  onAutoSubmit,
}: WritingScreenProps) {
  const [pitch, setPitch] = useState('');
  const [typing, setTyping] = useState(false); // โฟกัสช่องพิมพ์ = คีย์บอร์ดเด้ง
  const [trayOpen, setTrayOpen] = useState(false); // กด 🧰 กางกลับระหว่างพิมพ์

  const config = game.config ?? DEFAULT_GAME_CONFIG;
  const minLen = config.pitchMinLength;
  const maxLen = config.pitchMaxLength;
  const caseData = game.stock;

  const chatRef = useRef<HTMLDivElement | null>(null);
  const isSubmitted = !!submission;

  // ---------- Auto-submit ตอนหมดเวลา (ตรรกะเดิม T1-v1) ----------
  const autoSubmitFiredRef = useRef(false);
  useEffect(() => {
    if (
      countdown.isExpired &&
      !submission &&
      !submitting &&
      !autoSubmitFiredRef.current
    ) {
      autoSubmitFiredRef.current = true;
      onAutoSubmit(pitch);
    }
  }, [countdown.isExpired, submission, submitting, pitch, onAutoSubmit]);

  // ---------- เลื่อนแชทลงล่างสุดเมื่อข้อความยาวขึ้น ----------
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pitch, isSubmitted, typing]);

  const trimmed = pitch.trim();
  const canSubmit = trimmed.length >= minLen && !submitting && !isSubmitted;
  const isAtMax = pitch.length >= maxLen;

  const handleChange = (val: string) => {
    setPitch(val.slice(0, maxLen));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  // แถบชิปโชว์เมื่อ: ยังไม่ส่ง และ (ยังไม่พิมพ์ หรือกด 🧰 เปิดไว้)
  const showChips = !isSubmitted && (!typing || trayOpen);

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

      <ChatHeader
        name={caseData?.name ?? 'พี่เก่ง'}
        status="ออนไลน์อยู่"
        right={<ChatTimer mmss={countdown.mmss} urgent={countdown.isUrgent} />}
      />

      <ChatSurface scrollRef={chatRef}>
        <ChatDay label="วันนี้ · วงข้าวเที่ยง" />

        <KengIntro caseData={caseData} />

        {!isSubmitted && <TaskNote rules={caseData?.rules ?? []} />}

        {isSubmitted ? (
          <>
            <MyBubble time="อ่านแล้ว">{submission?.pitch ?? pitch}</MyBubble>
            <SentNote autoSubmitted={submission?.auto_submitted ?? false} />
          </>
        ) : (
          <MyBubble empty={trimmed.length === 0}>
            {trimmed.length === 0 ? 'ข้อความของคุณจะขึ้นตรงนี้…' : pitch}
          </MyBubble>
        )}
      </ChatSurface>

      {/* ---------- แถบล่าง: เครื่องมือ + ช่องพิมพ์ ---------- */}
      <div
        style={{
          background: CHAT_CHROME,
          borderTop: `1px solid ${CHAT_BORDER}`,
          padding: '7px 9px 0',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        {showChips && <ToolChips />}

        {submitError && (
          <div
            style={{
              background: '#FFE9EF',
              color: '#D01345',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 11.5,
              marginBottom: 6,
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {submitError}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 7,
            padding: '5px 2px 8px',
            opacity: isSubmitted ? 0.45 : 1,
            pointerEvents: isSubmitted ? 'none' : 'auto',
          }}
        >
          <ToolButton
            active={trayOpen && typing}
            showDot={!showChips}
            disabled={isSubmitted}
            onClick={() => setTrayOpen((v) => !v)}
          />

          <textarea
            value={pitch}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              setTyping(true);
              setTrayOpen(false);
            }}
            onBlur={() => setTyping(false)}
            disabled={submitting || isSubmitted}
            placeholder={
              isSubmitted ? 'ส่งไปแล้ว — แก้ไขไม่ได้' : 'พิมพ์ข้อความถึงพี่เก่ง…'
            }
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              border: '1px solid #d7dade',
              background: '#fff',
              borderRadius: 18,
              padding: '9px 13px',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'none',
              height: typing ? 64 : 36,
              maxHeight: 96,
              color: '#111',
              lineHeight: 1.45,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'height 0.15s',
            }}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="ส่งข้อความ"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: canSubmit ? CHAT_SEND : '#d7dade',
              color: '#fff',
              border: 'none',
              fontSize: 15,
              flexShrink: 0,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              padding: 0,
              boxSizing: 'border-box',
            }}
          >
            {submitting ? '…' : '➤'}
          </button>
        </div>

        {!isSubmitted && (
          <div
            style={{
              fontSize: 9.5,
              textAlign: 'right',
              padding: '0 4px 7px',
              fontVariantNumeric: 'tabular-nums',
              color: isAtMax ? '#D01345' : trimmed.length >= minLen ? '#046B3A' : '#7b8089',
              fontWeight: trimmed.length >= minLen ? 700 : 400,
            }}
          >
            {pitch.length} / {maxLen} ·{' '}
            {trimmed.length >= minLen ? 'ส่งได้แล้ว' : `ขั้นต่ำ ${minLen} ตัวอักษร`}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// การ์ดยืนยันหลังส่ง (อยู่ในแชท ไม่ใช่หน้าจอใหม่)
// =====================================================
function SentNote({ autoSubmitted }: { autoSubmitted: boolean }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.8)',
        borderRadius: 9,
        padding: '10px 12px',
        textAlign: 'center',
        fontSize: 11.5,
        color: '#33404d',
        margin: '4px 0 8px',
        lineHeight: 1.6,
        boxSizing: 'border-box',
      }}
    >
      <b style={{ color: '#046B3A', display: 'block', marginBottom: 2 }}>
        {autoSubmitted ? '⏱ หมดเวลา — ระบบส่งให้อัตโนมัติ' : '✓ ส่งข้อความให้พี่เก่งแล้ว'}
      </b>
      รอเพื่อนๆ ส่งให้ครบก่อนนะ แล้วเรามาดูกันว่าพี่เก่งจะตอบว่าอะไร
    </div>
  );
}
