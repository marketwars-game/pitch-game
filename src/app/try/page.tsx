// =====================================================
// FILE: src/app/try/page.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Thin wrapper for /try route. Renders <SoloView />.
//          (Page Wrapper Pattern — see Tech Spec v1.10 §4.1)
// =====================================================

import { SoloView } from '@/components/solo/SoloView';

export const dynamic = 'force-dynamic';

export default function TryPage() {
  return <SoloView />;
}
