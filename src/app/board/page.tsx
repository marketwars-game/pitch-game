// =====================================================
// FILE: src/app/board/page.tsx
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Thin wrapper for /board route. Renders <BoardView />.
//          (Page Wrapper Pattern — see Tech Spec v1.10 §4.1)
// =====================================================

import { BoardView } from '@/components/board/BoardView';

export const dynamic = 'force-dynamic';

export default function BoardPage() {
  return <BoardView />;
}
