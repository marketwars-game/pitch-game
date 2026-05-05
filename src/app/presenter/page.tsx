// =====================================================
// FILE: src/app/presenter/page.tsx
// PROJECT: pitch-game
// TASK: T0 — Infra Setup (refactored T0-v2)
// VERSION: T0-v2
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-05-06
// PURPOSE: Next.js route wrapper for /presenter — delegates to <PresenterView />
//          Wrapper stays thin; all logic lives in PresenterView component.
//
// CHANGE LOG:
//   T0-v2 (2026-05-06): Refactor to Page Wrapper Pattern (Tech Spec v1.2 §1.9)
//   T0-v1 (2026-05-05): Initial inline placeholder
// =====================================================
import { PresenterView } from '@/components/presenter/PresenterView';

export default function PresenterPage() {
  return <PresenterView />;
}
