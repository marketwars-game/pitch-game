// =====================================================
// FILE: src/components/admin/AdminPanel.tsx
// PROJECT: pitch-game
// TASK: T0 — Infra Setup (refactored T0-v2)
// VERSION: T0-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Admin Panel main component — placeholder for T2 expansion.
//          In T2 will gate via password, then render phase controls + player list.
//          In T3 will add "Start Judging" button to trigger /api/judge.
//
// CHANGE LOG:
//   T0-v2 (2026-05-06): Initial extraction from src/app/admin/page.tsx
// =====================================================
export function AdminPanel() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-2 text-xs uppercase tracking-widest text-white/40">
        Admin Control Panel
      </div>
      <h1 className="mb-8 text-2xl font-medium text-white/80">
        AI Stock Pitch Battle
      </h1>

      <div className="max-w-md rounded-xl border border-white/10 bg-white/5 px-6 py-8">
        <div className="mb-2 text-2xl">🚧</div>
        <div className="text-sm text-white/60">Admin Panel</div>
        <div className="mt-1 text-xs text-white/30">
          Placeholder — coming in T2
        </div>
      </div>
    </main>
  );
}
