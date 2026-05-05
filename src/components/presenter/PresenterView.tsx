// =====================================================
// FILE: src/components/presenter/PresenterView.tsx
// PROJECT: pitch-game
// TASK: T0 — Infra Setup (refactored T0-v2)
// VERSION: T0-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Presenter View main component (16:9 stage display) — placeholder
//          for T4 expansion. In T4 will subscribe to games.phase and render
//          appropriate stage view (Lobby + QR / Countdown / Judging / Leaderboard).
//
// CHANGE LOG:
//   T0-v2 (2026-05-06): Initial extraction from src/app/presenter/page.tsx
// =====================================================
export function PresenterView() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 text-center">
      <div className="mb-2 text-sm uppercase tracking-[0.3em] text-white/30">
        DIME x AI — MONEY EXPO 2026
      </div>
      <h1
        className="mb-4 text-6xl font-medium"
        style={{ color: 'var(--dime-cyan)' }}
      >
        AI Stock Pitch Battle
      </h1>

      <div className="mt-12 max-w-2xl rounded-xl border border-white/10 bg-white/5 px-12 py-10">
        <div className="mb-2 text-4xl">🚧</div>
        <div className="text-xl text-white/60">Presenter View</div>
        <div className="mt-1 text-sm text-white/30">
          Placeholder — coming in T4
        </div>
      </div>
    </main>
  );
}
