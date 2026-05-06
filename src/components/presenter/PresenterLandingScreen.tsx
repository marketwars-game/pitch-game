// =====================================================
// FILE: src/components/presenter/PresenterLandingScreen.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Phase 0 — cinematic loop displayed before game starts
//          - Logo (large) with conic-halo
//          - Staggered fade-up: eyebrow → logo → brand → title (word-by-word) → tagline → SPACE prompt
//          - 3 pulse rings + 18 multi-color particles + sweep + grid background
//          - Loops indefinitely (CSS animations)
//
//          Dismissed by parent (PresenterView) on spacebar/click.
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import {
  LANDING_PARTICLE_COUNT,
  LANDING_PARTICLE_COLORS,
} from '@/lib/presenter-config';

type Particle = {
  left: string;
  delay: string;
  duration: string;
  color: string;
};

export function PresenterLandingScreen() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: LANDING_PARTICLE_COUNT }, () => {
      const color =
        LANDING_PARTICLE_COLORS[
          Math.floor(Math.random() * LANDING_PARTICLE_COLORS.length)
        ];
      return {
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${6 + Math.random() * 4}s`,
        color,
      };
    });
  }, []);

  return (
    <div className="presenter-landing">
      <div className="presenter-landing-bg" />
      <div className="presenter-landing-grid" />
      <div className="presenter-landing-sweep" />
      <div className="presenter-pulse-ring" />
      <div className="presenter-pulse-ring" />
      <div className="presenter-pulse-ring" />

      <div className="presenter-landing-particles">
        {particles.map((p, i) => (
          <span
            key={i}
            className="presenter-landing-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        ))}
      </div>

      <div className="presenter-landing-content">
        <div className="presenter-landing-eyebrow">
          <span className="presenter-landing-line" />
          KKP DIME PRESENTS
          <span className="presenter-landing-line" />
        </div>

        <div className="presenter-landing-logo">
          <div className="presenter-landing-logo-halo" />
          <Image
            src="/dime-d.png"
            alt="Dime"
            width={140}
            height={140}
            className="presenter-landing-logo-inner"
            priority
          />
        </div>

        <div className="presenter-landing-brand-row">
          MONEY EXPO 2026 · LIVE
        </div>

        <h1 className="presenter-landing-title">
          <span className="presenter-landing-word">AI</span>{' '}
          <span className="presenter-landing-word">Stock Pitch</span>{' '}
          <span className="presenter-landing-word">Battle</span>
        </h1>

        <div className="presenter-landing-tagline">
          แข่ง pitch หุ้น 4 นาที · <span>AI 3 ท่านตัดสินสด</span>
        </div>

        <div className="presenter-landing-cta">
          <span className="presenter-kbd">SPACE</span>
          <span>กด SPACE หรือ คลิก เพื่อเริ่ม</span>
        </div>
      </div>

      <div className="presenter-landing-footer">
        <span className="presenter-landing-foot-item">CINEMATIC IDLE</span>
        <span className="presenter-landing-foot-bull" />
        <span className="presenter-landing-foot-item">LOOPS INDEFINITELY</span>
        <span className="presenter-landing-foot-bull" />
        <span className="presenter-landing-foot-item">PRESS SPACEBAR TO ENTER LOBBY</span>
      </div>
    </div>
  );
}
