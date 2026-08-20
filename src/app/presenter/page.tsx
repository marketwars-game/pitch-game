// =====================================================
// FILE: src/app/presenter/page.tsx
// PROJECT: pitch-game
// TASK: T8 — LINE หาพี่มั่น (DIME x SCG)
// VERSION: T8-v1
// CREATED: 2026-05-06 (T0-v2)
// LAST MODIFIED: 2026-08-20
// PURPOSE: Next.js route /presenter — full-bleed wrapper around <PresenterView />
//          - Sets browser tab title via metadata
//          - Forces no-scroll, full-viewport (16:9 stage fills window)
//          - Hides any global chrome
//
// CHANGE LOG:
//   T8-v1 (2026-08-20): metadata งาน SCG
//   T7-v1 (2026-08-04): เปลี่ยน metadata เป็นงาน KTC
//   T4-v1 (2026-05-07): Add metadata title + full-bleed wrapper
//   T0-v2 (2026-05-06): Initial — wrapped placeholder PresenterView
// =====================================================

import type { Metadata } from 'next';
import { PresenterView } from '@/components/presenter/PresenterView';
import './presenter.css';

export const metadata: Metadata = {
  title: 'LINE หาพี่มั่น — DIME × SCG',
  description: 'Driving Execution & Change Management · SCG',
};

export default function PresenterPage() {
  return (
    <main className="presenter-page-root">
      <PresenterView />
    </main>
  );
}
