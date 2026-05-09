// =====================================================
// FILE: src/components/solo/WelcomeScreen.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Cinematic landing — adapted from T4 PresenterLandingScreen for
//          mobile portrait. Animation timeline:
//          - 0.5s: eyebrow "DIME × AI" fades in
//          - 1.0s: "MONEY EXPO 2026" blue brand row fades up
//          - 1.4-2.3s: 4-word title rises (AI · Stock · Pitch · Battle)
//                     "Battle" has gradient mint→blue→pink + glow
//          - 2.8s: tagline fades up
//          - 3.2s: form (input + button) fades up
//          - 3.6s: footnote fades up
//          - Loop: halo spin 8s, pulse rings 4s × 3 stagger, sweep 7s, particles 6-10s
//
// Logo: uses /dime-d.png from public folder (added in T4).
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial — matches MEXPO26-PITCH-GAME-T6-mockup-v3
// =====================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { NICKNAME_MAX_LENGTH } from '@/lib/types';

type Props = {
  initialNickname: string;
  onStart: (nickname: string) => void;
};

export function WelcomeScreen({ initialNickname, onStart }: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNickname(initialNickname);
  }, [initialNickname]);

  // Inject 18 multi-color particles on mount (T4 LANDING parity)
  useEffect(() => {
    const wrap = particlesRef.current;
    if (!wrap) return;
    wrap.innerHTML = '';
    const colors = ['#5DF591', '#3B7DFF', '#FFD93D'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'welcome-particle';
      p.style.left = `${Math.random() * 100}%`;
      const c = colors[Math.floor(Math.random() * colors.length)];
      p.style.background = c;
      p.style.boxShadow = `0 0 6px ${c}`;
      p.style.animationDelay = `${Math.random() * 8}s`;
      p.style.animationDuration = `${6 + Math.random() * 4}s`;
      wrap.appendChild(p);
    }
  }, []);

  const canSubmit = nickname.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onStart(nickname);
  };

  return (
    <div className="solo-welcome">
      <div className="welcome-bg" />
      <div className="welcome-grid" />
      <div className="welcome-sweep" />
      <div className="welcome-pulse-ring" />
      <div className="welcome-pulse-ring" />
      <div className="welcome-pulse-ring" />
      <div className="welcome-particles" ref={particlesRef} />

      <div className="welcome-content">
        <div className="welcome-eyebrow">
          <span className="line" />
          DIME × AI
          <span className="line" />
        </div>

        <div className="welcome-logo">
          <div className="welcome-logo-halo" />
          <div className="welcome-logo-inner" />
        </div>

        <div className="welcome-brand-row">MONEY EXPO 2026</div>

        <div className="welcome-title">
          <span className="word">AI</span>{' '}
          <span className="word">Stock</span>
          <br />
          <span className="word">Pitch</span>{' '}
          <span className="word">Battle</span>
        </div>

        <div className="welcome-tagline">
          <span>3</span> AI JUDGES &nbsp;·&nbsp; <span>1</span> STOCK &nbsp;·&nbsp; <span>4</span> MIN
        </div>

        <div className="welcome-form">
          <input
            className="welcome-input"
            placeholder="ใส่ชื่อเล่นของคุณ"
            maxLength={NICKNAME_MAX_LENGTH}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            aria-label="Nickname"
          />
          <button
            type="button"
            className="welcome-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            เริ่มเลย →
          </button>
          <div className="welcome-footnote">FREE · NO SIGNUP · UNLIMITED PLAYS</div>
        </div>
      </div>

      <style jsx>{`
        .solo-welcome {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ========== Background layers ========== */
        .welcome-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse at 50% 50%, rgba(93,245,145,0.20) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 80%, rgba(59,125,255,0.14) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 20%, rgba(255,92,138,0.10) 0%, transparent 50%),
            #000;
        }

        .welcome-grid {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          pointer-events: none;
        }

        .welcome-sweep {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(105deg, transparent 40%, rgba(93,245,145,0.06) 50%, transparent 60%);
          animation: sweep 7s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .welcome-pulse-ring {
          position: absolute;
          width: 140px;
          height: 140px;
          border: 1px solid rgba(93,245,145,0.50);
          border-radius: 50%;
          left: 50%;
          top: 38%;
          margin: -70px 0 0 -70px;
          opacity: 0;
          animation: ring-out 4s ease-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        .welcome-pulse-ring:nth-of-type(2) { animation-delay: 1.3s; }
        .welcome-pulse-ring:nth-of-type(3) { animation-delay: 2.6s; }
        @keyframes ring-out {
          0%   { transform: scale(0.4); opacity: 0; }
          20%  { opacity: 0.6; }
          100% { transform: scale(3.5); opacity: 0; }
        }

        .welcome-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          overflow: hidden;
        }
        :global(.welcome-particle) {
          position: absolute;
          bottom: -10px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          opacity: 0;
          animation: rise-particle 8s linear infinite;
        }
        @keyframes rise-particle {
          0%   { transform: translateY(110%) scale(0); opacity: 0; }
          10%  { opacity: 1; transform: translateY(90%) scale(1); }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-10%) scale(0.5); opacity: 0; }
        }

        /* ========== Content ========== */
        .welcome-content {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
          padding: 32px 20px 20px;
          min-height: 100%;
        }

        .welcome-eyebrow {
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #5DF591;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          opacity: 0;
          animation: eyebrow-fade 4s ease-out 0.5s forwards;
        }
        .welcome-eyebrow .line {
          width: 26px;
          height: 1px;
          background: #5DF591;
        }
        @keyframes eyebrow-fade {
          0%   { opacity: 0; letter-spacing: 8px; }
          100% { opacity: 0.9; letter-spacing: 4px; }
        }

        .welcome-logo {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 18px;
        }
        .welcome-logo-halo {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #5DF591, #3B7DFF, #FF5C8A, #FFD93D, #5DF591);
          animation: halo-spin 8s linear infinite;
          filter: blur(10px);
          opacity: 0.7;
        }
        @keyframes halo-spin {
          to { transform: rotate(360deg); }
        }
        .welcome-logo-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: url('/dime-d.png') center/cover no-repeat;
          box-shadow: 0 0 20px rgba(93,245,145,0.4);
        }

        .welcome-brand-row {
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #3B7DFF;
          font-weight: 700;
          letter-spacing: 3px;
          margin-bottom: 18px;
          opacity: 0;
          animation: brand-row-fade 1.2s ease-out 1.0s forwards;
        }
        @keyframes brand-row-fade {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .welcome-title {
          font-family: 'Sora', 'IBM Plex Sans Thai', system-ui, sans-serif;
          font-weight: 800;
          font-size: 38px;
          line-height: 0.95;
          letter-spacing: -1.2px;
          margin-bottom: 16px;
          color: #fff;
        }
        .welcome-title .word {
          display: inline-block;
          opacity: 0;
          animation: word-rise 1s ease-out forwards;
        }
        .welcome-title .word:nth-child(1) { animation-delay: 1.4s; }
        .welcome-title .word:nth-child(2) { animation-delay: 1.7s; }
        .welcome-title .word:nth-child(3) { animation-delay: 2.0s; }
        .welcome-title .word:nth-child(4) {
          animation-delay: 2.3s;
          background: linear-gradient(180deg, #5DF591, #3B7DFF 60%, #FF5C8A);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 18px rgba(93,245,145,0.5));
        }
        @keyframes word-rise {
          0%   { opacity: 0; transform: translateY(28px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        .welcome-tagline {
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #A1A1AA;
          letter-spacing: 1.5px;
          opacity: 0;
          animation: tagline-fade 1s ease-out 2.8s forwards;
          margin-bottom: 28px;
        }
        .welcome-tagline span {
          color: #5DF591;
          font-weight: 600;
        }
        @keyframes tagline-fade {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .welcome-form {
          width: 100%;
          max-width: 320px;
          opacity: 0;
          animation: form-fade 1s ease-out 3.2s forwards;
        }
        @keyframes form-fade {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .welcome-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #fff;
          font-size: 15px;
          outline: none;
          font-family: inherit;
          text-align: center;
          letter-spacing: 0.5px;
          transition: all 0.2s;
          margin-bottom: 12px;
        }
        .welcome-input::placeholder {
          color: #52525B;
          letter-spacing: 1px;
        }
        .welcome-input:focus {
          border-color: #5DF591;
          background: rgba(93,245,145,0.06);
          box-shadow: 0 0 0 3px rgba(93,245,145,0.12);
        }

        .welcome-btn {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid rgba(93,245,145,0.4);
          background: linear-gradient(135deg, #5DF591, #1ED15F);
          color: #062b13;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 1px;
          cursor: pointer;
          font-family: inherit;
          text-transform: uppercase;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(93,245,145,0.25);
        }
        .welcome-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(93,245,145,0.35);
        }
        .welcome-btn:active {
          transform: translateY(0);
        }
        .welcome-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .welcome-footnote {
          margin-top: 14px;
          font-family: 'SF Mono', 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #52525B;
          letter-spacing: 2px;
          text-transform: uppercase;
          opacity: 0;
          animation: form-fade 1s ease-out 3.6s forwards;
        }
      `}</style>
    </div>
  );
}
