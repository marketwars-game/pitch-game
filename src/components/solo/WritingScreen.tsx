// =====================================================
// FILE: src/components/solo/WritingScreen.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: 4-min countdown + challenge box (Pitch ให้ลูกฟัง · 50 บาท) + textarea.
//          Auto-submits at 0:00 (even with empty pitch).
//          Local timer (not server-driven — solo flow has no server-side game state).
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial — matches MEXPO26-PITCH-GAME-T6-mockup-v3
// =====================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_GAME_CONFIG } from '@/lib/types';

const WRITING_SECONDS = DEFAULT_GAME_CONFIG.writingTimeSeconds; // 240
const PITCH_MAX = DEFAULT_GAME_CONFIG.pitchMaxLength;            // 1500
const PITCH_MIN = DEFAULT_GAME_CONFIG.pitchMinLength;            // 50

type Props = {
  onSubmit: (pitch: string, autoSubmitted?: boolean) => Promise<void>;
};

export function WritingScreen({ onSubmit }: Props) {
  const [pitch, setPitch] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(WRITING_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Local countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit at 0:00
  useEffect(() => {
    if (secondsLeft === 0 && !submittedRef.current && !submitting) {
      submittedRef.current = true;
      setSubmitting(true);
      void onSubmit(pitch, true);
    }
  }, [secondsLeft, pitch, onSubmit, submitting]);

  const handleManualSubmit = () => {
    if (submittedRef.current || submitting) return;
    if (pitch.length < PITCH_MIN) return;
    submittedRef.current = true;
    setSubmitting(true);
    void onSubmit(pitch, false);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const urgent = secondsLeft <= 30;
  const fillPct = (secondsLeft / WRITING_SECONDS) * 100;
  const charCount = pitch.length;
  const canSubmit = charCount >= PITCH_MIN && !submitting;

  return (
    <div className="solo-writing">
      <div className="mesh-bg" />

      <div className="writing-scroll">
        {/* Sticky countdown */}
        <div className="sticky-header">
          <div className="countdown-row">
            <span className="countdown-label">เหลือเวลา</span>
            <span className={`countdown-time ${urgent ? 'urgent' : ''}`}>{timeStr}</span>
          </div>
          <div className="countdown-bar">
            <div
              className={`countdown-fill ${urgent ? 'urgent' : ''}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Challenge box */}
        <div className="challenge-box">
          <div className="challenge-eyebrow">โจทย์</div>
          <div className="challenge-text">
            Pitch หุ้น <span className="challenge-stock">PLTR</span> ให้ลูกฟัง
            <br />
            ทำไมควรเอาเงิน <span className="challenge-amount">50 บาท</span>
            <br />
            มาลงทุน
          </div>
        </div>

        <label className="label">Pitch ของคุณ</label>
        <textarea
          className="textarea"
          placeholder="ลองอธิบายให้ลูกเข้าใจง่ายๆ ว่าทำไมต้องลงทุน 50 บาทใน PLTR..."
          maxLength={PITCH_MAX}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          disabled={submitting}
        />
        <div className="char-counter">
          <span>ขั้นต่ำ {PITCH_MIN} ตัวอักษร</span>
          <span style={{ color: charCount >= PITCH_MIN ? '#5DF591' : '#71717A' }}>
            {charCount} / {PITCH_MAX}
          </span>
        </div>

        <button
          type="button"
          className={`btn ${canSubmit ? 'btn-primary' : 'btn-disabled'}`}
          onClick={handleManualSubmit}
          disabled={!canSubmit}
        >
          {submitting ? 'กำลังส่ง…' : 'ส่ง Pitch →'}
        </button>

        <div className="writing-footer">หมดเวลาจะ auto-submit อัตโนมัติ</div>
      </div>

      <style jsx>{`
        .solo-writing {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .mesh-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%,    rgba(59,125,255,0.27), transparent 60%),
            radial-gradient(ellipse 50% 35% at 90% 15%,   rgba(139,92,246,0.22), transparent 60%),
            radial-gradient(ellipse 70% 40% at 50% 100%,  rgba(93,245,145,0.13), transparent 60%);
          animation: mesh-shift 16s ease-in-out infinite alternate;
        }
        @keyframes mesh-shift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-6px, 4px) scale(1.04); }
          100% { transform: translate(4px, -4px) scale(1.02); }
        }

        .writing-scroll {
          position: relative;
          z-index: 2;
          padding: 0 16px 16px;
          overflow-y: auto;
          flex: 1;
        }

        /* ========== Sticky countdown ========== */
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 5;
          padding: 14px 16px;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin: 0 -16px 14px;
        }
        .countdown-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }
        .countdown-label {
          font-size: 10px;
          color: #71717A;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .countdown-time {
          font-size: 22px;
          font-weight: 800;
          color: #5DF591;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.5px;
        }
        .countdown-time.urgent {
          color: #FF5C8A;
          animation: urgent-pulse 0.8s ease-in-out infinite;
        }
        @keyframes urgent-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        .countdown-bar {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .countdown-fill {
          height: 100%;
          background: #5DF591;
          border-radius: 2px;
          transition: width 1s linear;
        }
        .countdown-fill.urgent { background: #FF5C8A; }

        /* ========== Challenge box ========== */
        .challenge-box {
          position: relative;
          margin-bottom: 16px;
          padding: 18px 16px;
          border-radius: 14px;
          background:
            linear-gradient(rgba(28,28,30,0.85), rgba(28,28,30,0.85)) padding-box,
            linear-gradient(135deg, #8B5CF6 0%, #5DF591 100%) border-box;
          border: 1.5px solid transparent;
          text-align: center;
          box-shadow:
            0 0 24px rgba(139,92,246,0.18),
            0 0 0 1px rgba(255,255,255,0.04) inset;
        }
        .challenge-eyebrow {
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #5DF591;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .challenge-text {
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.55;
          letter-spacing: -0.2px;
        }
        .challenge-stock {
          display: inline-block;
          font-weight: 800;
          background: linear-gradient(90deg, #3B7DFF, #8B5CF6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 17px;
          letter-spacing: 0.3px;
        }
        .challenge-amount {
          display: inline-block;
          font-weight: 800;
          background: linear-gradient(90deg, #5DF591, #3B7DFF);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 17px;
        }

        /* ========== Form ========== */
        .label {
          display: block;
          font-size: 12px;
          color: #A1A1AA;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .textarea {
          width: 100%;
          height: 200px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #1c1c1e;
          color: #FFFFFF;
          font-size: 14px;
          outline: none;
          resize: none;
          font-family: inherit;
          line-height: 1.55;
          transition: border-color 0.15s;
        }
        .textarea::placeholder { color: #52525B; }
        .textarea:focus { border-color: #5DF591; }
        .textarea:disabled { opacity: 0.6; }

        .char-counter {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 11px;
          color: #71717A;
          font-variant-numeric: tabular-nums;
          margin-bottom: 14px;
        }

        .btn {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .btn-primary {
          background: #5DF591;
          color: #062b13;
        }
        .btn-primary:hover:not(:disabled) { background: #1ED15F; }
        .btn-disabled {
          background: #1c1c1e;
          color: #52525B;
          cursor: not-allowed;
        }

        .writing-footer {
          text-align: center;
          font-size: 10px;
          color: #71717A;
          margin-top: 12px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
