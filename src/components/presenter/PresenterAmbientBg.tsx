// =====================================================
// FILE: src/components/presenter/PresenterAmbientBg.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Background layers for in-game phases (LOBBY/WRITING/JUDGING/RESULTS)
//          - drifting ambient orbs (cyan/red/gold)
//          - subtle grid (masked center bright)
//          - slow sweep light
//          - rising particles (12 count, 70% intensity vs LANDING)
//          - grain overlay
//
// All animations are CSS-only (transform + opacity) for 60fps composite layer perf.
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import { useMemo } from 'react';
import { BG_PARTICLE_COUNT } from '@/lib/presenter-config';

type Particle = {
  left: string;
  delay: string;
  duration: string;
};

export function PresenterAmbientBg() {
  // generate particle positions once per mount (stable across re-renders)
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: BG_PARTICLE_COUNT }, () => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 14}s`,
      duration: `${12 + Math.random() * 6}s`,
    }));
  }, []);

  return (
    <>
      <div className="presenter-bg-ambient" aria-hidden="true" />
      <div className="presenter-bg-orb-3" aria-hidden="true" />
      <div className="presenter-bg-grid" aria-hidden="true" />
      <div className="presenter-bg-sweep" aria-hidden="true" />
      <div className="presenter-bg-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            className="presenter-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>
      <div className="presenter-bg-grain" aria-hidden="true" />
    </>
  );
}
