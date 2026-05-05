// =====================================================
// FILE: src/app/play/page.tsx
// PROJECT: pitch-game
// TASK: T0 — Infra Setup (refactored T0-v2)
// VERSION: T0-v2
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-05-06
// PURPOSE: Next.js route wrapper for /play — delegates to <PlayerView />
//          Wrapper stays thin; all logic lives in PlayerView component.
//
// CHANGE LOG:
//   T0-v2 (2026-05-06): Refactor to Page Wrapper Pattern (Tech Spec v1.2 §1.9)
//   T0-v1 (2026-05-05): Initial inline placeholder
// =====================================================
import { PlayerView } from '@/components/player/PlayerView';

export default function PlayPage() {
  return <PlayerView />;
}
