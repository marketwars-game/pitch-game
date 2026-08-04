// =====================================================
// FILE: src/app/presenter/page.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-06 (T0-v2)
// LAST MODIFIED: 2026-05-07
// PURPOSE: Next.js route /presenter — full-bleed wrapper around <PresenterView />
//          - Sets browser tab title via metadata
//          - Forces no-scroll, full-viewport (16:9 stage fills window)
//          - Hides any global chrome
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): เปลี่ยน metadata เป็นงาน KTC
//   T4-v1 (2026-05-07): Add metadata title + full-bleed wrapper
//   T0-v2 (2026-05-06): Initial — wrapped placeholder PresenterView
// =====================================================

import type { Metadata } from 'next';
import { PresenterView } from '@/components/presenter/PresenterView';
import './presenter.css';

export const metadata: Metadata = {
  title: 'LINE หาพี่เก่ง — DIME × KTC',
  description: 'Investment Made Simple · KTC',
};

export default function PresenterPage() {
  return (
    <main className="presenter-page-root">
      <PresenterView />
    </main>
  );
}
