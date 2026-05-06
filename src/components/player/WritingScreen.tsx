// =====================================================
// FILE: src/components/player/WritingScreen.tsx
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Writing screen — รองรับ 2 states จาก mockup-v5:
//          State 4: active writing (sticky countdown + premium challenge + textarea)
//          State 5: submitted (sticky countdown ยังนับ + success card + รอ)
//          Auto-submit ตอน countdown หมด (decision D3 — empty pitch ก็ส่ง)
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Initial — sticky header, gradient challenge, textarea, auto-submit
// =====================================================
'use client';

import { useState, useRef, useEffect } from 'react';
import { StockCard } from './StockCard';
import type { GameRow, SubmissionRow } from '@/lib/types';
import { DEFAULT_GAME_CONFIG } from '@/lib/types';
import type { UseCountdownResult } from '@/hooks/useCountdown';

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
  const config = game.config ?? DEFAULT_GAME_CONFIG;
  const minLen = config.pitchMinLength;
  const maxLen = config.pitchMaxLength;

  // Auto-submit ตอน countdown หมด (fire ครั้งเดียว)
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

  const trimmedLen = pitch.trim().length;
  const canSubmit = !submission && !submitting && trimmedLen >= minLen;
  const isAtMax = pitch.length >= maxLen;

  const handleChange = (val: string) => {
    // Hard block ที่ max length (decision M7b)
    if (val.length > maxLen) {
      setPitch(val.slice(0, maxLen));
    } else {
      setPitch(val);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(pitch);
  };

  const isSubmitted = !!submission;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Sticky header — countdown + progress */}
      <StickyHeader countdown={countdown} />

      {/* Body แบบ scroll ได้ */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
        }}
      >
        {isSubmitted ? (
          <SubmittedView />
        ) : (
          <ActiveView
            stock={game.stock}
            pitch={pitch}
            onChange={handleChange}
            minLen={minLen}
            maxLen={maxLen}
            isAtMax={isAtMax}
            canSubmit={canSubmit}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

// =====================================================
// Sticky countdown header (ใช้ทั้ง State 4 + 5)
// =====================================================
function StickyHeader({ countdown }: { countdown: UseCountdownResult }) {
  const fillPct = countdown.progress * 100;
  let fillColor = '#5DF591'; // mint
  let glowColor = 'rgba(93,245,145,0.5)';
  if (countdown.progress < 0.2) {
    fillColor = '#FF5C8A';
    glowColor = 'rgba(255,92,138,0.6)';
  } else if (countdown.progress < 0.5) {
    fillColor = '#FFD93D';
    glowColor = 'rgba(255,217,61,0.5)';
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: '#71717A',
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          ⏱ เวลาที่เหลือ
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.5px',
            color: countdown.isUrgent ? '#FF5C8A' : '#FFFFFF',
            animation: countdown.isUrgent ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          {countdown.mmss}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${fillPct}%`,
            borderRadius: 999,
            background: fillColor,
            boxShadow: `0 0 12px ${glowColor}`,
            transition: 'width 1s linear, background 0.5s, box-shadow 0.5s',
          }}
        />
      </div>
    </div>
  );
}

// =====================================================
// Active view (State 4) — challenge + stock + textarea + submit
// =====================================================
interface ActiveViewProps {
  stock: GameRow['stock'];
  pitch: string;
  onChange: (val: string) => void;
  minLen: number;
  maxLen: number;
  isAtMax: boolean;
  canSubmit: boolean;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

function ActiveView({
  stock,
  pitch,
  onChange,
  minLen,
  maxLen,
  isAtMax,
  canSubmit,
  submitting,
  submitError,
  onSubmit,
}: ActiveViewProps) {
  return (
    <>
      {/* Premium challenge box (gradient border) */}
      <PremiumChallengeBox stockTicker={stock?.ticker ?? '—'} />

      {/* Stock card (header only) */}
      {stock && <StockCard stock={stock} />}

      {/* Textarea */}
      <textarea
        value={pitch}
        onChange={(e) => onChange(e.target.value)}
        placeholder="เริ่มเขียน Pitch ของคุณ..."
        disabled={submitting}
        style={{
          width: '100%',
          height: 180,
          padding: 12,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#1c1c1e',
          color: '#FFFFFF',
          fontSize: 14,
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.55,
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#5DF591')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      />

      {/* Char counter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 11,
          color: '#71717A',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ color: isAtMax ? '#FF5C8A' : '#71717A', fontWeight: isAtMax ? 700 : 400 }}>
          {pitch.length} / {maxLen}
        </span>
        <span>ขั้นต่ำ {minLen} ตัวอักษร</span>
      </div>

      {/* Error ตอน submit */}
      {submitError && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            background: 'rgba(255,92,138,0.08)',
            color: '#FF5C8A',
            borderRadius: 8,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          {submitError}
        </div>
      )}

      {/* ปุ่ม Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 10,
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          background: canSubmit ? '#5DF591' : '#1c1c1e',
          color: canSubmit ? '#062b13' : '#52525B',
          marginTop: 12,
          transition: 'background 0.15s',
        }}
      >
        {submitting ? 'กำลังส่ง...' : 'ส่ง Pitch'}
      </button>
    </>
  );
}

// =====================================================
// Premium challenge box (gradient border)
// =====================================================
function PremiumChallengeBox({ stockTicker }: { stockTicker: string }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        padding: 1.5,
        background: 'linear-gradient(135deg, #8B5CF6 0%, #3B7DFF 50%, #5DF591 100%)',
        marginBottom: 14,
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px -8px rgba(139,92,246,0.35), 0 4px 16px -4px rgba(93,245,145,0.18)',
      }}
    >
      <div
        style={{
          background: '#0d0d10',
          borderRadius: 12.5,
          padding: '14px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(139,92,246,0.12), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(93,245,145,0.08), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9,
            letterSpacing: 1.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            marginBottom: 8,
            background: 'linear-gradient(90deg, #3B7DFF, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            zIndex: 1,
          }}
        >
          ◆ โจทย์
        </div>
        <div
          style={{
            position: 'relative',
            fontSize: 13.5,
            color: '#FFFFFF',
            lineHeight: 1.6,
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          Pitch หุ้น{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #3B7DFF, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
            }}
          >
            {stockTicker}
          </span>{' '}
          ให้ลูกฟัง
          <br />
          ทำไมควรเอาเงิน{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #5DF591, #3B7DFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
            }}
          >
            50 บาท
          </span>{' '}
          มาลงทุน
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Submitted view (State 5)
// =====================================================
function SubmittedView() {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          background: 'rgba(93,245,145,0.14)',
          border: '1px solid rgba(93,245,145,0.35)',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: '#5DF591',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#062b13',
            fontSize: 14,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 14, color: '#5DF591', fontWeight: 700 }}>
          ส่ง Pitch เรียบร้อยแล้ว
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 8px',
          textAlign: 'center',
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
            marginBottom: 16,
          }}
        >
          ⏳
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 8,
            letterSpacing: '-0.3px',
          }}
        >
          รอผู้เล่นคนอื่น
        </div>
        <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55 }}>
          เมื่อหมดเวลา กรรมการ AI
          <br />
          จะเริ่มตัดสินทันที
        </div>
      </div>
    </>
  );
}
