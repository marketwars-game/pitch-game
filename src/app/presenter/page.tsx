// =====================================================
// FILE: src/app/presenter/page.tsx
// PROJECT: pitch-game
// TASK: T9 — LINE หาพี่ชัวร์ (DIME x AXA Data & AI Week 2026)
// VERSION: T9-v1
// CREATED: 2026-05-06 (T0-v2)
// LAST MODIFIED: 2026-09-20
// PURPOSE: Next.js route /presenter — full-bleed wrapper around <PresenterView />
//          - Sets browser tab title via metadata
//          - Forces no-scroll, full-viewport (16:9 stage fills window)
//          - Hides any global chrome
//
// CHANGE LOG:
//   T9-v1 (2026-09-20): metadata เวอร์ชัน AXA
//   T8-v1 (2026-08-20): metadata งาน SCG
//   T7-v1 (2026-08-04): เปลี่ยน metadata เป็นงาน KTC
//   T4-v1 (2026-05-07): Add metadata title + full-bleed wrapper
//   T0-v2 (2026-05-06): Initial — wrapped placeholder PresenterView
// =====================================================

import type { Metadata } from 'next';
import { PresenterView } from '@/components/presenter/PresenterView';
import './presenter.css';

export const metadata: Metadata = {
  title: 'LINE หาพี่ชัวร์ — DIME × AXA',
  description: 'AXA Data & AI Week 2026',
};

export default function PresenterPage() {
  return (
    <main className="presenter-page-root">
      <PresenterView />
    </main>
  );
}
